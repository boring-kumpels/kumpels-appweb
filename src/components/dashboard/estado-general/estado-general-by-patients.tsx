"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatients } from "@/hooks/use-patients";
import { useCurrentDailyProcess } from "@/hooks/use-daily-processes";
import { useAllMedicationProcesses } from "@/hooks/use-medication-processes";
import {
  PatientWithRelations,
  LineName,
  PatientStatus,
  MedicationProcessStep,
  ProcessStatus,
} from "@/types/patient";

interface ProcessStage {
  id: string;
  name: string;
  status: "pendiente" | "ok" | "en_curso" | "error";
  patientCount: number;
  totalPatients: number;
  metrics: {
    priority: string;
    startTime: string;
    endTime: string;
    hours: number;
    meetsCriteria: boolean;
  };
}

interface LineData {
  id: string;
  name: string;
  patientCount: number;
  showDetails: boolean;
  stages: ProcessStage[];
  patients: PatientWithRelations[];
}

const getLineDisplayName = (lineName: LineName): string => {
  switch (lineName) {
    case LineName.LINE_1:
      return "Línea 1";
    case LineName.LINE_2:
      return "Línea 2";
    case LineName.LINE_3:
      return "Línea 3";
    case LineName.LINE_4:
      return "Línea 4";
    case LineName.LINE_5:
      return "UCIS";
    default:
      return lineName;
  }
};

const getStepDisplayName = (step: MedicationProcessStep): string => {
  switch (step) {
    case MedicationProcessStep.PREDESPACHO:
      return "Predespacho";
    case MedicationProcessStep.ALISTAMIENTO:
      return "Alistamiento";
    case MedicationProcessStep.VALIDACION:
      return "Validación";
    case MedicationProcessStep.ENTREGA:
      return "Entrega";
    case MedicationProcessStep.DEVOLUCION:
      return "Devolución";
    default:
      return step;
  }
};

const getStepPriority = (step: MedicationProcessStep): string => {
  switch (step) {
    case MedicationProcessStep.PREDESPACHO:
    case MedicationProcessStep.ALISTAMIENTO:
      return "Alta";
    case MedicationProcessStep.VALIDACION:
    case MedicationProcessStep.ENTREGA:
      return "Intermedia";
    case MedicationProcessStep.DEVOLUCION:
      return "Baja";
    default:
      return "Baja";
  }
};

const ProcessStageCard: React.FC<{ stage: ProcessStage }> = ({ stage }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusButton = () => {
    const baseClasses = "px-3 py-1 rounded-md text-xs font-medium";

    switch (stage.status) {
      case "ok":
        return (
          <div className={cn(baseClasses, "bg-green-500 text-white")}>
            {stage.patientCount}/{stage.totalPatients}
          </div>
        );
      case "en_curso":
        return (
          <div
            className={cn(
              baseClasses,
              "bg-white text-orange-500 border-2 border-dashed border-orange-500"
            )}
          >
            {stage.patientCount}/{stage.totalPatients}
          </div>
        );
      case "pendiente":
        return (
          <div className={cn(baseClasses, "bg-orange-500 text-white")}>
            {stage.patientCount}/{stage.totalPatients}
          </div>
        );
      case "error":
        return (
          <div className={cn(baseClasses, "bg-red-500 text-white")}>
            {stage.patientCount}/{stage.totalPatients}
          </div>
        );
    }
  };

  const getPriorityIcon = () => {
    switch (stage.metrics.priority) {
      case "Alta":
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      case "Intermedia":
        return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
      case "Baja":
        return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
    }
  };

  const getStatusIcon = () => {
    switch (stage.status) {
      case "ok":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "en_curso":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "pendiente":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="relative">
      <div
        className="flex flex-col items-center space-y-2 p-3 bg-white rounded-lg border border-gray-200 w-full cursor-pointer hover:shadow-md transition-shadow"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center space-x-1">
          {getPriorityIcon()}
          <span className="text-xs text-gray-600">
            {stage.metrics.priority}
          </span>
        </div>
        {getStatusButton()}
        <div className="flex items-center space-x-1">
          {getStatusIcon()}
          <div className="text-sm font-medium text-gray-900 text-center">
            {stage.name}
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {stage.metrics.hours > 0 ? `${stage.metrics.hours}h` : "0h"}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
          <div className="flex items-center space-x-2 mb-2">
            {getPriorityIcon()}
            <span className="text-sm font-medium">
              {stage.metrics.priority}
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div>
              <strong>Pacientes:</strong> {stage.patientCount}/
              {stage.totalPatients}
            </div>
            <div>
              <strong>Inicio:</strong>{" "}
              {stage.metrics.startTime || "No iniciado"}
            </div>
            <div>
              <strong>Fin:</strong> {stage.metrics.endTime || "En proceso"}
            </div>
            <div>
              <strong>Horas:</strong> {stage.metrics.hours}
            </div>
            <div className="flex items-center space-x-1">
              <strong>Cumple criterio:</strong>
              {stage.metrics.meetsCriteria ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
            </div>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
        </div>
      )}
    </div>
  );
};

const LineSection: React.FC<{
  line: LineData;
  onToggleDetails: (lineId: string) => void;
}> = ({ line, onToggleDetails }) => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{line.name}</h3>
            <p className="text-sm text-gray-500">
              {line.patientCount} pacientes activos
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleDetails(line.id)}
            className="flex items-center space-x-2"
          >
            {line.showDetails ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Ocultar Detalles</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Ver Detalles</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Process Stages - All displayed horizontally */}
        <div className="grid grid-cols-5 gap-3 pb-2">
          {line.stages.map((stage) => (
            <ProcessStageCard key={stage.id} stage={stage} />
          ))}
        </div>

        {/* Details Section - Patient List */}
        {line.showDetails && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Pacientes en {line.name}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {line.patients.map((patient) => (
                <Card
                  key={patient.id}
                  className="p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="space-y-3">
                    {/* Patient Info */}
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </h5>
                      <span className="text-xs text-gray-500">
                        Cama {patient.bed.number}
                      </span>
                    </div>

                    {/* Process Status */}
                    <div className="space-y-2">
                      {Object.values(MedicationProcessStep).map((step) => {
                        const process = patient.medicationProcesses.find(
                          (p) => p.step === step
                        );
                        const status = process?.status || ProcessStatus.PENDING;

                        return (
                          <div
                            key={step}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-gray-600">
                              {getStepDisplayName(step)}:
                            </span>
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                status === ProcessStatus.COMPLETED &&
                                  "bg-green-100 text-green-700",
                                status === ProcessStatus.IN_PROGRESS &&
                                  "bg-orange-100 text-orange-700",
                                status === ProcessStatus.PENDING &&
                                  "bg-gray-100 text-gray-700",
                                status === ProcessStatus.ERROR &&
                                  "bg-red-100 text-red-700"
                              )}
                            >
                              {status === ProcessStatus.COMPLETED &&
                                "Completado"}
                              {status === ProcessStatus.IN_PROGRESS &&
                                "En Curso"}
                              {status === ProcessStatus.PENDING && "Pendiente"}
                              {status === ProcessStatus.ERROR && "Error"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function EstadoGeneralByPatients() {
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Fetch current daily process
  const { data: currentDailyProcess } = useCurrentDailyProcess();

  // Fetch all medication processes for the current daily process
  const { isLoading: medicationProcessesLoading } = useAllMedicationProcesses(
    currentDailyProcess?.id
  );

  // Fetch all active patients
  const {
    data: allPatients = [],
    isLoading: patientsLoading,
    error,
  } = usePatients({
    filters: {
      status: PatientStatus.ACTIVE,
    },
  });

  // Group patients by line and calculate process status
  const linesData = useMemo(() => {
    if (!allPatients.length) return [];

    const patientsByLine = allPatients.reduce(
      (acc, patient) => {
        const lineName = patient.bed.line?.name;
        if (!lineName) {
          console.warn(`Patient ${patient.id} has no line information`);
          return acc;
        }
        if (!acc[lineName]) {
          acc[lineName] = [];
        }
        acc[lineName].push(patient);
        return acc;
      },
      {} as Record<LineName, PatientWithRelations[]>
    );

    return Object.entries(patientsByLine).map(([lineName, patients]) => {
      const lineId = lineName.toLowerCase().replace("_", "");
      const lineDisplayName = getLineDisplayName(lineName as LineName);

      // Calculate process stages for this line
      const stages = Object.values(MedicationProcessStep).map((step) => {
        const stepProcesses = patients
          .map((patient) =>
            patient.medicationProcesses.find((p) => p.step === step)
          )
          .filter(Boolean);

        const completedCount = stepProcesses.filter(
          (p) => p?.status === ProcessStatus.COMPLETED
        ).length;
        const inProgressCount = stepProcesses.filter(
          (p) => p?.status === ProcessStatus.IN_PROGRESS
        ).length;
        const errorCount = stepProcesses.filter(
          (p) => p?.status === ProcessStatus.ERROR
        ).length;

        let status: "pendiente" | "ok" | "en_curso" | "error";
        let patientCount = 0;

        if (errorCount > 0) {
          status = "error";
          patientCount = errorCount;
        } else if (completedCount === patients.length) {
          status = "ok";
          patientCount = completedCount;
        } else if (inProgressCount > 0) {
          status = "en_curso";
          patientCount = inProgressCount;
        } else {
          status = "pendiente";
          patientCount = 0;
        }

        // Calculate metrics
        const startTime = stepProcesses.find((p) => p?.startedAt)?.startedAt
          ? new Date(
              stepProcesses.find((p) => p?.startedAt)!.startedAt!
            ).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        const endTime = stepProcesses.find((p) => p?.completedAt)?.completedAt
          ? new Date(
              stepProcesses.find((p) => p?.completedAt)!.completedAt!
            ).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        const hours = stepProcesses.reduce((total, p) => {
          if (p?.startedAt && p?.completedAt) {
            const startDate = new Date(p.startedAt);
            const endDate = new Date(p.completedAt);
            const duration =
              (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
            return total + duration;
          }
          return total;
        }, 0);

        return {
          id: step.toLowerCase(),
          name: getStepDisplayName(step),
          status,
          patientCount,
          totalPatients: patients.length,
          metrics: {
            priority: getStepPriority(step),
            startTime,
            endTime,
            hours: Math.round(hours * 10) / 10,
            meetsCriteria: completedCount === patients.length,
          },
        };
      });

      return {
        id: lineId,
        name: lineDisplayName,
        patientCount: patients.length,
        showDetails: showDetails[lineId] || false,
        stages,
        patients,
      };
    });
  }, [allPatients, showDetails]);

  const handleToggleDetails = (lineId: string) => {
    setShowDetails((prev) => ({
      ...prev,
      [lineId]: !prev[lineId],
    }));
  };

  if (patientsLoading || medicationProcessesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">
          Cargando estado general...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-red-500">
          Error al cargar el estado general: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Estado General por Líneas
        </h1>
        <p className="text-gray-600">
          Monitoreo en tiempo real de pacientes agrupados por líneas
          hospitalarias
        </p>
      </div>

      {/* Line Sections */}
      <div className="space-y-6">
        {linesData.length > 0 ? (
          linesData.map((line) => (
            <LineSection
              key={line.id}
              line={{
                ...line,
                showDetails: showDetails[line.id] || false,
              }}
              onToggleDetails={handleToggleDetails}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center text-muted-foreground">
                No hay pacientes activos para mostrar.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
