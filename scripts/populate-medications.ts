import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";

const prisma = new PrismaClient();

interface CSVMedication {
  "Códigos Padre": string;
  "Código Servinte": string;
  "Descripción Antigua": string;
  "Código Nuevo Estándar": string;
  "Nueva Estructura Estándar Semántico": string;
  Caracteres: string;
  "Clasificación Del Artículo": string;
  MCE: string;
  "Psicotrópico (S/N)": string;
  "Marcación Regulado (MER)": string;
  "vesicantes e irritantes": string;
  "Registro INVIMA": string;
  Expediente: string;
  Consecutivo: string;
  "CUM sin ceros": string;
  "CUM con ceros": string;
  "CUM sin ceros Formulado": string;
  PBS: string;
  VEN: string;
  ATC: string;
  "Código UDM": string;
  "descripción UDM": string;
  "Cond. de Almacenamiento": string;
  "MIPRES DCI": string;
  "Alto riesgo": string;
  LASA: string;
  Gabinete: string;
  "Nivel 1 Estándar Semántico": string;
  "Validación CUM": string;
  "Inventario 24052024": string;
  "Observación Reunión Compras 20240524": string;
  "Validación con CUM Adjudicación": string;
  "Principio Activo": string;
  "Nombre ATC": string;
  "Nombre Preciso": string;
  "Concentración Estandarizada (por unidad minima comercial)": string;
  "Forma Farmacéutica": string;
  "Marca Comercial": string;
  "Titular de Registro": string;
  IMPORTADOR: string;
  FABRICANTE: string;
  "Vía Administración": string;
  "Descripción CUM": string;
}

async function uploadMedications() {
  const csvFilePath = path.join(
    process.cwd(),
    "BD Farmacia on time - suministros.csv"
  );
  const medications: CSVMedication[] = [];

  console.log("📖 Reading CSV file...");

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row: CSVMedication) => {
        medications.push(row);
      })
      .on("end", async () => {
        console.log(`📊 Found ${medications.length} medications in CSV`);

        try {
          // Clear existing medications
          console.log("🧹 Clearing existing medications...");
          await prisma.medication.deleteMany({});

          // Insert medications in batches
          const batchSize = 100;
          let insertedCount = 0;

          for (let i = 0; i < medications.length; i += batchSize) {
            const batch = medications.slice(i, i + batchSize);

            const medicationData = batch.map((med) => ({
              codigoPadre: med["Códigos Padre"] || null,
              codigoServinte: med["Código Servinte"] || null,
              descripcionAntigua: med["Descripción Antigua"] || null,
              codigoNuevoEstandar: med["Código Nuevo Estándar"] || null,
              nuevaEstructuraEstandarSemantico:
                med["Nueva Estructura Estándar Semántico"] || null,
              caracteres: med["Caracteres"] || null,
              clasificacionArticulo: med["Clasificación Del Artículo"] || null,
              mce: med["MCE"] || null,
              psicotropico: med["Psicotrópico (S/N)"] || null,
              marcacionRegulado: med["Marcación Regulado (MER)"] || null,
              vesicantesIrritantes: med["vesicantes e irritantes"] || null,
              registroInvima: med["Registro INVIMA"] || null,
              expediente: med["Expediente"] || null,
              consecutivo: med["Consecutivo"] || null,
              cumSinCeros: med["CUM sin ceros"] || null,
              cumConCeros: med["CUM con ceros"] || null,
              cumSinCerosFormulado: med["CUM sin ceros Formulado"] || null,
              pbs: med["PBS"] || null,
              ven: med["VEN"] || null,
              atc: med["ATC"] || null,
              codigoUdm: med["Código UDM"] || null,
              descripcionUdm: med["descripción UDM"] || null,
              condicionAlmacenamiento: med["Cond. de Almacenamiento"] || null,
              mipresDci: med["MIPRES DCI"] || null,
              altoRiesgo: med["Alto riesgo"] || null,
              lasa: med["LASA"] || null,
              gabinete: med["Gabinete"] || null,
              nivel1EstandarSemantico:
                med["Nivel 1 Estándar Semántico"] || null,
              validacionCum: med["Validación CUM"] || null,
              inventario24052024: med["Inventario 24052024"] || null,
              observacionReunionCompras20240524:
                med["Observación Reunión Compras 20240524"] || null,
              validacionCumAdjudicacion:
                med["Validación con CUM Adjudicación"] || null,
              principioActivo: med["Principio Activo"] || null,
              nombreAtc: med["Nombre ATC"] || null,
              nombrePreciso: med["Nombre Preciso"] || null,
              concentracionEstandarizada:
                med[
                  "Concentración Estandarizada (por unidad minima comercial)"
                ] || null,
              formaFarmaceutica: med["Forma Farmacéutica"] || null,
              marcaComercial: med["Marca Comercial"] || null,
              titularRegistro: med["Titular de Registro"] || null,
              importador: med["IMPORTADOR"] || null,
              fabricante: med["FABRICANTE"] || null,
              viaAdministracion: med["Vía Administración"] || null,
              descripcionCum: med["Descripción CUM"] || null,
            }));

            await prisma.medication.createMany({
              data: medicationData,
              skipDuplicates: true,
            });

            insertedCount += batch.length;
            console.log(
              `✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(medications.length / batchSize)} (${insertedCount}/${medications.length} medications)`
            );
          }

          console.log(
            `🎉 Successfully uploaded ${insertedCount} medications to the database!`
          );
          resolve();
        } catch (error) {
          console.error("❌ Error uploading medications:", error);
          reject(error);
        }
      })
      .on("error", (error) => {
        console.error("❌ Error reading CSV file:", error);
        reject(error);
      });
  });
}

async function main() {
  try {
    console.log("🚀 Starting medication upload process...");
    await uploadMedications();
    console.log("✅ Medication upload completed successfully!");
  } catch (error) {
    console.error("❌ Error in main process:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
