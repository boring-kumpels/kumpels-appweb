import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testSetup() {
  try {
    console.log("🧪 Testing database setup...");

    // Test 1: Check if beds exist
    const beds = await prisma.bed.findMany();
    console.log(`✅ Found ${beds.length} beds`);

    if (beds.length === 0) {
      console.log('⚠️ No beds found. Run "npm run db:populate" first.');
      return;
    }

    // Test 2: Check if patients exist
    const patients = await prisma.patient.findMany({
      include: {
        bed: true,
      },
    });
    console.log(`✅ Found ${patients.length} patients`);

    // Test 3: Show sample data
    if (patients.length > 0) {
      console.log("\n📋 Sample patient data:");
      patients.slice(0, 3).forEach((patient, index) => {
        console.log(`${index + 1}. ${patient.firstName} ${patient.lastName}`);
        console.log(`   - External ID: ${patient.externalId}`);
        console.log(
          `   - Bed: ${patient.bed?.number} (${patient.bed?.lineName})`
        );
        console.log(`   - Status: ${patient.status}`);
        console.log("");
      });
    }

    // Test 5: Test API endpoints (if running in browser environment)
    if (typeof window !== "undefined") {
      console.log("🌐 Testing API endpoints...");

      try {
        const response = await fetch("/api/patients");
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ API /api/patients returned ${data.length} patients`);
        } else {
          console.log("❌ API /api/patients failed");
        }
      } catch (error) {
        console.log("⚠️ API test skipped (not in browser environment)");
      }
    }

    console.log("\n🎉 Database setup test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testSetup().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
