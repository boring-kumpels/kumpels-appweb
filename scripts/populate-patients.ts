import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Sample patient data
const samplePatients = [
  // Line 1 - UCI Pediátrica
  {
    externalId: "P001",
    firstName: "María",
    lastName: "González",
    dateOfBirth: new Date("2015-03-15"),
    gender: "F",
    admissionDate: new Date("2024-01-15"),
    lineName: "LINE_1",
    serviceName: "UCI PEDIATRICA CARDIOVASCULAR",
    bedNumber: "PC01",
    medicalRecord: "MC-2024-001",
    notes: "Paciente pediátrica con condición cardiovascular",
  },
  {
    externalId: "P002",
    firstName: "Carlos",
    lastName: "Rodríguez",
    dateOfBirth: new Date("2012-07-22"),
    gender: "M",
    admissionDate: new Date("2024-01-16"),
    lineName: "LINE_1",
    serviceName: "UCI QUIRÚRGICA",
    bedNumber: "UQ01",
    medicalRecord: "MC-2024-002",
    notes: "Paciente pediátrico post-quirúrgico",
  },
  {
    externalId: "P003",
    firstName: "Ana",
    lastName: "Martínez",
    dateOfBirth: new Date("2018-11-08"),
    gender: "F",
    admissionDate: new Date("2024-01-17"),
    lineName: "LINE_1",
    serviceName: "UCI PEDIATRICA GENERAL",
    bedNumber: "UP01",
    medicalRecord: "MC-2024-003",
    notes: "Paciente pediátrica en cuidados generales",
  },

  // Line 2 - Adultos y Transplantes
  {
    externalId: "P004",
    firstName: "Roberto",
    lastName: "López",
    dateOfBirth: new Date("1985-04-12"),
    gender: "M",
    admissionDate: new Date("2024-01-18"),
    lineName: "LINE_2",
    serviceName: "SEGUNDO ADULTOS",
    bedNumber: "213A",
    medicalRecord: "MC-2024-004",
    notes: "Paciente adulto en segundo piso",
  },
  {
    externalId: "P005",
    firstName: "Carmen",
    lastName: "Hernández",
    dateOfBirth: new Date("1978-09-30"),
    gender: "F",
    admissionDate: new Date("2024-01-19"),
    lineName: "LINE_2",
    serviceName: "PEBELLON BENEFACTORES",
    bedNumber: "ST1A",
    medicalRecord: "MC-2024-005",
    notes: "Paciente en pabellón benefactores",
  },
  {
    externalId: "P006",
    firstName: "Miguel",
    lastName: "Díaz",
    dateOfBirth: new Date("1990-12-05"),
    gender: "M",
    admissionDate: new Date("2024-01-20"),
    lineName: "LINE_2",
    serviceName: "UNIDAD DE TRANSPLANTES",
    bedNumber: "UT1",
    medicalRecord: "MC-2024-006",
    notes: "Paciente en unidad de transplantes",
  },

  // Line 3 - Adultos y Pediatría
  {
    externalId: "P007",
    firstName: "Isabel",
    lastName: "Fernández",
    dateOfBirth: new Date("1982-06-18"),
    gender: "F",
    admissionDate: new Date("2024-01-21"),
    lineName: "LINE_3",
    serviceName: "TERCERO ADULTOS",
    bedNumber: "321",
    medicalRecord: "MC-2024-007",
    notes: "Paciente adulto en tercer piso",
  },
  {
    externalId: "P008",
    firstName: "Francisco",
    lastName: "Pérez",
    dateOfBirth: new Date("1975-02-14"),
    gender: "M",
    admissionDate: new Date("2024-01-22"),
    lineName: "LINE_3",
    serviceName: "CUARTO ADULTOS",
    bedNumber: "401",
    medicalRecord: "MC-2024-008",
    notes: "Paciente adulto en cuarto piso",
  },
  {
    externalId: "P009",
    firstName: "Lucía",
    lastName: "García",
    dateOfBirth: new Date("2016-08-25"),
    gender: "F",
    admissionDate: new Date("2024-01-23"),
    lineName: "LINE_3",
    serviceName: "SEGUNDO PEDIATRIA",
    bedNumber: "ST16A",
    medicalRecord: "MC-2024-009",
    notes: "Paciente pediátrica en segundo piso",
  },

  // Line 4 - Pediatría y Neonatos
  {
    externalId: "P010",
    firstName: "Diego",
    lastName: "Morales",
    dateOfBirth: new Date("2014-01-10"),
    gender: "M",
    admissionDate: new Date("2024-01-24"),
    lineName: "LINE_4",
    serviceName: "TERCERO PEDIATRÍA",
    bedNumber: "308",
    medicalRecord: "MC-2024-010",
    notes: "Paciente pediátrico en tercer piso",
  },
  {
    externalId: "P011",
    firstName: "Valentina",
    lastName: "Jiménez",
    dateOfBirth: new Date("2017-05-03"),
    gender: "F",
    admissionDate: new Date("2024-01-25"),
    lineName: "LINE_4",
    serviceName: "SUITE PEDIATRICA",
    bedNumber: "STP1",
    medicalRecord: "MC-2024-011",
    notes: "Paciente pediátrica en suite",
  },
  {
    externalId: "P012",
    firstName: "Santiago",
    lastName: "Ruiz",
    dateOfBirth: new Date("2023-10-20"),
    gender: "M",
    admissionDate: new Date("2024-01-26"),
    lineName: "LINE_4",
    serviceName: "NEONATOS",
    bedNumber: "NE01",
    medicalRecord: "MC-2024-012",
    notes: "Paciente neonato",
  },

  // Line 5 - UCI Médica y Urgencias
  {
    externalId: "P013",
    firstName: "Elena",
    lastName: "Moreno",
    dateOfBirth: new Date("1988-11-12"),
    gender: "F",
    admissionDate: new Date("2024-01-27"),
    lineName: "LINE_5",
    serviceName: "UCI MEDICA 1",
    bedNumber: "UM1-01",
    medicalRecord: "MC-2024-013",
    notes: "Paciente en UCI médica 1",
  },
  {
    externalId: "P014",
    firstName: "Javier",
    lastName: "Alonso",
    dateOfBirth: new Date("1992-03-28"),
    gender: "M",
    admissionDate: new Date("2024-01-28"),
    lineName: "LINE_5",
    serviceName: "UCI CARDIOVASCULAR",
    bedNumber: "UQ11",
    medicalRecord: "MC-2024-014",
    notes: "Paciente en UCI cardiovascular",
  },
  {
    externalId: "P015",
    firstName: "Patricia",
    lastName: "Vega",
    dateOfBirth: new Date("1980-07-15"),
    gender: "F",
    admissionDate: new Date("2024-01-29"),
    lineName: "LINE_5",
    serviceName: "URGENCIAS",
    bedNumber: "URG01",
    medicalRecord: "MC-2024-015",
    notes: "Paciente en urgencias",
  },
];

async function main() {
  console.log("🏥 Starting to populate patients...\n");

  try {
    const createdPatients = [];

    for (const patientData of samplePatients) {
      // Find the line
      const line = await prisma.line.findUnique({
        where: { name: patientData.lineName as any },
      });

      if (!line) {
        console.error(`❌ Line not found: ${patientData.lineName}`);
        continue;
      }

      // Find the service
      const service = await prisma.service.findFirst({
        where: {
          name: patientData.serviceName,
          lineId: line.id,
        },
      });

      if (!service) {
        console.error(
          `❌ Service not found: ${patientData.serviceName} in line ${patientData.lineName}`
        );
        continue;
      }

      // Find the bed
      const bed = await prisma.bed.findFirst({
        where: {
          number: patientData.bedNumber,
          lineId: line.id,
        },
      });

      if (!bed) {
        console.error(
          `❌ Bed not found: ${patientData.bedNumber} in line ${patientData.lineName}`
        );
        continue;
      }

      // Create the patient
      const patient = await prisma.patient.create({
        data: {
          externalId: patientData.externalId,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          dateOfBirth: patientData.dateOfBirth,
          gender: patientData.gender,
          admissionDate: patientData.admissionDate,
          bedId: bed.id,
          serviceId: service.id,
          medicalRecord: patientData.medicalRecord,
          notes: patientData.notes,
          status: "ACTIVE",
        },
        include: {
          bed: true,
          service: {
            include: {
              line: true,
            },
          },
        },
      });

      createdPatients.push(patient);
      console.log(
        `✅ Created patient: ${patient.firstName} ${patient.lastName} - ${patient.service.line.displayName} > ${patient.service.name} > ${patient.bed.number}`
      );
    }

    console.log(`\n🎉 Patients populated successfully!`);
    console.log(`📋 Summary:`);
    console.log(`- Total patients created: ${createdPatients.length}`);

    // Group patients by line
    const patientsByLine = createdPatients.reduce(
      (acc, patient) => {
        const lineName = patient.service.line.displayName;
        if (!acc[lineName]) {
          acc[lineName] = [];
        }
        acc[lineName].push(patient);
        return acc;
      },
      {} as Record<string, typeof createdPatients>
    );

    console.log(`\n📋 Patients by Line:`);
    Object.entries(patientsByLine).forEach(([lineName, patients]) => {
      console.log(`\n${lineName} (${patients.length} patients):`);
      patients.forEach((patient) => {
        console.log(
          `  - ${patient.firstName} ${patient.lastName} (${patient.service.name} - ${patient.bed.number})`
        );
      });
    });
  } catch (error) {
    console.error("❌ Error populating patients:", error);
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
