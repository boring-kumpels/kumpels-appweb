import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import prisma from "@/lib/prisma";
import { CreateManualReturnData, ManualReturnFilters, ManualReturnStatus } from "@/types/patient";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters: ManualReturnFilters = {
      patientId: searchParams.get("patientId") || undefined,
      status: searchParams.get("status") as ManualReturnStatus || undefined,
      generatedBy: searchParams.get("generatedBy") || undefined,
      reviewedBy: searchParams.get("reviewedBy") || undefined,
    };

    const where: {
      patientId?: string;
      status?: ManualReturnStatus;
      generatedBy?: string;
      reviewedBy?: string;
    } = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.status) where.status = filters.status;
    if (filters.generatedBy) where.generatedBy = filters.generatedBy;
    if (filters.reviewedBy) where.reviewedBy = filters.reviewedBy;

    const manualReturns = await prisma.manualReturn.findMany({
      where,
      include: {
        patient: {
          include: {
            bed: true,
          },
        },
        supplies: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(manualReturns);
  } catch (error) {
    console.error("Error fetching manual returns:", error);
    return NextResponse.json(
      { error: "Failed to fetch manual returns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: CreateManualReturnData = await request.json();

    const manualReturn = await prisma.manualReturn.create({
      data: {
        patientId: data.patientId,
        generatedBy: session.user.id,
        cause: data.cause,
        comments: data.comments,
        supplies: {
          create: data.supplies.map(supply => ({
            supplyCode: supply.supplyCode,
            supplyName: supply.supplyName,
            quantityReturned: supply.quantityReturned,
          })),
        },
      },
      include: {
        patient: {
          include: {
            bed: true,
          },
        },
        supplies: true,
      },
    });

    return NextResponse.json(manualReturn, { status: 201 });
  } catch (error) {
    console.error("Error creating manual return:", error);
    return NextResponse.json(
      { error: "Failed to create manual return" },
      { status: 500 }
    );
  }
}