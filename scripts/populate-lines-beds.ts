import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Services data with their specific bed ranges
const servicesData = [
  // Line 1
  {
    name: "UCI PEDIATRICA CARDIOVASCULAR",
    lineNumber: 1,
    beds: Array.from(
      { length: 22 },
      (_, i) => `PC${String(i + 1).padStart(2, "0")}`
    ),
  },
  {
    name: "UCI QUIRÚRGICA",
    lineNumber: 1,
    beds: Array.from(
      { length: 10 },
      (_, i) => `UQ${String(i + 1).padStart(2, "0")}`
    ),
  },
  {
    name: "UCI PEDIATRICA GENERAL",
    lineNumber: 1,
    beds: Array.from(
      { length: 23 },
      (_, i) => `UP${String(i + 1).padStart(2, "0")}`
    ),
  },

  // Line 2
  {
    name: "SEGUNDO ADULTOS",
    lineNumber: 2,
    beds: [
      "213A",
      "213B",
      "213C",
      "213D",
      "214A",
      "214B",
      "214C",
      "214D",
      "215A",
      "215B",
      "215C",
      "215D",
      "216A",
      "216B",
      "216C",
      "216D",
      "217A",
      "217B",
      "217C",
      "217D",
      "218A",
      "218B",
      "218C",
      "218D",
      "219A",
      "219B",
      "219C",
      "219D",
      "220A",
      "220B",
      "220C",
      "220D",
      "221A",
      "221B",
      "221C",
      "221D",
      "222A",
      "222B",
      "222C",
      "222D",
      "223A",
      "223B",
      "223C",
      "223D",
      "224A",
      "224B",
      "224C",
      "224D",
      "225A",
      "225B",
      "225C",
      "225D",
      "226A",
      "226B",
      "226C",
      "226D",
      "227A",
      "227B",
      "227C",
      "227D",
      "228A",
      "228B",
      "228C",
      "228D",
    ],
  },
  {
    name: "PEBELLON BENEFACTORES",
    lineNumber: 2,
    beds: [
      "ST1A",
      "ST1B",
      "ST2",
      "ST3A",
      "ST3B",
      "ST4",
      "ST5A",
      "ST5B",
      "ST6",
      "ST7A",
      "ST7B",
      "ST8A",
      "ST8B",
      "ST8C",
      "ST9",
      "ST10A",
      "ST10B",
      "ST11",
      "ST12",
      "ST13",
      "ST14",
      "ST15",
    ],
  },
  {
    name: "UNIDAD DE TRANSPLANTES",
    lineNumber: 2,
    beds: ["UT1", "UT2", "UT3", "UT4", "UT5", "UT6", "UT7"],
  },

  // Line 3
  {
    name: "TERCERO ADULTOS",
    lineNumber: 3,
    beds: [
      "321",
      "322",
      "323",
      "324",
      "325",
      "326",
      "327",
      "328",
      "329A",
      "329B",
      "329C",
      "329D",
      "330",
      "331A",
      "331B",
      "331C",
      "331D",
      "332",
      "333",
      "334",
      "335",
      "336",
      "337",
      "338",
      "339",
      "340",
      "341A",
      "341B",
      "342A",
      "342B",
    ],
  },
  {
    name: "CUARTO ADULTOS",
    lineNumber: 3,
    beds: [
      "401",
      "402",
      "403",
      "404",
      "405",
      "406",
      "407",
      "408",
      "409",
      "410",
      "411",
      "412",
      "413A",
      "413B",
      "413C",
      "413D",
      "414A",
      "414B",
      "414C",
      "414D",
      "415A",
      "415B",
      "415C",
      "415D",
      "416A",
      "416B",
      "416C",
      "416D",
      "417",
      "418",
    ],
  },
  {
    name: "SEGUNDO PEDIATRIA",
    lineNumber: 3,
    beds: [
      "ST16A",
      "ST16B",
      "ST17",
      "ST18A",
      "ST18B",
      "ST19A",
      "ST19B",
      "ST20A",
      "ST20B",
      "ST21A",
      "ST21B",
      "ST22A",
      "ST22B",
    ],
  },

  // Line 4
  {
    name: "TERCERO PEDIATRÍA",
    lineNumber: 4,
    beds: [
      "308",
      "309A",
      "309B",
      "309C",
      "309D",
      "310",
      "311A",
      "311B",
      "311C",
      "311D",
      "313A",
      "313B",
      "313C",
      "313D",
      "314A",
      "314B",
      "314C",
      "315A",
      "315B",
      "316",
    ],
  },
  {
    name: "SUITE PEDIATRICA",
    lineNumber: 4,
    beds: [
      "STP1",
      "STP2",
      "STP3",
      "STP4",
      "STP5",
      "STP6",
      "STP7",
      "302",
      "304",
      "306",
      "307A",
      "307B",
      "307C",
      "307D",
    ],
  },
  {
    name: "NEONATOS",
    lineNumber: 4,
    beds: [
      "NE01",
      "NE02",
      "NE03",
      "NE04",
      "NE05",
      "NE06",
      "NE07",
      "NE08",
      "NE09",
      "NE10",
      "NE11",
      "NE12",
      "NE13",
      "NE14",
      "NE15",
      "NE16",
      "NE17",
      "NE18",
      "NE19",
    ],
  },

  // Line 5
  {
    name: "TERCERO REINALDO",
    lineNumber: 5,
    beds: [
      "351",
      "352",
      "353",
      "354",
      "355",
      "356",
      "357",
      "358",
      "359",
      "360",
      "361",
      "362",
      "363",
      "364",
      "365",
      "366",
    ],
  },
  {
    name: "QUINTO REINALDO",
    lineNumber: 5,
    beds: [
      "501",
      "502",
      "503",
      "504",
      "505",
      "506",
      "507",
      "508",
      "509",
      "510",
      "511",
      "512",
      "513",
      "514",
      "515",
      "516",
    ],
  },
  {
    name: "SEXTO REINALDO",
    lineNumber: 5,
    beds: [
      "601",
      "602",
      "603",
      "604",
      "605",
      "606",
      "607",
      "608",
      "609",
      "610",
      "611",
      "612",
      "613",
      "614",
      "615",
      "616",
    ],
  },
  {
    name: "UCI MEDICA 1",
    lineNumber: 5,
    beds: [
      "UM1-01",
      "UM1-02",
      "UM1-03",
      "UM1-04",
      "UM1-05",
      "UM1-06",
      "UM1-07",
      "UM1-08",
      "UM1-09",
      "UM1-10",
      "UM1-11",
      "UM1-12",
    ],
  },
  {
    name: "UCI MEDICA 2",
    lineNumber: 5,
    beds: [
      "UM2-01",
      "UM2-02",
      "UM2-03",
      "UM2-04",
      "UM2-05",
      "UM2-06",
      "UM2-07",
      "UM2-08",
      "UM2-09",
      "UM2-10",
      "UM2-11",
      "UM2-12",
      "UM2-13",
      "UM2-14",
      "UM2-15",
      "UM2-16",
    ],
  },
  {
    name: "UCI MEDICA 3",
    lineNumber: 5,
    beds: [
      "UM3-01",
      "UM3-02",
      "UM3-03",
      "UM3-04",
      "UM3-05",
      "UM3-06",
      "UM3-07",
      "UM3-08",
      "UM3-09",
      "UM3-10",
      "UM3-11",
      "UM3-12",
      "UM3-13",
      "UM3-14",
      "UM3-15",
    ],
  },
  {
    name: "UCI CARDIOVASCULAR",
    lineNumber: 5,
    beds: [
      "UQ11",
      "UQ12",
      "UQ13",
      "UQ14",
      "UQ15",
      "UQ16",
      "UQ17",
      "UQ18",
      "UQ19",
      "UQ20",
      "UQ21",
      "UQ22",
      "UQ23",
      "UQ24",
    ],
  },
  {
    name: "URGENCIAS",
    lineNumber: 5,
    beds: [
      "URG01",
      "URG02",
      "URG03",
      "URG04",
      "URG05",
      "URG06",
      "URG07",
      "URG08",
      "URG09",
      "URG10",
      "URG11",
      "URG12",
      "URG13",
      "URG14",
      "URG15",
      "URG16",
      "URG17",
      "URG18",
      "URG19",
      "URG20",
      "URG21",
      "URG22",
      "URG23",
      "URG24",
      "URG25",
      "URG26",
      "URG27",
      "URG28",
      "URG29",
      "URG30",
    ],
  },
];

async function main() {
  console.log("🏥 Starting to populate lines, services, and beds...\n");

  try {
    // First, create the lines
    const lines = await Promise.all([
      prisma.line.create({
        data: {
          name: "LINE_1",
          displayName: "Línea 1",
          description: "Línea 1 - UCI Pediátrica",
        },
      }),
      prisma.line.create({
        data: {
          name: "LINE_2",
          displayName: "Línea 2",
          description: "Línea 2 - Adultos y Transplantes",
        },
      }),
      prisma.line.create({
        data: {
          name: "LINE_3",
          displayName: "Línea 3",
          description: "Línea 3 - Adultos y Pediatría",
        },
      }),
      prisma.line.create({
        data: {
          name: "LINE_4",
          displayName: "Línea 4",
          description: "Línea 4 - Pediatría y Neonatos",
        },
      }),
      prisma.line.create({
        data: {
          name: "LINE_5",
          displayName: "Línea 5",
          description: "Línea 5 - UCI Médica y Urgencias",
        },
      }),
    ]);

    console.log(`✅ Created ${lines.length} lines`);

    // Create a map of line numbers to line IDs
    const lineMap: Record<number, string> = {};
    lines.forEach((line, index) => {
      lineMap[index + 1] = line.id;
    });

    // Now create services and their beds
    const createdServices = [];
    const createdBeds = [];

    for (const serviceData of servicesData) {
      // Create the service
      const service = await prisma.service.create({
        data: {
          name: serviceData.name,
          lineId: lineMap[serviceData.lineNumber],
          description: `Servicio ${serviceData.name}`,
        },
      });
      createdServices.push(service);

      // Create beds for this service
      for (const bedNumber of serviceData.beds) {
        const bed = await prisma.bed.create({
          data: {
            number: bedNumber,
            lineId: lineMap[serviceData.lineNumber],
          },
        });
        createdBeds.push(bed);
      }

      console.log(
        `✅ Created service: ${service.name} with ${serviceData.beds.length} beds`
      );
    }

    console.log(`\n✅ Created ${createdServices.length} services`);
    console.log(`✅ Created ${createdBeds.length} beds`);

    console.log("\n🎉 Lines, Services, and Beds populated successfully!");
    console.log("\n📋 Summary:");
    console.log(`- Lines: ${lines.length}`);
    console.log(`- Services: ${createdServices.length}`);
    console.log(`- Beds: ${createdBeds.length}`);

    // Display the structure
    console.log("\n📋 Lines and Services Structure:");
    for (const line of lines) {
      const lineServices = createdServices.filter((s) => s.lineId === line.id);
      console.log(`\n${line.displayName}:`);
      lineServices.forEach((service) => {
        const serviceData = servicesData.find((sd) => sd.name === service.name);
        console.log(`  - ${service.name} (${serviceData?.beds.length} beds)`);
      });
    }
  } catch (error) {
    console.error("❌ Error populating data:", error);
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
