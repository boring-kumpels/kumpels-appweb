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

  // Sample patient data - 2 patients per line (10 total)
  const samplePatients = [
    // Line 1 patients
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
    // Line 2 patients
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
    // Line 3 patients
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
    {
      externalId: "EXT006",
      firstName: "Roberto",
      lastName: "Silva",
      dateOfBirth: new Date("1990-08-12"),
      gender: "M",
      admissionDate: new Date("2024-01-20"),
      medicalRecord: "MR006",
      notes: "Neurological assessment, stable",
    },
    // Line 4 patients
    {
      externalId: "EXT007",
      firstName: "Carmen",
      lastName: "Vargas",
      dateOfBirth: new Date("1975-04-30"),
      gender: "F",
      admissionDate: new Date("2024-01-21"),
      medicalRecord: "MR007",
      notes: "ICU monitoring, critical condition",
    },
    {
      externalId: "EXT008",
      firstName: "Miguel",
      lastName: "Torres",
      dateOfBirth: new Date("1982-09-14"),
      gender: "M",
      admissionDate: new Date("2024-01-22"),
      medicalRecord: "MR008",
      notes: "Post-operative care, improving",
    },
    // Line 5 patients
    {
      externalId: "EXT009",
      firstName: "Elena",
      lastName: "Morales",
      dateOfBirth: new Date("1995-12-25"),
      gender: "F",
      admissionDate: new Date("2024-01-23"),
      medicalRecord: "MR009",
      notes: "Maternity care, healthy pregnancy",
    },
    {
      externalId: "EXT010",
      firstName: "Diego",
      lastName: "Herrera",
      dateOfBirth: new Date("1988-06-08"),
      gender: "M",
      admissionDate: new Date("2024-01-24"),
      medicalRecord: "MR010",
      notes: "Emergency admission, stable now",
    },
  ];

  // Assign patients to different beds across all lines
  for (let i = 0; i < samplePatients.length; i++) {
    const patient = samplePatients[i];
    const lineIndex = Math.floor(i / 2); // 2 patients per line
    const patientInLine = i % 2; // 0 or 1 for first or second patient in line
    
    // Get beds for the specific line
    const lineBeds = beds.filter(bed => bed.lineName === `LINE_${lineIndex + 1}`);
    const bed = lineBeds[patientInLine]; // First or second bed in the line

    if (!bed) {
      console.log(`⚠️ No bed available for patient ${patient.externalId} in line ${lineIndex + 1}`);
      continue;
    }

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
