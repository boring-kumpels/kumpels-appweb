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

    const { serviceName, processDate } = await request.json();

    if (!serviceName || !processDate) {
      return NextResponse.json(
        { error: "serviceName y processDate son requeridos" },
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

    // Get all patients in the specified service that have completed ENTREGA step
    const patientsInService = await prisma.patient.findMany({
      where: {
        status: "ACTIVE",
        service: {
          name: serviceName,
        },
      },
      include: {
        service: true,
        medicationProcesses: {
          where: {
            dailyProcessId: dailyProcess.id,
            step: MedicationProcessStep.ENTREGA,
            status: ProcessStatus.COMPLETED,
          },
        },
      },
    });

    // Filter patients that have completed ENTREGA
    const eligiblePatients = patientsInService.filter(
      (patient) => patient.medicationProcesses.length > 0
    );

    if (eligiblePatients.length === 0) {
      return NextResponse.json(
        { error: "No hay pacientes elegibles para llegada a servicio" },
        { status: 400 }
      );
    }

    // Update the medication processes to mark floor arrival
    const updatePromises = eligiblePatients.map(async (patient) => {
      const existingProcess = await prisma.medicationProcess.findFirst({
        where: {
          patientId: patient.id,
          dailyProcessId: dailyProcess.id,
          step: MedicationProcessStep.ENTREGA,
          status: ProcessStatus.COMPLETED,
        },
      });

      if (existingProcess) {
        // Update existing process to DELIVERED_TO_SERVICE status
        return prisma.medicationProcess.update({
          where: { id: existingProcess.id },
          data: {
            status: "DELIVERED_TO_SERVICE",
            notes: `${existingProcess.notes || ""}\nLlegada a servicio: ${new Date().toISOString()}`,
            updatedAt: new Date(),
          },
        });
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Llegada a servicio registrada para ${eligiblePatients.length} pacientes del servicio ${serviceName}`,
      patientsCount: eligiblePatients.length,
      serviceName: serviceName,
    });

  } catch (error) {
    console.error("Error processing floor arrival QR scan:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}