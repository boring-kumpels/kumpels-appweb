import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ProcessStatus } from "@/types/patient";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (error || !user) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // Get user profile to check role
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile || profile.role !== "PHARMACY_REGENT") {
      return NextResponse.json(
        {
          error: "Solo los regentes de farmacia pueden completar la recepción",
        },
        { status: 403 }
      );
    }

    const { patientId, medicationProcessId } = await request.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "ID del paciente es requerido" },
        { status: 400 }
      );
    }

    if (!medicationProcessId) {
      return NextResponse.json(
        { error: "ID del proceso de medicación es requerido" },
        { status: 400 }
      );
    }

    // Find the devolution process
    const devolutionProcess = await prisma.medicationProcess.findUnique({
      where: { id: medicationProcessId },
      include: {
        patient: {
          include: {
            bed: true,
            service: {
              include: {
                line: true,
              },
            },
          },
        },
      },
    });

    if (!devolutionProcess) {
      return NextResponse.json(
        { error: "Proceso de devolución no encontrado" },
        { status: 404 }
      );
    }

    if (devolutionProcess.step !== "DEVOLUCION") {
      return NextResponse.json(
        { error: "Este no es un proceso de devolución" },
        { status: 400 }
      );
    }

    if (devolutionProcess.status !== ProcessStatus.DELIVERED_TO_SERVICE) {
      return NextResponse.json(
        {
          error:
            "El proceso debe estar en estado DELIVERED_TO_SERVICE para completar la recepción",
        },
        { status: 400 }
      );
    }

    // Update the devolution process to COMPLETED
    const updatedProcess = await prisma.medicationProcess.update({
      where: { id: medicationProcessId },
      data: {
        status: ProcessStatus.COMPLETED,
        completedAt: new Date(),
        completedBy: user.id,
        updatedAt: new Date(),
      },
      include: {
        patient: {
          include: {
            bed: true,
            service: {
              include: {
                line: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Recepción de devolución completada para el paciente ${devolutionProcess.patient.firstName} ${devolutionProcess.patient.lastName}`,
      process: updatedProcess,
    });
  } catch (error) {
    console.error("Error completing devolution reception:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
