import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ProcessStatus, MedicationProcessStep } from "@/types/patient";
import {
  LogType as PrismaLogType,
  MedicationProcessStep as PrismaMedicationProcessStep,
} from "@prisma/client";

// GET /api/medication-processes - Get medication processes with filters
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
    const patientId = searchParams.get("patientId");
    const step = searchParams.get("step");
    const status = searchParams.get("status");
    const dailyProcessId = searchParams.get("dailyProcessId");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (patientId) where.patientId = patientId;
    if (step) where.step = step as MedicationProcessStep;
    if (status) where.status = status as ProcessStatus;
    if (dailyProcessId) where.dailyProcessId = dailyProcessId;

    const processes = await prisma.medicationProcess.findMany({
      where,
      include: {
        patient: {
          include: {
            bed: true,
          },
        },
        dailyProcess: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(processes);
  } catch (error) {
    console.error("Error fetching medication processes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/medication-processes - Create a new medication process
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

    const body = await request.json();
    const { patientId, step, dailyProcessId, notes, status } = body;

    // Validate required fields
    if (!patientId || !step) {
      return NextResponse.json(
        { error: "Patient ID and step are required" },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check if daily process exists if provided
    if (dailyProcessId) {
      const dailyProcess = await prisma.dailyProcess.findUnique({
        where: { id: dailyProcessId },
      });

      if (!dailyProcess) {
        return NextResponse.json(
          { error: "Daily process not found" },
          { status: 404 }
        );
      }
    }

    // Check if process already exists for this patient, step, and daily process
    const existingProcess = await prisma.medicationProcess.findFirst({
      where: {
        patientId,
        step: step as MedicationProcessStep,
        dailyProcessId: dailyProcessId || null,
      },
    });

    if (existingProcess) {
      return NextResponse.json(
        { error: "Process already exists for this patient and step" },
        { status: 409 }
      );
    }

    // Get user profile for logging
    const userProfileForLogging = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    // Create the medication process
    const processData: {
      patientId: string;
      step: MedicationProcessStep;
      dailyProcessId: string | null;
      status: ProcessStatus;
      notes: string | null;
      startedAt?: Date;
      startedBy?: string;
    } = {
      patientId,
      step: step as MedicationProcessStep,
      dailyProcessId: dailyProcessId || null,
      status: (status as ProcessStatus) || ProcessStatus.PENDING,
      notes: notes || null,
    };

    // If creating with IN_PROGRESS status, set started fields
    if (status === ProcessStatus.IN_PROGRESS) {
      processData.startedAt = new Date();
      processData.startedBy = session.user.id;
    }

    const process = await prisma.medicationProcess.create({
      data: processData,
      include: {
        patient: {
          include: {
            bed: true,
          },
        },
        dailyProcess: true,
      },
    });

    // Create automatic log entry for process creation
    if (userProfileForLogging) {
      const stepName = getStepDisplayName(step as PrismaMedicationProcessStep);
      try {
        await prisma.processErrorLog.create({
          data: {
            patientId: process.patientId,
            medicationProcessId: process.id,
            step: process.step,
            logType: PrismaLogType.INFO,
            message: `${stepName} creado`,
            reportedBy: session.user.id,
            reportedByRole: userProfileForLogging.role,
          },
        });
      } catch (logError) {
        console.error("Error creating process creation log:", logError);
        // Don't fail the main operation if logging fails
      }
    }

    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    console.error("Error creating medication process:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to get step display name
function getStepDisplayName(step: PrismaMedicationProcessStep): string {
  switch (step) {
    case PrismaMedicationProcessStep.PREDESPACHO:
      return "Predespacho";
    case PrismaMedicationProcessStep.ALISTAMIENTO:
      return "Alistamiento";
    case PrismaMedicationProcessStep.VALIDACION:
      return "Validación";
    case PrismaMedicationProcessStep.ENTREGA:
      return "Entrega";
    case PrismaMedicationProcessStep.DEVOLUCION:
      return "Devolución";
    default:
      return "Proceso";
  }
}
