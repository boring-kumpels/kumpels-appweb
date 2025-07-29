import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { MedicationProcessStep, ProcessStatus } from "@/types/patient";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const { lineId, processDate } = await request.json();

    if (!lineId || !processDate) {
      return NextResponse.json(
        { error: "lineId y processDate son requeridos" },
        { status: 400 }
      );
    }

    // Get the daily process for the given date
    const targetDate = new Date(processDate);
    const dailyProcess = await prisma.dailyProcess.findFirst({
      where: {
        date: {
          gte: new Date(targetDate.toISOString().split('T')[0]),
          lt: new Date(new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        },
      },
    });

    if (!dailyProcess) {
      return NextResponse.json(
        { error: "No se encontró un proceso diario para la fecha especificada" },
        { status: 404 }
      );
    }

    // Get all patients in the specified line that have completed ENTREGA step
    const patientsInLine = await prisma.patient.findMany({
      where: {
        status: "ACTIVE",
        service: {
          lineId: lineId,
        },
      },
      include: {
        service: {
          include: {
            line: true,
          },
        },
        medicationProcesses: {
          where: {
            dailyProcessId: dailyProcess.id,
            step: MedicationProcessStep.ENTREGA,
            status: ProcessStatus.COMPLETED,
          },
        },
      },
    });

    // Filter patients that have completed ENTREGA but not yet marked as pharmacy dispatch
    const eligiblePatients = patientsInLine.filter(
      (patient) => patient.medicationProcesses.length > 0
    );

    if (eligiblePatients.length === 0) {
      return NextResponse.json(
        { error: "No hay pacientes elegibles para salida de farmacia en esta línea" },
        { status: 400 }
      );
    }

    // Create or update the medication processes to mark pharmacy dispatch
    const updatePromises = eligiblePatients.map(async (patient) => {
      // Check if there's already a pharmacy dispatch process
      const existingProcess = await prisma.medicationProcess.findFirst({
        where: {
          patientId: patient.id,
          dailyProcessId: dailyProcess.id,
          step: MedicationProcessStep.ENTREGA,
          status: ProcessStatus.COMPLETED,
        },
      });

      if (existingProcess) {
        // Update existing process to DISPATCHED_FROM_PHARMACY status
        return prisma.medicationProcess.update({
          where: { id: existingProcess.id },
          data: {
            status: "DISPATCHED_FROM_PHARMACY",
            notes: `${existingProcess.notes || ""}\nSalida de farmacia: ${new Date().toISOString()}`,
            updatedAt: new Date(),
          },
        });
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Salida de farmacia registrada para ${eligiblePatients.length} pacientes de la línea`,
      patientsCount: eligiblePatients.length,
      lineName: eligiblePatients[0]?.service?.line?.displayName || "Línea",
    });

  } catch (error) {
    console.error("Error processing pharmacy dispatch QR scan:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}