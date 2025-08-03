import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { MedicationProcessStep, ProcessStatus } from "@/types/patient";

interface StatisticsFilters {
  lineId?: string;
  serviceId?: string;
  personalRole?: string;
  dateFrom?: string;
  dateTo?: string;
  dailyProcessId?: string;
}

interface ComplianceMetrics {
  onTimeDelivery: number;
  onTimeReturns: number;
  medicationCartAdherence: number;
  patientsWithErrors: number;
}

interface ComparativeMetrics {
  averageTimePerStage: {
    total: number;
    change: number;
    lines: Array<{
      name: string;
      predespacho: number;
      alistamiento: number;
      verificacion: number;
      entrega: number;
      total: number;
    }>;
  };
  manualReturns: {
    total: number;
    change: number;
    percentage: number;
    byReason: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
  };
  temperatureCompliance: {
    averageTemperature: number | null;
    outOfRangeCount: number;
    totalReadings: number;
    compliancePercentage: number;
  };
  processEfficiency: {
    averageCompletionTime: number;
    onTimeCompletionRate: number;
    bottleneckStages: Array<{
      stage: string;
      averageTime: number;
      delayCount: number;
    }>;
  };
}

// Calculate compliance metrics based on medication processes and QR scans
async function calculateComplianceMetrics(
  filters: StatisticsFilters
): Promise<ComplianceMetrics> {
  const whereClause: Record<string, unknown> = {};

  // Build date filter
  if (filters.dateFrom || filters.dateTo) {
    whereClause.createdAt = {} as Record<string, unknown>;
    if (filters.dateFrom)
      (whereClause.createdAt as Record<string, unknown>).gte = new Date(
        filters.dateFrom
      );
    if (filters.dateTo)
      (whereClause.createdAt as Record<string, unknown>).lte = new Date(
        filters.dateTo
      );
  }

  // Add daily process filter if specified
  if (filters.dailyProcessId) {
    whereClause.dailyProcessId = filters.dailyProcessId;
  }

  // Get medication processes with related data
  const medicationProcesses = await prisma.medicationProcess.findMany({
    where: {
      ...whereClause,
      ...(filters.lineId && {
        patient: {
          bed: {
            lineId: filters.lineId,
          },
        },
      }),
      ...(filters.serviceId && {
        patient: {
          serviceId: filters.serviceId,
        },
      }),
    },
    include: {
      patient: {
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
          qrScanRecords: {
            where: {
              ...(filters.dailyProcessId && {
                dailyProcessId: filters.dailyProcessId,
              }),
            },
            include: {
              qrCode: true,
            },
          },
        },
      },
      errorLogs: true,
    },
  });

  // Get all patients in scope for baseline calculations
  const allPatients = await prisma.patient.findMany({
    where: {
      status: "ACTIVE",
      ...(filters.lineId && {
        OR: [
          {
            bed: {
              lineId: filters.lineId,
            },
          },
          {
            service: {
              lineId: filters.lineId,
            },
          },
        ],
      }),
      ...(filters.serviceId && {
        serviceId: filters.serviceId,
      }),
    },
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

  const totalPatients = allPatients.length;
  if (totalPatients === 0) {
    return {
      onTimeDelivery: 0,
      onTimeReturns: 0,
      medicationCartAdherence: 0,
      patientsWithErrors: 0,
    };
  }

  // 1. Calculate On-Time Delivery Compliance
  const deliveryProcesses = medicationProcesses.filter(
    (p) =>
      p.step === MedicationProcessStep.ENTREGA &&
      p.status === ProcessStatus.COMPLETED
  );

  // Consider on-time if completed within expected timeframe (you can adjust this logic)
  const onTimeDeliveries = deliveryProcesses.filter((process) => {
    // Simple logic: if completed within 2 hours of expected delivery time
    // You can enhance this with more sophisticated SLA calculations
    const createdAt = new Date(process.createdAt);
    const completedAt = new Date(process.updatedAt);
    const timeDiff = completedAt.getTime() - createdAt.getTime();
    const hoursToComplete = timeDiff / (1000 * 60 * 60);
    return hoursToComplete <= 2; // Assuming 2-hour SLA
  });

  const onTimeDeliveryRate =
    deliveryProcesses.length > 0
      ? (onTimeDeliveries.length / deliveryProcesses.length) * 100
      : 0;

  // 2. Calculate On-Time Returns Compliance
  const returnProcesses = medicationProcesses.filter(
    (p) =>
      p.step === MedicationProcessStep.DEVOLUCION &&
      (p.status === ProcessStatus.COMPLETED ||
        p.status === ProcessStatus.IN_PROGRESS)
  );

  const onTimeReturns = returnProcesses.filter((process) => {
    // Similar logic for returns
    const createdAt = new Date(process.createdAt);
    const completedAt = new Date(process.updatedAt);
    const timeDiff = completedAt.getTime() - createdAt.getTime();
    const hoursToComplete = timeDiff / (1000 * 60 * 60);
    return hoursToComplete <= 1; // Assuming 1-hour SLA for returns
  });

  const onTimeReturnsRate =
    returnProcesses.length > 0
      ? (onTimeReturns.length / returnProcesses.length) * 100
      : 0;

  // 3. Calculate Medication Cart Adherence (based on QR scan verification)
  const patientsWithQRScans = medicationProcesses
    .map((p) => p.patient)
    .filter((patient) =>
      patient.qrScanRecords.some(
        (scan) =>
          scan.qrCode.type === "PHARMACY_DISPATCH" ||
          scan.qrCode.type === "SERVICE_ARRIVAL"
      )
    );

  const medicationCartAdherenceRate =
    totalPatients > 0 ? (patientsWithQRScans.length / totalPatients) * 100 : 0;

  // 4. Calculate Patients with Errors
  const patientsWithErrors = new Set();
  medicationProcesses.forEach((process) => {
    if (process.errorLogs.length > 0) {
      patientsWithErrors.add(process.patientId);
    }
  });

  const patientsWithErrorsRate =
    totalPatients > 0 ? (patientsWithErrors.size / totalPatients) * 100 : 0;

  return {
    onTimeDelivery: Math.round(onTimeDeliveryRate),
    onTimeReturns: Math.round(onTimeReturnsRate),
    medicationCartAdherence: Math.round(medicationCartAdherenceRate),
    patientsWithErrors: Math.round(patientsWithErrorsRate),
  };
}

// Calculate comparative analytics metrics
async function calculateComparativeMetrics(
  filters: StatisticsFilters
): Promise<ComparativeMetrics> {
  const whereClause: Record<string, unknown> = {};

  if (filters.dateFrom || filters.dateTo) {
    (whereClause.createdAt as Record<string, Date>) = {};
    if (filters.dateFrom)
      (whereClause.createdAt as Record<string, Date>).gte = new Date(
        filters.dateFrom
      );
    if (filters.dateTo)
      (whereClause.createdAt as Record<string, Date>).lte = new Date(
        filters.dateTo
      );
  }

  if (filters.dailyProcessId) {
    whereClause.dailyProcessId = filters.dailyProcessId;
  }

  // Get medication processes grouped by line
  const medicationProcesses = await prisma.medicationProcess.findMany({
    where: {
      ...whereClause,
      ...(filters.lineId && {
        patient: {
          OR: [
            {
              bed: {
                lineId: filters.lineId,
              },
            },
            {
              service: {
                lineId: filters.lineId,
              },
            },
          ],
        },
      }),
    },
    include: {
      patient: {
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
          qrScanRecords: {
            include: {
              qrCode: true,
            },
          },
        },
      },
      errorLogs: true,
    },
  });

  // Get manual returns data
  const manualReturns = await prisma.manualReturn.findMany({
    where: {
      ...(filters.dateFrom && {
        createdAt: { gte: new Date(filters.dateFrom) },
      }),
      ...(filters.dateTo && { createdAt: { lte: new Date(filters.dateTo) } }),
    },
    include: {
      patient: {
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
      },
    },
  });

  // Calculate average time per stage by line
  const lineStats: {
    [lineId: string]: { name: string; processes: Record<string, number[]> };
  } = {};

  medicationProcesses.forEach((process) => {
    const lineId = process.patient.service.line.id;
    const lineName = process.patient.service.line.name;

    if (!lineStats[lineId]) {
      lineStats[lineId] = {
        name: lineName,
        processes: {
          [MedicationProcessStep.PREDESPACHO]: [],
          [MedicationProcessStep.ALISTAMIENTO]: [],
          [MedicationProcessStep.VALIDACION]: [],
          [MedicationProcessStep.ENTREGA]: [],
        },
      };
    }

    if (process.step in lineStats[lineId].processes) {
      const duration =
        new Date(process.updatedAt).getTime() -
        new Date(process.createdAt).getTime();
      const hours = duration / (1000 * 60 * 60);
      lineStats[lineId].processes[process.step].push(hours);
    }
  });

  const linesData = Object.values(lineStats).map((line) => {
    const avgPredespacho =
      line.processes[MedicationProcessStep.PREDESPACHO].length > 0
        ? line.processes[MedicationProcessStep.PREDESPACHO].reduce(
            (a: number, b: number) => a + b,
            0
          ) / line.processes[MedicationProcessStep.PREDESPACHO].length
        : 0;

    const avgAlistamiento =
      line.processes[MedicationProcessStep.ALISTAMIENTO].length > 0
        ? line.processes[MedicationProcessStep.ALISTAMIENTO].reduce(
            (a: number, b: number) => a + b,
            0
          ) / line.processes[MedicationProcessStep.ALISTAMIENTO].length
        : 0;

    const avgVerificacion =
      line.processes[MedicationProcessStep.VALIDACION].length > 0
        ? line.processes[MedicationProcessStep.VALIDACION].reduce(
            (a: number, b: number) => a + b,
            0
          ) / line.processes[MedicationProcessStep.VALIDACION].length
        : 0;

    const avgEntrega =
      line.processes[MedicationProcessStep.ENTREGA].length > 0
        ? line.processes[MedicationProcessStep.ENTREGA].reduce(
            (a: number, b: number) => a + b,
            0
          ) / line.processes[MedicationProcessStep.ENTREGA].length
        : 0;

    const total =
      avgPredespacho + avgAlistamiento + avgVerificacion + avgEntrega;

    return {
      name: line.name,
      predespacho: Math.round(avgPredespacho * 100) / 100,
      alistamiento: Math.round(avgAlistamiento * 100) / 100,
      verificacion: Math.round(avgVerificacion * 100) / 100,
      entrega: Math.round(avgEntrega * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  });

  // Calculate manual returns metrics
  const manualReturnsCount = manualReturns.length;
  const totalProcesses = medicationProcesses.length;
  const manualReturnsPercentage =
    totalProcesses > 0 ? (manualReturnsCount / totalProcesses) * 100 : 0;

  // Group manual returns by reason
  const returnsByReason: { [reason: string]: number } = {};
  manualReturns.forEach((ret) => {
    const reason = ret.cause || "Sin especificar";
    returnsByReason[reason] = (returnsByReason[reason] || 0) + 1;
  });

  const manualReturnsByReason = Object.entries(returnsByReason).map(
    ([reason, count]) => ({
      reason,
      count,
      percentage:
        manualReturnsCount > 0
          ? Math.round((count / manualReturnsCount) * 100)
          : 0,
    })
  );

  // Calculate temperature compliance
  const allQRScans = medicationProcesses.flatMap(
    (p) => p.patient.qrScanRecords
  );
  const temperatureReadings = allQRScans
    .map((scan) => scan.temperature)
    .filter((temp): temp is number => temp !== null);

  const averageTemperature =
    temperatureReadings.length > 0
      ? temperatureReadings.reduce((sum, temp) => sum + temp, 0) /
        temperatureReadings.length
      : null;

  // Assume normal temperature range is 2-8°C for medications
  const outOfRangeCount = temperatureReadings.filter(
    (temp) => temp < 2 || temp > 8
  ).length;
  const temperatureComplianceRate =
    temperatureReadings.length > 0
      ? ((temperatureReadings.length - outOfRangeCount) /
          temperatureReadings.length) *
        100
      : 0;

  return {
    averageTimePerStage: {
      total: linesData.reduce((sum, line) => sum + line.total, 0),
      change: 0, // You can calculate this by comparing with previous period
      lines: linesData,
    },
    manualReturns: {
      total: manualReturnsCount,
      change: 0, // You can calculate this by comparing with previous period
      percentage: Math.round(manualReturnsPercentage),
      byReason: manualReturnsByReason,
    },
    temperatureCompliance: {
      averageTemperature: averageTemperature
        ? Math.round(averageTemperature * 100) / 100
        : null,
      outOfRangeCount,
      totalReadings: temperatureReadings.length,
      compliancePercentage: Math.round(temperatureComplianceRate),
    },
    processEfficiency: {
      averageCompletionTime: 0, // Calculate based on your business logic
      onTimeCompletionRate: 0,
      bottleneckStages: [],
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "general"; // "general" or "comparative"

    const filters: StatisticsFilters = {
      lineId: searchParams.get("lineId") || undefined,
      serviceId: searchParams.get("serviceId") || undefined,
      personalRole: searchParams.get("personalRole") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      dailyProcessId: searchParams.get("dailyProcessId") || undefined,
    };

    if (type === "general") {
      const complianceMetrics = await calculateComplianceMetrics(filters);
      return NextResponse.json({
        type: "general",
        data: complianceMetrics,
      });
    } else if (type === "comparative") {
      const comparativeMetrics = await calculateComparativeMetrics(filters);
      return NextResponse.json({
        type: "comparative",
        data: comparativeMetrics,
      });
    }

    return NextResponse.json(
      { error: "Invalid type parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
