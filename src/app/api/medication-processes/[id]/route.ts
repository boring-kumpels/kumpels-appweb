import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ProcessStatus as PrismaProcessStatus, MedicationProcessStep as PrismaMedicationProcessStep, LogType as PrismaLogType } from "@prisma/client";

// GET /api/medication-processes/[id] - Get a specific medication process
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const process = await prisma.medicationProcess.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            bed: true,
          },
        },
      },
    });

    if (!process) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 });
    }

    return NextResponse.json(process);
  } catch (error) {
    console.error("Error fetching medication process:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/medication-processes/[id] - Update a medication process
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { status, notes } = body;
    
    const { id } = await params;

    // Get current process with retry logic for race conditions
    let currentProcess = await prisma.medicationProcess.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            bed: true,
          },
        },
      },
    });

    if (!currentProcess) {
      // Double-check if this might be a race condition - try once more
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      currentProcess = await prisma.medicationProcess.findUnique({
        where: { id },
        include: {
          patient: {
            include: {
              bed: true,
            },
          },
        },
      });
      
      if (!currentProcess) {
        return NextResponse.json({ 
          error: "Process not found", 
          details: "El proceso puede haber sido eliminado o modificado por otro usuario."
        }, { status: 404 });
      }
    }

    // Role-based validation
    const canUpdate = validateProcessUpdate(
      currentProcess.step,
      userProfile.role,
      currentProcess.status,
      status
    );

    if (!canUpdate) {
      return NextResponse.json(
        { error: "Insufficient permissions to update this process" },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Handle timing updates based on status change
    if (status === PrismaProcessStatus.IN_PROGRESS && !currentProcess.startedAt) {
      updateData.startedAt = new Date();
      updateData.startedBy = session.user.id;
    }

    if (status === PrismaProcessStatus.COMPLETED && !currentProcess.completedAt) {
      updateData.completedAt = new Date();
      updateData.completedBy = session.user.id;
    }

    // Update the process
    const updatedProcess = await prisma.medicationProcess.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          include: {
            bed: true,
          },
        },
      },
    });

    // Create automatic status change log entries
    if (status && status !== currentProcess.status) {
      const stepName = getStepDisplayName(currentProcess.step);
      let message = "";
      
      if (status === PrismaProcessStatus.IN_PROGRESS) {
        message = `${stepName} iniciado`;
      } else if (status === PrismaProcessStatus.COMPLETED) {
        message = `${stepName} completado`;
      } else if (status === PrismaProcessStatus.ERROR) {
        message = `${stepName} marcado con error`;
      } else if (status === PrismaProcessStatus.PENDING) {
        message = `${stepName} reiniciado`;
      }

      if (message) {
        try {
          await prisma.processErrorLog.create({
            data: {
              patientId: currentProcess.patientId,
              medicationProcessId: currentProcess.id,
              step: currentProcess.step,
              logType: PrismaLogType.INFO,
              message: message,
              reportedBy: session.user.id,
              reportedByRole: userProfile.role,
            },
          });
        } catch (logError) {
          console.error("Error creating status change log:", logError);
          // Don't fail the main operation if logging fails
        }
      }
    }

    return NextResponse.json(updatedProcess);
  } catch (error) {
    console.error("Error updating medication process:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/medication-processes/[id] - Delete a medication process
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!userProfile || userProfile.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;

    await prisma.medicationProcess.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Process deleted successfully" });
  } catch (error) {
    console.error("Error deleting medication process:", error);
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

// Helper function to validate process updates based on role and step
function validateProcessUpdate(
  step: PrismaMedicationProcessStep,
  userRole: string,
  currentStatus: PrismaProcessStatus,
  newStatus: PrismaProcessStatus
): boolean {
  // SUPERADMIN can do anything
  if (userRole === "SUPERADMIN") return true;

  // Role-based permissions for each step
  switch (step) {
    case PrismaMedicationProcessStep.PREDESPACHO:
      // Only PHARMACY_REGENT can handle predespacho
      if (userRole !== "PHARMACY_REGENT") return false;
      break;

    case PrismaMedicationProcessStep.ALISTAMIENTO:
      // PHARMACY_REGENT can handle alistamiento
      if (userRole !== "PHARMACY_REGENT") return false;
      break;

    case PrismaMedicationProcessStep.VALIDACION:
      // Only PHARMACY_VALIDATOR can handle validacion
      if (userRole !== "PHARMACY_VALIDATOR") return false;
      break;

    case PrismaMedicationProcessStep.ENTREGA:
    case PrismaMedicationProcessStep.DEVOLUCION:
      // NURSE can handle entrega and devolucion
      if (userRole !== "NURSE") return false;
      break;

    default:
      return false;
  }

  // Status transition validation
  const validTransitions: Record<PrismaProcessStatus, PrismaProcessStatus[]> = {
    [PrismaProcessStatus.PENDING]: [PrismaProcessStatus.IN_PROGRESS, PrismaProcessStatus.ERROR],
    [PrismaProcessStatus.IN_PROGRESS]: [PrismaProcessStatus.COMPLETED, PrismaProcessStatus.ERROR],
    [PrismaProcessStatus.COMPLETED]: [PrismaProcessStatus.ERROR], // Can only change to error if completed
    [PrismaProcessStatus.ERROR]: [PrismaProcessStatus.PENDING, PrismaProcessStatus.IN_PROGRESS], // Can retry from error
  };

  const allowedTransitions = validTransitions[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}
