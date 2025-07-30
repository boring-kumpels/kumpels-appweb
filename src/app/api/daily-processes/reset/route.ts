import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Check if user has admin privileges (regent or superadmin)
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile || (userProfile.role !== "PHARMACY_REGENT" && userProfile.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "Solo los regentes farmacéuticos pueden resetear los procesos" },
        { status: 403 }
      );
    }

    // Delete all medication processes first (due to foreign key constraints)
    const deletedMedicationProcesses = await prisma.medicationProcess.deleteMany({});
    
    // Delete all daily processes
    const deletedDailyProcesses = await prisma.dailyProcess.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "Procesos reseteados exitosamente",
      deleted: {
        medicationProcesses: deletedMedicationProcesses.count,
        dailyProcesses: deletedDailyProcesses.count,
      },
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