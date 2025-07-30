import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { MedicationProcessStep, ProcessStatus } from "@/types/patient";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error } = await supabase.auth.getSession();
    const user = session?.user;

    if (error || !user) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const { qrId } = await request.json();

    if (!qrId) {
      return NextResponse.json(
        { error: "qrId es requerido" },
        { status: 400 }
      );
    }

    // Validate that the QR code is active and is a pharmacy dispatch QR
    const qrCode = await prisma.qRCode.findUnique({
      where: { 
        qrId,
        isActive: true,
        type: 'PHARMACY_DISPATCH'
      },
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: "Código QR no válido, inactivo o no es de farmacia" },
        { status: 400 }
      );
    }

    // Get the daily process for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dailyProcess = await prisma.dailyProcess.findFirst({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
        status: 'ACTIVE'
      },
    });

    if (!dailyProcess) {
      return NextResponse.json(
        { error: "No se encontró un proceso diario para hoy" },
        { status: 404 }
      );
    }

    // Get all patients that have completed ALISTAMIENTO step (ready for QR scanning)
    const eligiblePatients = await prisma.patient.findMany({
      where: {
        status: "ACTIVE",
        medicationProcesses: {
          some: {
            dailyProcessId: dailyProcess.id,
            step: MedicationProcessStep.ALISTAMIENTO,
            status: ProcessStatus.COMPLETED,
          }
        }
      },
      include: {
        service: {
          include: {
            line: true,
          },
        },
        qrScanRecords: {
          where: {
            dailyProcessId: dailyProcess.id,
            qrCode: {
              type: 'PHARMACY_DISPATCH'
            }
          }
        }
      },
    });

    // Filter patients that haven't been scanned yet for pharmacy dispatch
    const patientsToDispatch = eligiblePatients.filter(
      (patient) => patient.qrScanRecords.length === 0
    );

    if (patientsToDispatch.length === 0) {
      return NextResponse.json(
        { 
          error: "No hay pacientes elegibles para salida de farmacia o ya fueron registrados",
          debug: {
            totalEligiblePatients: eligiblePatients.length,
            dailyProcessId: dailyProcess.id,
            patientsAlreadyScanned: eligiblePatients.filter(p => p.qrScanRecords.length > 0).length
          }
        },
        { status: 400 }
      );
    }

    // Create scan records for all eligible patients
    await Promise.all(
      patientsToDispatch.map(patient =>
        prisma.qRScanRecord.create({
          data: {
            patientId: patient.id,
            qrCodeId: qrCode.id,
            scannedBy: user.id,
            dailyProcessId: dailyProcess.id
          }
        })
      )
    );

    // Create or update ENTREGA processes to mark pharmacy dispatch
    const updatePromises = patientsToDispatch.map(async (patient) => {
      // Try to find existing ENTREGA process
      const existingEntrega = await prisma.medicationProcess.findFirst({
        where: {
          patientId: patient.id,
          dailyProcessId: dailyProcess.id,
          step: MedicationProcessStep.ENTREGA,
        },
      });

      if (existingEntrega) {
        // Update existing ENTREGA process
        return prisma.medicationProcess.update({
          where: { id: existingEntrega.id },
          data: {
            status: "DISPATCHED_FROM_PHARMACY",
            startedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new ENTREGA process with DISPATCHED_FROM_PHARMACY status
        return prisma.medicationProcess.create({
          data: {
            patientId: patient.id,
            dailyProcessId: dailyProcess.id,
            step: MedicationProcessStep.ENTREGA,
            status: "DISPATCHED_FROM_PHARMACY",
            startedAt: new Date(),
            startedBy: user.id,
          },
        });
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Salida de farmacia registrada para ${patientsToDispatch.length} pacientes`,
      patientsCount: patientsToDispatch.length,
    });

  } catch (error) {
    console.error("Error processing pharmacy dispatch QR scan:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}