import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { updateUserPasswordSchema } from "@/types/user-management";
import { saltAndHashPassword } from "@/lib/auth/password-crypto-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// PUT - Reset user password
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
    const validationResult = updateUserPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { password } = validationResult.data;

    // Get user to verify they exist and get their email
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authUser.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash the new password with user's email as salt
    const hashedPassword = saltAndHashPassword(
      password,
      authUser.user.email || ""
    );

    // Update password in Supabase Auth
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: hashedPassword,
      });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Password updated successfully",
      temporaryPassword: password, // Return for admin to share with user
    });
  } catch (error) {
    console.error("Error in password reset:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
