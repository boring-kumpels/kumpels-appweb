import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting to clean up lines, services, and beds...\n");

  try {
    // Count records before deletion
    const lineCount = await prisma.line.count();
    const serviceCount = await prisma.service.count();
    const bedCount = await prisma.bed.count();

    console.log(`📊 Found to delete:`);
    console.log(`  - Lines: ${lineCount}`);
    console.log(`  - Services: ${serviceCount}`);
    console.log(`  - Beds: ${bedCount}`);

    if (lineCount === 0 && serviceCount === 0 && bedCount === 0) {
      console.log("✅ No data to delete");
      return;
    }

    // Delete in the correct order due to foreign key constraints
    // First delete beds (they reference lines)
    if (bedCount > 0) {
      const bedResult = await prisma.bed.deleteMany({});
      console.log(`✅ Deleted ${bedResult.count} beds`);
    }

    // Then delete services (they reference lines)
    if (serviceCount > 0) {
      const serviceResult = await prisma.service.deleteMany({});
      console.log(`✅ Deleted ${serviceResult.count} services`);
    }

    // Finally delete lines
    if (lineCount > 0) {
      const lineResult = await prisma.line.deleteMany({});
      console.log(`✅ Deleted ${lineResult.count} lines`);
    }

    console.log("\n🎉 Lines, services, and beds cleanup completed!");
  } catch (error) {
    console.error("❌ Error cleaning up data:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
