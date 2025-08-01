import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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

    if (!transactionType || transactionType !== "DEVOLUCION") {
      return NextResponse.json(
        { error: "Tipo de transacción debe ser DEVOLUCION" },
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

    // Validate that the QR code is active and is a devolution return QR
    const qrCode = await prisma.qRCode.findUnique({
      where: {
        qrId,
        isActive: true,
        type: "DEVOLUTION_RETURN",
      },
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: "Código QR no válido, inactivo o no es de devolución" },
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

    // Get eligible patients for devolution return
    // These are patients that have been picked up from service (DEVOLUTION_PICKUP scanned)
    const eligiblePatients = await prisma.patient.findMany({
      where: {
        status: "ACTIVE",
        medicationProcesses: {
          some: {
            dailyProcessId: dailyProcess.id,
            step: "DEVOLUCION",
            status: "PICKED_UP_FROM_SERVICE",
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
              type: "DEVOLUTION_RETURN",
            },
            transactionType: "DEVOLUCION",
          },
        },
      },
    });

    // Filter patients that haven't been scanned yet for devolution return
    const patientsToReturn = eligiblePatients.filter(
      (patient) => patient.qrScanRecords.length === 0
    );

    if (patientsToReturn.length === 0) {
      return NextResponse.json(
        {
          error:
            "No hay pacientes elegibles para recepción de devolución en la línea seleccionada o ya fueron registrados",
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

    // Create scan records for all eligible patients with check-in data
    await Promise.all(
      patientsToReturn.map((patient) =>
        prisma.qRScanRecord.create({
          data: {
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

    // Complete the devolution processes
    const updatePromises = patientsToReturn.map(async (patient) => {
      const existingDevolucion = await prisma.medicationProcess.findFirst({
        where: {
          patientId: patient.id,
          dailyProcessId: dailyProcess.id,
          step: "DEVOLUCION",
        },
      });

      if (existingDevolucion) {
        // Update existing DEVOLUCION process to completed
        return prisma.medicationProcess.update({
          where: { id: existingDevolucion.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            completedBy: user.id,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new DEVOLUCION process with COMPLETED status
        return prisma.medicationProcess.create({
          data: {
            patientId: patient.id,
            dailyProcessId: dailyProcess.id,
            step: "DEVOLUCION",
            status: "COMPLETED",
            startedAt: new Date(),
            startedBy: user.id,
            completedAt: new Date(),
            completedBy: user.id,
          },
        });
      }
    });

    await Promise.all(updatePromises);

    const actionMessage = `Recepción de devolución completada para ${patientsToReturn.length} pacientes de la línea ${selectedLine.displayName}`;

    return NextResponse.json({
      success: true,
      message: actionMessage,
      patientsCount: patientsToReturn.length,
      selectedLine: selectedLine.displayName,
    });
  } catch (error) {
    console.error("Error processing devolution return QR scan:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}