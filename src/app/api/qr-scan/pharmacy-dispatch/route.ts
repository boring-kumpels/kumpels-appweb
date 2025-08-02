import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { MedicationProcessStep, ProcessStatus } from "@/types/patient";

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

    const { qrId, temperature, destinationLineId, transactionType } =
      await request.json();

    if (!qrId) {
      return NextResponse.json({ error: "qrId es requerido" }, { status: 400 });
    }

    if (temperature === undefined || temperature === null) {
      return NextResponse.json(
        { error: "Temperatura es requerida" },
        { status: 400 }
      );
    }

    if (!destinationLineId) {
      return NextResponse.json(
        { error: "Línea de destino es requerida" },
        { status: 400 }
      );
    }

    if (!transactionType) {
      return NextResponse.json(
        { error: "Tipo de transacción es requerido" },
        { status: 400 }
      );
    }

    // Validate that the selected line exists
    const selectedLine = await prisma.line.findUnique({
      where: { id: destinationLineId },
    });

    if (!selectedLine) {
      return NextResponse.json(
        { error: "Línea de destino no válida" },
        { status: 400 }
      );
    }

    // Validate that the QR code is active and is a pharmacy dispatch QR
    const qrCode = await prisma.qRCode.findUnique({
      where: {
        qrId,
        isActive: true,
        type: "PHARMACY_DISPATCH",
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
        status: "ACTIVE",
      },
    });

    if (!dailyProcess) {
      return NextResponse.json(
        { error: "No se encontró un proceso diario para hoy" },
        { status: 404 }
      );
    }

    // Get eligible patients based on transaction type
    let eligiblePatients;
    let patientsToDispatch;

    if (transactionType === "ENTREGA") {
      // For delivery: patients that have completed ALISTAMIENTO step
      eligiblePatients = await prisma.patient.findMany({
        where: {
          status: "ACTIVE",
          medicationProcesses: {
            some: {
              dailyProcessId: dailyProcess.id,
              step: MedicationProcessStep.ALISTAMIENTO,
              status: ProcessStatus.COMPLETED,
            },
          },
          service: {
            lineId: destinationLineId, // Filter by selected line
          },
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
                type: "PHARMACY_DISPATCH",
              },
              transactionType: "ENTREGA",
            },
          },
        },
      });

      // Filter patients that haven't been scanned yet for pharmacy dispatch
      patientsToDispatch = eligiblePatients.filter(
        (patient) => patient.qrScanRecords.length === 0
      );
    } else if (transactionType === "DEVOLUCION") {
      // For devolution: patients that have DEVOLUCION process with DISPATCHED_FROM_PHARMACY status
      // (they should have been scanned with PHARMACY_DISPATCH_DEVOLUTION first)
      eligiblePatients = await prisma.patient.findMany({
        where: {
          status: "ACTIVE",
          medicationProcesses: {
            some: {
              dailyProcessId: dailyProcess.id,
              step: "DEVOLUCION",
              status: ProcessStatus.DISPATCHED_FROM_PHARMACY, // Already scanned with devolution pharmacy dispatch
            },
          },
          service: {
            lineId: destinationLineId, // Filter by selected line
          },
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
                type: "PHARMACY_DISPATCH",
              },
              transactionType: "DEVOLUCION",
            },
          },
        },
      });

      // Filter patients that haven't been scanned yet for regular pharmacy dispatch
      patientsToDispatch = eligiblePatients.filter(
        (patient) => patient.qrScanRecords.length === 0
      );
    } else {
      return NextResponse.json(
        { error: "Tipo de transacción no válido" },
        { status: 400 }
      );
    }

    if (patientsToDispatch.length === 0) {
      return NextResponse.json(
        {
          error:
            "No hay pacientes elegibles para salida de farmacia en la línea seleccionada o ya fueron registrados",
          debug: {
            totalEligiblePatients: eligiblePatients.length,
            dailyProcessId: dailyProcess.id,
            patientsAlreadyScanned: eligiblePatients.filter(
              (p) => p.qrScanRecords.length > 0
            ).length,
            selectedLineId: destinationLineId,
          },
        },
        { status: 400 }
      );
    }

    // Create or update scan records for all eligible patients with check-in data
    // Use upsert to handle cases where a record already exists (like devolution 2nd QR scan)
    await Promise.all(
      patientsToDispatch.map((patient) =>
        prisma.qRScanRecord.upsert({
          where: {
            patientId_qrCodeId_dailyProcessId_transactionType: {
              patientId: patient.id,
              qrCodeId: qrCode.id,
              dailyProcessId: dailyProcess.id,
              transactionType: transactionType,
            },
          },
          update: {
            scannedBy: user.id,
            scannedAt: new Date(),
            temperature: temperature,
            destinationLineId: destinationLineId,
            transactionType: transactionType,
          },
          create: {
            patientId: patient.id,
            qrCodeId: qrCode.id,
            scannedBy: user.id,
            dailyProcessId: dailyProcess.id,
            temperature: temperature,
            destinationLineId: destinationLineId,
            transactionType: transactionType,
          },
        })
      )
    );

    // Create or update medication processes based on transaction type
    const updatePromises = patientsToDispatch.map(async (patient) => {
      if (transactionType === "ENTREGA") {
        // Handle delivery process
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
      } else if (transactionType === "DEVOLUCION") {
        // Handle devolution process - move from DISPATCHED_FROM_PHARMACY to DELIVERED_TO_SERVICE
        // (This is the second QR scan in devolution workflow)
        const existingDevolucion = await prisma.medicationProcess.findFirst({
          where: {
            patientId: patient.id,
            dailyProcessId: dailyProcess.id,
            step: "DEVOLUCION",
          },
        });

        if (existingDevolucion) {
          // Update existing DEVOLUCION process to delivered to service
          return prisma.medicationProcess.update({
            where: { id: existingDevolucion.id },
            data: {
              status: ProcessStatus.DELIVERED_TO_SERVICE,
              updatedAt: new Date(),
            },
          });
        } else {
          // This shouldn't happen in the new workflow, but handle it gracefully
          return prisma.medicationProcess.create({
            data: {
              patientId: patient.id,
              dailyProcessId: dailyProcess.id,
              step: "DEVOLUCION",
              status: ProcessStatus.DELIVERED_TO_SERVICE,
              startedAt: new Date(),
              startedBy: user.id,
            },
          });
        }
      }
    });

    await Promise.all(updatePromises);

    const actionMessage =
      transactionType === "ENTREGA"
        ? `Salida de farmacia registrada para ${patientsToDispatch.length} pacientes de la línea ${selectedLine.displayName}`
        : `Recepción de devolución registrada para ${patientsToDispatch.length} pacientes de la línea ${selectedLine.displayName}`;

    return NextResponse.json({
      success: true,
      message: actionMessage,
      patientsCount: patientsToDispatch.length,
      selectedLine: selectedLine.displayName,
    });
  } catch (error) {
    console.error("Error processing pharmacy dispatch QR scan:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
