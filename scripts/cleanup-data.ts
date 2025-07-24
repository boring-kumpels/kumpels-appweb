import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupPatients() {
  console.log("🧹 Cleaning up patients...");

  const deletedPatients = await prisma.patient.deleteMany({});
  console.log(`✅ Deleted ${deletedPatients.count} patients`);
}

async function cleanupBeds() {
  console.log("🛏️ Cleaning up beds...");

  const deletedBeds = await prisma.bed.deleteMany({});
  console.log(`✅ Deleted ${deletedBeds.count} beds`);
}



async function main() {
  try {
    console.log("🚀 Starting database cleanup...");

    // Clean up in reverse order due to foreign key constraints
    await cleanupPatients();
    await cleanupBeds();

    console.log("✅ Database cleanup completed successfully!");

    // Display summary
    const bedCount = await prisma.bed.count();
    const patientCount = await prisma.patient.count();

    console.log("\n📊 Final counts:");
    console.log(`- Lines: 5 (enum-based, cannot be deleted)`);
    console.log(`- Beds: ${bedCount}`);
    console.log(`- Patients: ${patientCount}`);
  } catch (error) {
    console.error("❌ Error cleaning up database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
