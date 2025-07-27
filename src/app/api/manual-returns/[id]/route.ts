import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import prisma from "@/lib/prisma";
import { UpdateManualReturnData } from "@/types/patient";

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

    const data: UpdateManualReturnData = await request.json();

    const updateData: UpdateManualReturnData & { reviewedBy?: string; approvalDate?: Date } = { ...data };
    
    // If approving or rejecting, set reviewedBy and approvalDate
    if (data.status === "APPROVED" || data.status === "REJECTED") {
      updateData.reviewedBy = session.user.id;
      updateData.approvalDate = new Date();
    }

    const manualReturn = await prisma.manualReturn.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          include: {
            bed: true,
          },
        },
        supplies: true,
      },
    });

    return NextResponse.json(manualReturn);
  } catch (error) {
    console.error("Error updating manual return:", error);
    return NextResponse.json(
      { error: "Failed to update manual return" },
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

    await prisma.manualReturn.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting manual return:", error);
    return NextResponse.json(
      { error: "Failed to delete manual return" },
      { status: 500 }
    );
  }
}