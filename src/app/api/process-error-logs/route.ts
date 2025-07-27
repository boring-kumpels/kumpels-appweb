import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import prisma from "@/lib/prisma";
import { CreateProcessErrorLogData, ProcessErrorLogFilters, LogType, MedicationProcessStep } from "@/types/patient";

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
    const includeResolved = searchParams.get("includeResolved") === "true";
    const filters: ProcessErrorLogFilters = {
      patientId: searchParams.get("patientId") || undefined,
      medicationProcessId: searchParams.get("medicationProcessId") || undefined,
      step: (searchParams.get("step") as MedicationProcessStep) || undefined,
      logType: searchParams.get("logType") as LogType || undefined,
    };

    const where: {
      patientId?: string;
      medicationProcessId?: string;
      step?: MedicationProcessStep;
      logType?: LogType;
      resolvedAt?: null;
    } = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.medicationProcessId) where.medicationProcessId = filters.medicationProcessId;
    if (filters.step) where.step = filters.step;
    if (filters.logType) where.logType = filters.logType;
    if (!includeResolved && filters.resolvedAt === undefined) {
      // Only show unresolved logs by default (unless includeResolved is true)
      where.resolvedAt = null;
    }

    const errorLogs = await prisma.processErrorLog.findMany({
      where,
      include: {
        patient: {
          include: {
            bed: true,
          },
        },
        medicationProcess: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(errorLogs);
  } catch (error) {
    console.error("Error fetching error logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch error logs" },
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

    // Get user profile to determine role
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const data: CreateProcessErrorLogData = await request.json();

    const errorLog = await prisma.processErrorLog.create({
      data: {
        patientId: data.patientId,
        medicationProcessId: data.medicationProcessId,
        step: data.step,
        logType: data.logType,
        message: data.message,
        reportedBy: session.user.id,
        reportedByRole: profile.role,
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

    return NextResponse.json(errorLog, { status: 201 });
  } catch (error) {
    console.error("Error creating error log:", error);
    return NextResponse.json(
      { error: "Failed to create error log" },
      { status: 500 }
    );
  }
}