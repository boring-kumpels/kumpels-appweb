import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  updateUserFormSchema,
  type UserResponse,
} from "@/types/user-management";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET - Get single user by ID
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params;
    const userId = params.id;

    // Get auth user
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authUser.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const response: UserResponse = {
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in user GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params;
    const userId = params.id;
    const body = await request.json();
    const validationResult = updateUserFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { firstName, lastName, role, active } = validationResult.data;

    // Check if user exists
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authUser.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update profile
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        firstName,
        lastName,
        role,
        active,
      },
    });

    const response: UserResponse = {
      user: {
        id: authUser.user.id,
        email: authUser.user.email || "",
        profile: {
          id: updatedProfile.id,
          firstName: updatedProfile.firstName ?? undefined,
          lastName: updatedProfile.lastName ?? undefined,
          role: updatedProfile.role,
          active: updatedProfile.active,
          createdAt: updatedProfile.createdAt,
          updatedAt: updatedProfile.updatedAt,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in user PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params;
    const userId = params.id;

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authUser.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete profile first (due to foreign key)
    await prisma.profile.delete({
      where: { userId },
    });

    // Delete auth user
    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("Error deleting auth user:", deleteAuthError);
      // Profile is already deleted, so this is a partial failure
      return NextResponse.json(
        { error: "User account partially deleted" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in user DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
