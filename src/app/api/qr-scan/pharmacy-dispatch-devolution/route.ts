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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check role
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { qrId, temperature, destinationLineId, transactionType } =
      await request.json();

    if (!qrId) {
      return NextResponse.json({ error: "QR ID is required" }, { status: 400 });
    }

    if (temperature === undefined || temperature === null) {
      return NextResponse.json(
        { error: "Temperature is required" },
        { status: 400 }
      );
    }

    if (!destinationLineId) {
      return NextResponse.json(
        { error: "Destination line is required" },
        { status: 400 }
      );
    }

    if (!transactionType) {
      return NextResponse.json(
        { error: "Transaction type is required" },
        { status: 400 }
      );
    }

    // Validate that the selected line exists
    const selectedLine = await prisma.line.findUnique({
      where: { id: destinationLineId },
    });

    if (!selectedLine) {
      return NextResponse.json(
        { error: "Invalid destination line" },
        { status: 400 }
      );
    }

    // Verify QR code exists and is active
    const qrCode = await prisma.qRCode.findUnique({
      where: { qrId },
    });

    if (
      !qrCode ||
      !qrCode.isActive ||
      qrCode.type !== "PHARMACY_DISPATCH_DEVOLUTION"
    ) {
      return NextResponse.json(
        { error: "Invalid or inactive devolution pharmacy dispatch QR code" },
        { status: 400 }
      );
    }

    // Get or create the current daily process for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let currentDailyProcess = await prisma.dailyProcess.findFirst({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If no daily process exists for today, create one
    if (!currentDailyProcess) {
      console.log("No daily process found for today, creating one for devolution QR scan");
      try {
        currentDailyProcess = await prisma.dailyProcess.create({
          data: {
            date: new Date(),
            status: "IN_PROGRESS",
            startedBy: user.id,
          },
        });
        console.log("Created daily process:", currentDailyProcess.id);
      } catch (error) {
        // If creation fails due to unique constraint, try to find it again
        console.log("Daily process creation failed, trying to find existing one:", error);
        currentDailyProcess = await prisma.dailyProcess.findFirst({
          where: {
            date: {
              gte: today,
              lt: tomorrow,
            },
          },
          orderBy: { createdAt: "desc" },
        });
        
        if (!currentDailyProcess) {
          throw new Error("Could not create or find daily process for today");
        }
      }
    }

    // Find all patients with DEVOLUCION process in active states for the selected line
    // Since this is a parallel step, it can be scanned in multiple states
    // Include both daily process-linked and independent devolutions
    const devolutionProcesses = await prisma.medicationProcess.findMany({
      where: {
        OR: [
          {
            dailyProcessId: currentDailyProcess.id,
          },
          {
            dailyProcessId: null, // Include independent devolutions
          },
        ],
        step: "DEVOLUCION",
        status: {
          in: [
            ProcessStatus.IN_PROGRESS,
            ProcessStatus.DISPATCHED_FROM_PHARMACY,
            ProcessStatus.DELIVERED_TO_SERVICE,
            ProcessStatus.COMPLETED, // Allow even after reception is confirmed
          ],
        },
        patient: {
          service: {
            lineId: destinationLineId, // Filter by selected line
          },
        },
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

    if (devolutionProcesses.length === 0) {
      return NextResponse.json(
        {
          error: `No hay pacientes con devoluciones activas en la línea ${selectedLine.displayName}`,
          message:
            "Asegúrate de que haya pacientes con procesos de devolución iniciados",
        },
        { status: 400 }
      );
    }

    // Filter out processes that have already been scanned for this QR type
    const unscannedProcesses = [];
    for (const process of devolutionProcesses) {
      const existingScan = await prisma.qRScanRecord.findFirst({
        where: {
          patientId: process.patientId,
          qrCode: {
            type: "PHARMACY_DISPATCH_DEVOLUTION",
          },
          transactionType: "DEVOLUCION",
        },
      });
      
      if (!existingScan) {
        unscannedProcesses.push(process);
      }
    }

    if (unscannedProcesses.length === 0) {
      return NextResponse.json(
        {
          error: `Todos los pacientes con devoluciones en la línea ${selectedLine.displayName} ya han sido escaneados`,
          message: "No hay pacientes pendientes para el escaneo de llegada a farmacia",
        },
        { status: 400 }
      );
    }

    // Don't update the process status - it should remain as is
    // so that regents can confirm the final reception
    const updatedProcesses = unscannedProcesses.map((process) => ({
      ...process,
      updatedAt: new Date(),
    }));

    // Create QR scan records for all processed patients
    await Promise.all(
      updatedProcesses.map(async (process) => {
        return await prisma.qRScanRecord.create({
          data: {
            patientId: process.patientId,
            qrCodeId: qrCode.id,
            scannedBy: user.id,
            dailyProcessId: process.dailyProcessId || currentDailyProcess.id, // Use process's daily process ID or current one
            temperature: temperature,
            destinationLineId: destinationLineId,
            transactionType: transactionType,
            scannedAt: new Date(),
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `Llegada a farmacia registrada para ${updatedProcesses.length} paciente${updatedProcesses.length > 1 ? "s" : ""} de la línea ${selectedLine.displayName}`,
      patientsCount: updatedProcesses.length,
      selectedLine: selectedLine.displayName,
      nextStep:
        "El regente de farmacia puede ahora confirmar la recepción final",
    });
  } catch (error) {
    console.error("Error processing pharmacy dispatch devolution QR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
