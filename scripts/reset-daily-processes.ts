import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDailyProcesses() {
  console.log("🧹 Starting reset of daily processes and medication processes...");

  try {
    // Delete all medication processes first (due to foreign key constraints)
    const deletedMedicationProcesses = await prisma.medicationProcess.deleteMany({});
    console.log(`✅ Deleted ${deletedMedicationProcesses.count} medication processes`);

    // Delete all daily processes
    const deletedDailyProcesses = await prisma.dailyProcess.deleteMany({});
    console.log(`✅ Deleted ${deletedDailyProcesses.count} daily processes`);

    console.log("🎉 Reset completed successfully!");
  } catch (error) {
    console.error("❌ Error during reset:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDailyProcesses();