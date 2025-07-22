import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userId = (await params).userId;

    // Create Supabase client with awaited cookies
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Only allow users to view their own profile (or admin users to view any profile)
    const currentUser = session.user;
    const userProfile = await prisma.profile.findUnique({
      where: { userId: currentUser.id },
    });

    if (userId !== currentUser.id && userProfile?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized to view this profile" },
        { status: 403 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userId = (await params).userId;

    // Create Supabase client with awaited cookies
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Only allow users to update their own profile (or admin users to update any profile)
    const currentUser = session.user;
    const userProfile = await prisma.profile.findUnique({
      where: { userId: currentUser.id },
    });

    if (userId !== currentUser.id && userProfile?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized to update this profile" },
        { status: 403 }
      );
    }

    const json = await request.json();

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        firstName: json.firstName || undefined,
        lastName: json.lastName || undefined,
        avatarUrl: json.avatarUrl || undefined,
        active: json.active !== undefined ? json.active : undefined,
      },
    });

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userId = (await params).userId;

    // Create Supabase client with awaited cookies
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get current user's profile to check permissions
    const currentUser = session.user;
    const userProfile = await prisma.profile.findUnique({
      where: { userId: currentUser.id },
    });

    // Only allow users to update their own profile OR allow SUPERADMIN to update any profile
    if (userId !== currentUser.id && userProfile?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized to update this profile" },
        { status: 403 }
      );
    }

    const json = await request.json();

    // Build update data object
    const updateData: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      active?: boolean;
      role?: string;
    } = {};

    // Standard profile fields
    if (json.firstName !== undefined) updateData.firstName = json.firstName;
    if (json.lastName !== undefined) updateData.lastName = json.lastName;
    if (json.avatarUrl !== undefined) updateData.avatarUrl = json.avatarUrl;
    if (json.active !== undefined) updateData.active = json.active;

    // Role updates (only for SUPERADMIN or self-updates for demo purposes)
    if (json.role !== undefined) {
      // Allow role updates for SUPERADMIN users or self-updates (for demo)
      if (userProfile?.role === "SUPERADMIN" || userId === currentUser.id) {
        updateData.role = json.role;
      } else {
        return NextResponse.json(
          { error: "Unauthorized to update role" },
          { status: 403 }
        );
      }
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
