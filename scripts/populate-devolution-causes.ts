import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const devolutionCauses = [
  { causeId: 1, description: "Cambio de vía de administración" },
  { causeId: 2, description: "Cambio de forma farmacéutica" },
  { causeId: 3, description: "Cambio de frecuencia de administración" },
  { causeId: 4, description: "Cambio de dosis" },
  { causeId: 5, description: "Equivocación en la entrega de farmacia" },
  { causeId: 6, description: "Suministro suspendido" },
  { causeId: 7, description: "Suministro rechazado por paciente" },
  { causeId: 8, description: "Paciente dado de alta" },
  { causeId: 9, description: "Paciente fallece" },
];

async function main() {
  try {
    console.log("🚀 Starting devolution causes population...");

    // Clear existing causes
    console.log("🧹 Clearing existing devolution causes...");
    await prisma.devolutionCause.deleteMany({});

    // Insert devolution causes
    console.log("📝 Inserting devolution causes...");

    for (const cause of devolutionCauses) {
      await prisma.devolutionCause.create({
        data: cause,
      });
      console.log(`✅ Added cause ${cause.causeId}: ${cause.description}`);
    }

    console.log(
      `🎉 Successfully populated ${devolutionCauses.length} devolution causes!`
    );
  } catch (error) {
    console.error("❌ Error populating devolution causes:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
