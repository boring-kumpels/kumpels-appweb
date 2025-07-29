import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking database data...\n");

  try {
    // Check lines
    const lines = await prisma.line.findMany({
      include: {
        services: true,
        beds: true,
      },
    });
    console.log(`📊 Lines: ${lines.length}`);
    lines.forEach((line) => {
      console.log(
        `  - ${line.displayName}: ${line.services.length} services, ${line.beds.length} beds`
      );
    });

    // Check services
    const services = await prisma.service.findMany({
      include: {
        line: true,
        patients: {
          where: { status: "ACTIVE" },
        },
      },
    });
    console.log(`\n📊 Services: ${services.length}`);
    services.forEach((service) => {
      console.log(
        `  - ${service.name} (${service.line.displayName}): ${service.patients.length} patients`
      );
    });

    // Check patients
    const patients = await prisma.patient.findMany({
      include: {
        bed: {
          include: {
            line: true,
          },
        },
        service: {
          include: {
            line: true,
          },
        },
      },
    });
    console.log(`\n📊 Patients: ${patients.length}`);
    patients.forEach((patient) => {
      console.log(
        `  - ${patient.firstName} ${patient.lastName} (${patient.externalId})`
      );
      console.log(
        `    Bed: ${patient.bed?.number} (${patient.bed?.line?.displayName})`
      );
      console.log(
        `    Service: ${patient.service?.name} (${patient.service?.line?.displayName})`
      );
    });

    // Check beds
    const beds = await prisma.bed.findMany({
      include: {
        line: true,
        patients: {
          where: { status: "ACTIVE" },
        },
      },
    });
    console.log(`\n📊 Beds: ${beds.length}`);
    beds.forEach((bed) => {
      console.log(
        `  - ${bed.number} (${bed.line.displayName}): ${bed.patients.length} patients`
      );
    });
  } catch (error) {
    console.error("❌ Error checking data:", error);
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
