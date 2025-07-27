import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupPatientsAndBeds() {
  try {
    console.log("🧹 Deleting all patients...");
    const deletedPatients = await prisma.patient.deleteMany({});
    console.log(`✅ Deleted ${deletedPatients.count} patients`);

    console.log("🛏️ Deleting all beds...");
    const deletedBeds = await prisma.bed.deleteMany({});
    console.log(`✅ Deleted ${deletedBeds.count} beds`);

    console.log("✅ Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error cleaning up patients and beds:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  cleanupPatientsAndBeds().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
