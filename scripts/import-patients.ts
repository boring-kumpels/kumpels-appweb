import { PrismaClient, LineName } from "@prisma/client";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

interface PatientImportData {
  externalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  admissionDate: string;
  lineName: string;
  bedNumber: string;
  medicalRecord?: string;
  notes?: string;
}

async function importPatientsFromCSV(filePath: string) {
  console.log(`📁 Reading CSV file: ${filePath}`);

  try {
    const fileContent = readFileSync(filePath, "utf-8");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as PatientImportData[];

    console.log(`📊 Found ${records.length} patients to import`);

    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
      try {
        // Find the bed
        const bed = await prisma.bed.findUnique({
          where: {
            lineName_number: {
              lineName: record.lineName as LineName,
              number: record.bedNumber,
            },
          },
        });

        if (!bed) {
          console.error(
            `❌ Bed not found: ${record.bedNumber} in line ${record.lineName}`
          );
          errorCount++;
          continue;
        }

        // Check if bed is already occupied
        const existingPatient = await prisma.patient.findFirst({
          where: {
            bedId: bed.id,
            status: "ACTIVE",
          },
        });

        if (existingPatient) {
          console.warn(
            `⚠️ Bed ${record.bedNumber} is already occupied by ${existingPatient.firstName} ${existingPatient.lastName}`
          );
          // You might want to handle this differently based on your business logic
        }

        // Create or update patient
        const patient = await prisma.patient.upsert({
          where: { externalId: record.externalId },
          update: {
            firstName: record.firstName,
            lastName: record.lastName,
            dateOfBirth: new Date(record.dateOfBirth),
            gender: record.gender,
            admissionDate: new Date(record.admissionDate),
            bedId: bed.id,
            medicalRecord: record.medicalRecord,
            notes: record.notes,
          },
          create: {
            externalId: record.externalId,
            firstName: record.firstName,
            lastName: record.lastName,
            dateOfBirth: new Date(record.dateOfBirth),
            gender: record.gender,
            admissionDate: new Date(record.admissionDate),
            bedId: bed.id,
            medicalRecord: record.medicalRecord,
            notes: record.notes,
          },
        });

        console.log(
          `✅ Imported patient: ${patient.firstName} ${patient.lastName} (${record.externalId}) in bed ${record.bedNumber}`
        );
        successCount++;
      } catch (error) {
        console.error(
          `❌ Error importing patient ${record.externalId}:`,
          error
        );
        errorCount++;
      }
    }

    console.log("\n📊 Import Summary:");
    console.log(`- Successfully imported: ${successCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Total processed: ${records.length}`);
  } catch (error) {
    console.error("❌ Error reading CSV file:", error);
    throw error;
  }
}

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("❌ Please provide a CSV file path");
    console.log("Usage: npm run import-patients <path-to-csv-file>");
    process.exit(1);
  }

  try {
    console.log("🚀 Starting patient import...");
    await importPatientsFromCSV(filePath);
    console.log("✅ Patient import completed!");
  } catch (error) {
    console.error("❌ Error during import:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
