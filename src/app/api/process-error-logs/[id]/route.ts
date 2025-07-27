import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import prisma from "@/lib/prisma";
import { UpdateProcessErrorLogData } from "@/types/patient";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: UpdateProcessErrorLogData = await request.json();

    const errorLog = await prisma.processErrorLog.update({
      where: { id },
      data: {
        ...data,
        resolvedBy: data.resolvedAt ? session.user.id : undefined,
      },
      include: {
        patient: {
          include: {
            bed: true,
          },
        },
        medicationProcess: true,
      },
    });

    return NextResponse.json(errorLog);
  } catch (error) {
    console.error("Error updating error log:", error);
    return NextResponse.json(
      { error: "Failed to update error log" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.processErrorLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting error log:", error);
    return NextResponse.json(
      { error: "Failed to delete error log" },
      { status: 500 }
    );
  }
}