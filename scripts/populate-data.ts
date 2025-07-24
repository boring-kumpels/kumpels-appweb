import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function populateBeds() {
  console.log("🛏️ Creating beds...");

  const lineNames = ["LINE_1", "LINE_2", "LINE_3", "LINE_4", "LINE_5"];

  for (const lineName of lineNames) {
    // Create 10 beds per line (11-10, 21-20, etc.)
    const lineNumber = lineName.split("_")[1]; // Get 1, 2, 3, 4, 5

    for (let i = 1; i <= 10; i++) {
      const bedNumber = `${lineNumber}${i}`;

      await prisma.bed.upsert({
        where: {
          lineName_number: {
            lineName: lineName as any,
            number: bedNumber,
          },
        },
        update: {
          number: bedNumber,
          lineName: lineName as any,
        },
        create: {
          number: bedNumber,
          lineName: lineName as any,
        },
      });
      console.log(`✅ Created/Updated bed: ${bedNumber} in ${lineName}`);
    }
  }
}

async function populateSamplePatients() {
  console.log("👥 Creating sample patients...");

  const beds = await prisma.bed.findMany();

  // Sample patient data
  const samplePatients = [
    {
      externalId: "EXT001",
      firstName: "Maria",
      lastName: "Garcia",
      dateOfBirth: new Date("1985-03-15"),
      gender: "F",
      admissionDate: new Date("2024-01-15"),
      medicalRecord: "MR001",
      notes: "Patient with diabetes, requires regular monitoring",
    },
    {
      externalId: "EXT002",
      firstName: "Juan",
      lastName: "Rodriguez",
      dateOfBirth: new Date("1978-07-22"),
      gender: "M",
      admissionDate: new Date("2024-01-16"),
      medicalRecord: "MR002",
      notes: "Post-surgery recovery, stable condition",
    },
    {
      externalId: "EXT003",
      firstName: "Ana",
      lastName: "Lopez",
      dateOfBirth: new Date("1992-11-08"),
      gender: "F",
      admissionDate: new Date("2024-01-17"),
      medicalRecord: "MR003",
      notes: "Respiratory infection, improving",
    },
    {
      externalId: "EXT004",
      firstName: "Carlos",
      lastName: "Martinez",
      dateOfBirth: new Date("1965-12-03"),
      gender: "M",
      admissionDate: new Date("2024-01-18"),
      medicalRecord: "MR004",
      notes: "Cardiac monitoring, stable",
    },
    {
      externalId: "EXT005",
      firstName: "Isabella",
      lastName: "Fernandez",
      dateOfBirth: new Date("2018-05-20"),
      gender: "F",
      admissionDate: new Date("2024-01-19"),
      medicalRecord: "MR005",
      notes: "Pediatric case, fever resolved",
    },
  ];

  // Assign patients to different beds
  for (let i = 0; i < samplePatients.length; i++) {
    const patient = samplePatients[i];
    const bed = beds[i]; // Assign to first 5 beds

    await prisma.patient.upsert({
      where: { externalId: patient.externalId },
      update: {
        ...patient,
        bedId: bed.id,
      },
      create: {
        ...patient,
        bedId: bed.id,
      },
    });

    console.log(
      `✅ Created/Updated patient: ${patient.firstName} ${patient.lastName} in bed ${bed.number} (${bed.lineName})`
    );
  }
}

async function main() {
  try {
    console.log("🚀 Starting database population...");

    await populateBeds();
    await populateSamplePatients();

    console.log("✅ Database population completed successfully!");

    // Display summary
    const bedCount = await prisma.bed.count();
    const patientCount = await prisma.patient.count();

    console.log("\n📊 Summary:");
    console.log(`- Lines: 5 (enum-based)`);
    console.log(`- Beds: ${bedCount}`);
    console.log(`- Patients: ${patientCount}`);
  } catch (error) {
    console.error("❌ Error populating database:", error);
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
