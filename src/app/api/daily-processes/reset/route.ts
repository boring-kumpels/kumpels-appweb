import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Check authentication using Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check if user has admin privileges (regent or superadmin)
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (
      !userProfile ||
      (userProfile.role !== "PHARMACY_REGENT" &&
        userProfile.role !== "SUPERADMIN")
    ) {
      return NextResponse.json(
        {
          error: "Solo los regentes farmacéuticos pueden resetear los procesos",
        },
        { status: 403 }
      );
    }

    // Use a transaction to ensure atomicity of the reset operation
    const result = await prisma.$transaction(async (tx) => {
      // Delete all related data in the correct order to avoid foreign key constraint issues
      // 1. Delete QR scan records first (they reference daily processes)
      const deletedQRScanRecords = await tx.qRScanRecord.deleteMany({});

      // 2. Delete process error logs (they reference medication processes)
      const deletedProcessErrorLogs = await tx.processErrorLog.deleteMany({});

      // 3. Delete all medication processes (they reference daily processes)
      const deletedMedicationProcesses = await tx.medicationProcess.deleteMany(
        {}
      );

      // 4. Delete all daily processes
      const deletedDailyProcesses = await tx.dailyProcess.deleteMany({});

      // 5. Verify that all data has been deleted (for debugging)
      const remainingQRScanRecords = await tx.qRScanRecord.count();
      const remainingProcessErrorLogs = await tx.processErrorLog.count();
      const remainingMedicationProcesses = await tx.medicationProcess.count();
      const remainingDailyProcesses = await tx.dailyProcess.count();

      console.log("Reset verification:", {
        deleted: {
          qrScanRecords: deletedQRScanRecords.count,
          processErrorLogs: deletedProcessErrorLogs.count,
          medicationProcesses: deletedMedicationProcesses.count,
          dailyProcesses: deletedDailyProcesses.count,
        },
        remaining: {
          qrScanRecords: remainingQRScanRecords,
          processErrorLogs: remainingProcessErrorLogs,
          medicationProcesses: remainingMedicationProcesses,
          dailyProcesses: remainingDailyProcesses,
        },
      });

      return {
        qrScanRecords: deletedQRScanRecords.count,
        processErrorLogs: deletedProcessErrorLogs.count,
        medicationProcesses: deletedMedicationProcesses.count,
        dailyProcesses: deletedDailyProcesses.count,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Procesos reseteados exitosamente",
      deleted: result,
    });
  } catch (error) {
    console.error("Error during reset:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
