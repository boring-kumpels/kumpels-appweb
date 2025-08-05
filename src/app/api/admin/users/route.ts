import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  createUserFormSchema,
  type UsersListResponse,
  type UserCreationResponse,
  type UserWithProfile,
} from "@/types/user-management";

import { supabaseAdmin } from "@/lib/supabase/admin";

// GET - List all users with pagination
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Admin users API called");

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY not found in environment");
      return NextResponse.json(
        { error: "Server configuration error: Missing service role key" },
        { status: 500 }
      );
    }

    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log("🔍 Session check:", session ? "✅ Found" : "❌ Not found");

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is SUPERADMIN
    console.log("🔍 Checking user role for:", session.user.id);
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { role: true },
    });

    console.log("🔍 User profile:", currentUserProfile);

    if (currentUserProfile?.role !== "SUPERADMIN") {
      console.log("❌ User is not SUPERADMIN:", currentUserProfile?.role);
      return NextResponse.json(
        { error: "Forbidden - SUPERADMIN access required" },
        { status: 403 }
      );
    }

    console.log("✅ User is SUPERADMIN, proceeding...");

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = Math.min(
      parseInt(url.searchParams.get("pageSize") || "10"),
      50
    );
    const search = url.searchParams.get("search") || "";

    // Get users from Supabase Auth
    const { data: authUsers, error: authError } =
      await supabaseAdmin().auth.admin.listUsers({
        page: page,
        perPage: pageSize,
      });

    if (authError) {
      console.error("Error fetching users from Supabase:", authError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Get total count
    const { data: totalUsersData } =
      await supabaseAdmin().auth.admin.listUsers();
    const totalUsers = totalUsersData?.users?.length || 0;

    // Get profiles from database
    const profiles = await prisma.profile.findMany({
      where: {
        userId: {
          in: authUsers.users.map((user) => user.id),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Combine auth users with profiles
    const users = authUsers.users.map((authUser) => {
      const profile = profiles.find((p) => p.userId === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        fullName: profile?.fullName || "N/A",
        role: profile?.role || "USER",
        createdAt: authUser.created_at,
        updatedAt: profile?.updatedAt || authUser.updated_at,
        lastSignIn: authUser.last_sign_in_at,
        emailConfirmed: authUser.email_confirmed_at !== null,
      };
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit: pageSize,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is SUPERADMIN
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { role: true },
    });

    if (currentUserProfile?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden - SUPERADMIN access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = createUserFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, role, active } =
      validationResult.data;

    // Create auth user with plain password - let Supabase handle hashing
    const { data: authUser, error: authError } =
      await supabaseAdmin().auth.admin.createUser({
        email,
        password: password, // Send plain password to Supabase
        email_confirm: true, // Auto-confirm email as requested
      });

    if (authError || !authUser.user) {
      console.error("Error creating auth user:", authError);
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    // Create profile
    const profile = await prisma.profile.create({
      data: {
        userId: authUser.user.id,
        firstName,
        lastName,
        role,
        active,
      },
    });

    const response: UserCreationResponse = {
      user: {
        id: authUser.user.id,
        email: authUser.user.email || "",
        profile: {
          id: profile.id,
          firstName: profile.firstName ?? undefined,
          lastName: profile.lastName ?? undefined,
          role: profile.role,
          active: profile.active,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        },
      },
      temporaryPassword: password, // Return for admin to share with user
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error in users POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
