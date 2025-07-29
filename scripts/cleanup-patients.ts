import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting to clean up patients...\n');

  try {
    // Count patients before deletion
    const patientCount = await prisma.patient.count();
    console.log(`📊 Found ${patientCount} patients to delete`);

    if (patientCount === 0) {
      console.log('✅ No patients to delete');
      return;
    }

    // Delete all patients
    const result = await prisma.patient.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.count} patients`);
    console.log('\n🎉 Patient cleanup completed!');

  } catch (error) {
    console.error('❌ Error cleaning up patients:', error);
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