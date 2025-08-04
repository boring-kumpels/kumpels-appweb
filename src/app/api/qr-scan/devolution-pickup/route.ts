import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check role
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile || (profile.role !== "PHARMACY_REGENT" && profile.role !== "SUPERADMIN")) {
      return NextResponse.json(
        {
          error:
            "Forbidden - Only PHARMACY_REGENT and SUPERADMIN can scan devolution pickup QRs",
        },
        { status: 403 }
      );
    }

    const { qrId, temperature, destinationLineId, transactionType } =
      await request.json();

    if (!qrId) {
      return NextResponse.json({ error: "QR ID is required" }, { status: 400 });
    }

    if (temperature === undefined || temperature === null) {
      return NextResponse.json(
        { error: "Temperatura es requerida" },
        { status: 400 }
      );
    }

    if (!transactionType || transactionType !== "DEVOLUCION") {
      return NextResponse.json(
        { error: "Tipo de transacción debe ser DEVOLUCION" },
        { status: 400 }
      );
    }

    // Find the QR code first to get service information
    const qrCode = await prisma.qRCode.findUnique({
      where: {
        qrId: qrId,
        isActive: true,
        type: "DEVOLUTION_PICKUP",
      },
      include: {
        service: {
          include: {
            line: true,
          },
        },
      },
    });

    if (!qrCode || !qrCode.serviceId) {
      return NextResponse.json(
        {
          error: "Código QR no válido, no activo, o no asociado a un servicio",
        },
        { status: 404 }
      );
    }

    // For devolution pickup, get the line from the service if not provided
    let selectedLine;
    if (destinationLineId) {
      // If destinationLineId is provided, validate it matches the service's line
      selectedLine = await prisma.line.findUnique({
        where: { id: destinationLineId },
      });

      if (!selectedLine) {
        return NextResponse.json(
          { error: "Línea de destino no válida" },
          { status: 400 }
        );
      }

      // Verify the selected line matches the service's line
      if (selectedLine.id !== qrCode.service!.lineId) {
        return NextResponse.json(
          {
            error:
              "La línea seleccionada no coincide con el servicio del código QR",
          },
          { status: 400 }
        );
      }
    } else {
      // If no destinationLineId provided, use the service's line
      selectedLine = qrCode.service!.line;
    }

    // Get current active daily process
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
        {
          error: "No hay proceso diario activo para hoy",
        },
        { status: 400 }
      );
    }

    // Find patients ready for devolution pickup
    // These are patients with DEVOLUCION process started and not yet picked up
    const readyPatients = await prisma.patient.findMany({
      where: {
        serviceId: qrCode.serviceId,
        status: "ACTIVE",
        medicationProcesses: {
          some: {
            step: "DEVOLUCION",
            status: "IN_PROGRESS",
            dailyProcessId: dailyProcess.id,
          },
        },
        service: {
          lineId: selectedLine.id, // Ensure patients belong to selected line
        },
      },
      include: {
        bed: true,
        service: {
          include: {
            line: true,
          },
        },
        qrScanRecords: {
          where: {
            dailyProcessId: dailyProcess.id,
          },
          include: {
            qrCode: true,
          },
        },
      },
    });

    // Filter patients who haven't been scanned for devolution pickup yet
    const patientsToScan = readyPatients.filter((patient) => {
      const hasDevolutionPickupScan = patient.qrScanRecords.some(
        (record) =>
          record.qrCode.type === "DEVOLUTION_PICKUP" &&
          record.qrCode.serviceId === qrCode.serviceId &&
          record.transactionType === "DEVOLUCION"
      );
      return !hasDevolutionPickupScan;
    });

    if (patientsToScan.length === 0) {
      return NextResponse.json(
        {
          error:
            "No hay pacientes listos para recogida de devolución en este servicio o ya fueron registrados",
        },
        { status: 400 }
      );
    }

    // Create scan records for all eligible patients with check-in data
    await Promise.all(
      patientsToScan.map((patient) =>
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

    // Update medication processes - mark as picked up from service
    const updatePromises = patientsToScan.map(async (patient) => {
      const existingDevolucion = await prisma.medicationProcess.findFirst({
        where: {
          patientId: patient.id,
          dailyProcessId: dailyProcess.id,
          step: "DEVOLUCION",
        },
      });

      if (existingDevolucion) {
        // Update existing DEVOLUCION process to show pickup from service
        return prisma.medicationProcess.update({
          where: { id: existingDevolucion.id },
          data: {
            status: "PICKED_UP_FROM_SERVICE",
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new DEVOLUCION process with PICKED_UP_FROM_SERVICE status
        return prisma.medicationProcess.create({
          data: {
            patientId: patient.id,
            dailyProcessId: dailyProcess.id,
            step: "DEVOLUCION",
            status: "PICKED_UP_FROM_SERVICE",
            startedAt: new Date(),
            startedBy: user.id,
          },
        });
      }
    });

    await Promise.all(updatePromises);

    const actionMessage = `Recogida de devolución registrada para ${patientsToScan.length} paciente(s) de la línea ${selectedLine.displayName}`;

    return NextResponse.json({
      success: true,
      message: actionMessage,
      patientsCount: patientsToScan.length,
      serviceName: qrCode.service?.name,
      selectedLine: selectedLine.displayName,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing devolution pickup QR scan:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
