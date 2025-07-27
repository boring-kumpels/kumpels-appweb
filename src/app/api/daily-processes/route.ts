import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { DailyProcessStatus } from "@/types/patient";

// GET /api/daily-processes - List daily processes
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
    const date = searchParams.get("date");
    const status = searchParams.get("status") as DailyProcessStatus;
    const startedBy = searchParams.get("startedBy");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (date) where.date = new Date(date);
    if (status) where.status = status;
    if (startedBy) where.startedBy = startedBy;

    const processes = await prisma.dailyProcess.findMany({
      where,
      include: {
        medicationProcesses: {
          include: {
            patient: {
              include: {
                bed: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(processes);
  } catch (error) {
    console.error("Error fetching daily processes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/daily-processes - Update a daily process
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check role
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Only PHARMACY_REGENT and SUPERADMIN can update daily processes
    if (
      userProfile.role !== "PHARMACY_REGENT" &&
      userProfile.role !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        { error: "Only pharmacy regents can update daily processes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status, completedAt, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Process ID is required" }, { status: 400 });
    }

    // Get the existing process
    const existingProcess = await prisma.dailyProcess.findUnique({
      where: { id },
    });

    if (!existingProcess) {
      return NextResponse.json(
        { error: "Daily process not found" },
        { status: 404 }
      );
    }

    // If canceling, check if any predespacho has been completed
    if (status === DailyProcessStatus.CANCELLED) {
      const completedPredespachos = await prisma.medicationProcess.findMany({
        where: {
          dailyProcessId: id,
          step: "PREDESPACHO",
          status: "COMPLETED",
        },
      });

      if (completedPredespachos.length > 0) {
        return NextResponse.json(
          { error: "Cannot cancel process with completed predespachos" },
          { status: 400 }
        );
      }
    }

    // Update the daily process
    const updatedProcess = await prisma.dailyProcess.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(completedAt && { completedAt: new Date(completedAt) }),
        ...(notes && { notes }),
      },
      include: {
        medicationProcesses: {
          include: {
            patient: {
              include: {
                bed: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedProcess);
  } catch (error) {
    console.error("Error updating daily process:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/daily-processes - Start a new daily process
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check role
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Only PHARMACY_REGENT can start daily processes
    if (
      userProfile.role !== "PHARMACY_REGENT" &&
      userProfile.role !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        { error: "Only pharmacy regents can start daily processes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { date, notes } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const processDate = new Date(date);
    processDate.setHours(0, 0, 0, 0); // Set to start of day

    // Check if daily process already exists for this date
    const existingProcess = await prisma.dailyProcess.findUnique({
      where: { date: processDate },
    });

    if (existingProcess) {
      return NextResponse.json(
        { error: "Daily process already exists for this date" },
        { status: 409 }
      );
    }

    // Create new daily process (without automatically creating medication processes)
    const dailyProcess = await prisma.dailyProcess.create({
      data: {
        date: processDate,
        startedBy: session.user.id,
        notes,
        status: DailyProcessStatus.ACTIVE,
      },
      include: {
        medicationProcesses: {
          include: {
            patient: {
              include: {
                bed: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(dailyProcess, { status: 201 });
  } catch (error) {
    console.error("Error creating daily process:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
