/**
 * Estado General Management Component
 *
 * This component provides a comprehensive real-time overview of all hospital lines,
 * integrating data from the patient process system and QR scanning with temperature monitoring.
 *
 * Key Features:
 * - Real-time patient process tracking across all medication stages
 * - Temperature data integration from QR scanning records grouped by line and service
 * - Line-based organization with detailed process metrics
 * - Service-level temperature information with current stage and temperature history
 * - Summary statistics dashboard with live data
 * - Interactive details view for each line
 *
 * Data Sources:
 * - Patient records with bed and service assignments
 * - Medication processes (predespacho, alistamiento, validación, entrega, devolución)
 * - QR scan records with temperature readings and timestamps
 * - Daily process sessions for data scoping
 */

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  CheckCircle,
  Thermometer,
  Clock,
  User,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatients } from "@/hooks/use-patients";
import { useCurrentDailyProcess } from "@/hooks/use-daily-processes";
import { useAllMedicationProcesses } from "@/hooks/use-medication-processes";
import { useQuery } from "@tanstack/react-query";
import {
  PatientStatus,
  MedicationProcessStep,
  ProcessStatus,
  LineName,
} from "@/types/patient";
import { getLineDisplayName } from "@/lib/lines";

interface QRScanRecord {
  id: string;
  patientId: string;
  qrCodeId: string;
  scannedBy: string;
  scannedAt: string;
  dailyProcessId: string | null;
  temperature: number | null;
  destinationLineId: string | null;
  transactionType: string | null;
  qrCode: {
    id: string;
    type: string;
    service?: {
      id: string;
      name: string;
      line: {
        id: string;
        name: string;
      };
    };
  };
}

interface ProcessStage {
  id: MedicationProcessStep;
  name: string;
  status: ProcessStatus | "pendiente";
  patientCount: number;
  completedPatients: number;
  averageTemperature: number | null;
  lastScannedAt: string | null;
  processMetrics: {
    totalProcesses: number;
    completedProcesses: number;
    averageCompletionTime: number | null;
    temperatureReadings: number[];
  };
}

interface ServiceData {
  id: string;
  name: string;
  patientCount: number;
  lastTemperature: number | null;
  lastScannedAt: string | null;
  temperatureReadings: Array<{
    temperature: number;
    scannedAt: string;
    qrType: string;
    transactionType: string | null;
  }>;
  processSteps: Array<{
    step: MedicationProcessStep;
    status: ProcessStatus | "pendiente";
    startedAt: string | null;
    completedAt: string | null;
  }>;
}

interface LineData {
  id: string;
  name: string;
  displayName: string;
  patientCount: number;
  showDetails: boolean;
  stages: ProcessStage[];
  services: ServiceData[];
}

// Helper function to get stage display name
const getStageDisplayName = (stage: MedicationProcessStep): string => {
  switch (stage) {
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
      return stage;
  }
};

// Helper function to determine stage status
const getStageStatus = (
  processes: Array<{
    step: MedicationProcessStep;
    status: ProcessStatus;
    patientId: string;
  }>,
  stage: MedicationProcessStep,
  completedCount: number,
  totalPatients: number
): ProcessStatus | "pendiente" => {
  const stageProcesses = processes.filter((p) => p.step === stage);

  // If all patients have completed this stage, show as completed
  if (completedCount === totalPatients && completedCount > 0) {
    return ProcessStatus.COMPLETED;
  }

  // If some patients have completed but not all, show as in progress
  if (completedCount > 0) {
    return ProcessStatus.IN_PROGRESS;
  }

  // If no patients have completed, check if any processes exist
  if (stageProcesses.length > 0) {
    const hasInProgress = stageProcesses.some(
      (p) =>
        p.status === ProcessStatus.IN_PROGRESS ||
        p.status === ProcessStatus.DISPATCHED_FROM_PHARMACY ||
        p.status === ProcessStatus.DELIVERED_TO_SERVICE
    );

    if (hasInProgress) return ProcessStatus.IN_PROGRESS;
  }

  return "pendiente";
};

// Helper function to calculate individual patient step status
const getPatientStepStatus = (
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    externalId: string;
    bed?: {
      id: string;
      number: string;
      line?: {
        id: string;
        name: string;
      };
    };
  },
  step: MedicationProcessStep,
  patientProcesses: Array<{
    step: MedicationProcessStep;
    status: ProcessStatus;
    patientId: string;
  }>,
  patientQRRecords: Array<{
    qrCode: {
      type: string;
    };
    transactionType: string | null;
  }>
): ProcessStatus | "pendiente" => {
  const stepProcesses = patientProcesses.filter((p) => p.step === step);

  switch (step) {
    case MedicationProcessStep.PREDESPACHO:
    case MedicationProcessStep.ALISTAMIENTO:
    case MedicationProcessStep.VALIDACION:
      // For basic processes, check medication process status
      if (stepProcesses.some((p) => p.status === ProcessStatus.COMPLETED)) {
        return ProcessStatus.COMPLETED;
      }
      if (stepProcesses.some((p) => p.status === ProcessStatus.IN_PROGRESS)) {
        return ProcessStatus.IN_PROGRESS;
      }
      return stepProcesses.length > 0 ? ProcessStatus.PENDING : "pendiente";

    case MedicationProcessStep.ENTREGA:
      // For entrega, check if both QR scans exist AND medication process is completed
      const hasPharmacyDispatch = patientQRRecords.some(
        (r) => r.qrCode.type === "PHARMACY_DISPATCH"
      );
      const hasServiceArrival = patientQRRecords.some(
        (r) => r.qrCode.type === "SERVICE_ARRIVAL"
      );
      const hasCompletedEntrega = stepProcesses.some(
        (p) => p.status === ProcessStatus.COMPLETED
      );

      if (hasPharmacyDispatch && hasServiceArrival && hasCompletedEntrega) {
        return ProcessStatus.COMPLETED;
      }
      if (
        hasPharmacyDispatch ||
        hasServiceArrival ||
        stepProcesses.length > 0
      ) {
        return ProcessStatus.IN_PROGRESS;
      }
      return "pendiente";

    case MedicationProcessStep.DEVOLUCION:
      // For devolucion, check if there's a process that has been started/completed
      if (
        stepProcesses.some(
          (p) =>
            p.status === ProcessStatus.IN_PROGRESS ||
            p.status === ProcessStatus.DISPATCHED_FROM_PHARMACY ||
            p.status === ProcessStatus.DELIVERED_TO_SERVICE ||
            p.status === ProcessStatus.COMPLETED
        )
      ) {
        return ProcessStatus.COMPLETED; // Show as completed if nurse has made request
      }
      return stepProcesses.length > 0 ? ProcessStatus.IN_PROGRESS : "pendiente";

    default:
      return stepProcesses.some((p) => p.status === ProcessStatus.COMPLETED)
        ? ProcessStatus.COMPLETED
        : stepProcesses.length > 0
          ? ProcessStatus.IN_PROGRESS
          : "pendiente";
  }
};

const ProcessStageCard: React.FC<{ stage: ProcessStage }> = ({ stage }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusButton = () => {
    const baseClasses = "px-3 py-1 rounded-md text-xs font-medium";

    switch (stage.status) {
      case ProcessStatus.COMPLETED:
        return (
          <div className={cn(baseClasses, "bg-green-500 text-white")}>
            Completado
          </div>
        );
      case ProcessStatus.IN_PROGRESS:
      case ProcessStatus.DISPATCHED_FROM_PHARMACY:
      case ProcessStatus.DELIVERED_TO_SERVICE:
        return (
          <div
            className={cn(
              baseClasses,
              "bg-white text-orange-500 border-2 border-dashed border-orange-500"
            )}
          >
            En Curso
          </div>
        );
      case "pendiente":
      default:
        return (
          <div className={cn(baseClasses, "bg-orange-500 text-white")}>
            Pendiente
          </div>
        );
    }
  };

  const getPriorityIcon = () => {
    // Determine priority based on completion rate
    const completionRate =
      stage.patientCount > 0 ? stage.completedPatients / stage.patientCount : 0;
    if (completionRate >= 0.8) {
      return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
    } else if (completionRate >= 0.5) {
      return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
    } else {
      return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
    }
  };

  const getPriorityText = () => {
    const completionRate =
      stage.patientCount > 0 ? stage.completedPatients / stage.patientCount : 0;
    if (completionRate >= 0.8) return "Alta";
    if (completionRate >= 0.5) return "Intermedia";
    return "Baja";
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
          <span className="text-xs text-gray-600">{getPriorityText()}</span>
        </div>
        {getStatusButton()}
        <div className="text-sm font-medium text-gray-900 text-center">
          {stage.name}
        </div>
        <div className="text-xs text-gray-500">
          {stage.completedPatients}/{stage.patientCount} pacientes
        </div>
        {stage.averageTemperature && (
          <div className="flex items-center space-x-1 text-xs text-blue-600">
            <Thermometer className="h-3 w-3" />
            <span>{stage.averageTemperature.toFixed(1)}°C</span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[220px]">
          <div className="flex items-center space-x-2 mb-2">
            {getPriorityIcon()}
            <span className="text-sm font-medium">
              Eficiencia: {getPriorityText()}
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div>
              <strong>Pacientes:</strong> {stage.completedPatients}/
              {stage.patientCount}
            </div>
            <div>
              <strong>Procesos:</strong>{" "}
              {stage.processMetrics.completedProcesses}/
              {stage.processMetrics.totalProcesses}
            </div>
            {stage.averageTemperature && (
              <div className="flex items-center space-x-1">
                <Thermometer className="h-3 w-3 text-blue-500" />
                <strong>Temp. promedio:</strong>{" "}
                {stage.averageTemperature.toFixed(1)}°C
              </div>
            )}
            {stage.processMetrics.temperatureReadings.length > 0 && (
              <div>
                <strong>Lecturas temp.:</strong>{" "}
                {stage.processMetrics.temperatureReadings.length}
              </div>
            )}
            {stage.lastScannedAt && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-gray-500" />
                <strong>Último escaneo:</strong>{" "}
                {new Date(stage.lastScannedAt).toLocaleTimeString()}
              </div>
            )}
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
  onTogglePatientDetails: (patientId: string) => void;
  showPatientDetails: { [key: string]: boolean };
}> = ({
  line,
  onToggleDetails,
  onTogglePatientDetails,
  showPatientDetails,
}) => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{line.name}</h3>
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

        {/* Details Section - Enhanced with Patient Information and Temperature Data */}
        {line.showDetails && (
          <div className="pt-4 border-t border-gray-200 space-y-6">
            {/* Process Stages Detailed View */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Detalle de Procesos
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {line.stages.map((stage) => (
                  <Card
                    key={stage.id}
                    className="p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="space-y-3">
                      {/* Header with stage name and metrics */}
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm text-gray-900">
                          {stage.name}
                        </h5>
                        <div className="flex items-center space-x-1">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              stage.status === ProcessStatus.COMPLETED
                                ? "bg-green-500"
                                : stage.status === ProcessStatus.IN_PROGRESS ||
                                    stage.status ===
                                      ProcessStatus.DISPATCHED_FROM_PHARMACY ||
                                    stage.status ===
                                      ProcessStatus.DELIVERED_TO_SERVICE
                                  ? "bg-orange-500"
                                  : "bg-gray-500"
                            )}
                          ></div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="flex justify-start">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            stage.status === ProcessStatus.COMPLETED &&
                              "bg-green-100 text-green-700",
                            (stage.status === ProcessStatus.IN_PROGRESS ||
                              stage.status ===
                                ProcessStatus.DISPATCHED_FROM_PHARMACY ||
                              stage.status ===
                                ProcessStatus.DELIVERED_TO_SERVICE) &&
                              "bg-orange-100 text-orange-700",
                            stage.status === "pendiente" &&
                              "bg-gray-100 text-gray-700"
                          )}
                        >
                          {stage.status === ProcessStatus.COMPLETED &&
                            "Completado"}
                          {(stage.status === ProcessStatus.IN_PROGRESS ||
                            stage.status ===
                              ProcessStatus.DISPATCHED_FROM_PHARMACY ||
                            stage.status ===
                              ProcessStatus.DELIVERED_TO_SERVICE) &&
                            "En Curso"}
                          {stage.status === "pendiente" && "Pendiente"}
                        </span>
                      </div>

                      {/* Metrics grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Pacientes:</span>
                          <div className="font-medium">
                            {stage.completedPatients}/{stage.patientCount}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Procesos:</span>
                          <div className="font-medium">
                            {stage.processMetrics.completedProcesses}/
                            {stage.processMetrics.totalProcesses}
                          </div>
                        </div>
                      </div>

                      {/* Temperature information */}
                      {(stage.averageTemperature ||
                        stage.processMetrics.temperatureReadings.length >
                          0) && (
                        <div className="bg-blue-50 rounded-lg p-2 space-y-1">
                          {stage.averageTemperature && (
                            <div className="flex items-center space-x-1 text-xs text-blue-700">
                              <Thermometer className="h-3 w-3" />
                              <span>
                                Temp. promedio:{" "}
                                {stage.averageTemperature.toFixed(1)}°C
                              </span>
                            </div>
                          )}
                          {stage.processMetrics.temperatureReadings.length >
                            0 && (
                            <div className="text-xs text-blue-600">
                              {stage.processMetrics.temperatureReadings.length}{" "}
                              lecturas de temperatura
                            </div>
                          )}
                        </div>
                      )}

                      {/* Last activity */}
                      {stage.lastScannedAt && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            Último:{" "}
                            {new Date(stage.lastScannedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Patient List with Temperature Data */}
            {line.services.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Servicios de la Línea
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    {line.services.map((service) => (
                      <div
                        key={service.id}
                        className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow"
                      >
                        {/* Service Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-base font-medium text-gray-900">
                              {service.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Pacientes: {service.patientCount}
                            </span>
                            {service.lastTemperature && (
                              <div className="flex items-center space-x-1 text-blue-600">
                                <Thermometer className="h-4 w-4" />
                                <span className="font-medium">
                                  Última: {service.lastTemperature.toFixed(1)}°C
                                </span>
                              </div>
                            )}
                            {service.lastScannedAt && (
                              <div className="flex items-center space-x-1 text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {new Date(
                                    service.lastScannedAt
                                  ).toLocaleString()}
                                </span>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onTogglePatientDetails(service.id)}
                              className="text-xs h-6 px-2"
                            >
                              {showPatientDetails[service.id] ? (
                                <>
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Ocultar Procesos
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  Ver Procesos
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Process Steps Details */}
                        {showPatientDetails[service.id] && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <h6 className="text-sm font-semibold text-gray-700 mb-3">
                              Estado de Procesos:
                            </h6>
                            <div className="grid grid-cols-1 gap-2">
                              {service.processSteps.map((processStep) => (
                                <div
                                  key={processStep.step}
                                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-100"
                                >
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`w-3 h-3 rounded-full ${
                                        processStep.status ===
                                        ProcessStatus.COMPLETED
                                          ? "bg-green-500"
                                          : processStep.status ===
                                                ProcessStatus.IN_PROGRESS ||
                                              processStep.status ===
                                                ProcessStatus.DISPATCHED_FROM_PHARMACY ||
                                              processStep.status ===
                                                ProcessStatus.DELIVERED_TO_SERVICE
                                            ? "bg-orange-500"
                                            : processStep.status ===
                                                ProcessStatus.PENDING
                                              ? "bg-yellow-500"
                                              : "bg-gray-300"
                                      }`}
                                    ></div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {getStageDisplayName(processStep.step)}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        processStep.status ===
                                        ProcessStatus.COMPLETED
                                          ? "bg-green-100 text-green-700"
                                          : processStep.status ===
                                                ProcessStatus.IN_PROGRESS ||
                                              processStep.status ===
                                                ProcessStatus.DISPATCHED_FROM_PHARMACY ||
                                              processStep.status ===
                                                ProcessStatus.DELIVERED_TO_SERVICE
                                            ? "bg-orange-100 text-orange-700"
                                            : processStep.status ===
                                                ProcessStatus.PENDING
                                              ? "bg-yellow-100 text-yellow-700"
                                              : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {processStep.status ===
                                        ProcessStatus.COMPLETED && "Completado"}
                                      {(processStep.status ===
                                        ProcessStatus.IN_PROGRESS ||
                                        processStep.status ===
                                          ProcessStatus.DISPATCHED_FROM_PHARMACY ||
                                        processStep.status ===
                                          ProcessStatus.DELIVERED_TO_SERVICE) &&
                                        "En Curso"}
                                      {processStep.status ===
                                        ProcessStatus.PENDING && "Pendiente"}
                                      {processStep.status === "pendiente" &&
                                        "Sin Iniciar"}
                                    </span>
                                    {processStep.completedAt && (
                                      <span className="text-xs text-gray-500">
                                        {new Date(
                                          processStep.completedAt
                                        ).toLocaleTimeString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Temperature Readings History */}
                        {service.temperatureReadings.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">
                              Historial de Temperaturas:
                            </h5>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {service.temperatureReadings.map(
                                (reading, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Thermometer className="h-3 w-3 text-blue-500" />
                                      <span className="text-sm font-medium text-blue-700">
                                        {reading.temperature.toFixed(1)}°C
                                      </span>
                                      <span className="text-xs text-blue-600 bg-blue-200 px-2 py-0.5 rounded">
                                        {reading.qrType ===
                                          "PHARMACY_DISPATCH" &&
                                          "Salida Farmacia"}
                                        {reading.qrType ===
                                          "PHARMACY_DISPATCH_DEVOLUTION" &&
                                          "Salida Farmacia (Dev)"}
                                        {reading.qrType === "SERVICE_ARRIVAL" &&
                                          "Llegada Servicio"}
                                        {reading.qrType ===
                                          "DEVOLUTION_PICKUP" &&
                                          "Recogida Devolución"}
                                        {reading.qrType ===
                                          "DEVOLUTION_RETURN" &&
                                          "Recepción Farmacia"}
                                      </span>
                                      {reading.transactionType && (
                                        <span className="text-xs text-gray-600">
                                          ({reading.transactionType})
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(
                                        reading.scannedAt
                                      ).toLocaleString()}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>

                            {/* Temperature Summary Stats */}
                            {service.temperatureReadings.length > 1 && (
                              <div className="bg-gray-50 rounded-lg p-2 mt-3">
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="text-center">
                                    <div className="font-medium text-green-600">
                                      {Math.min(
                                        ...service.temperatureReadings.map(
                                          (r) => r.temperature
                                        )
                                      ).toFixed(1)}
                                      °C
                                    </div>
                                    <div className="text-gray-500">Mínima</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium text-blue-600">
                                      {(
                                        service.temperatureReadings.reduce(
                                          (sum, r) => sum + r.temperature,
                                          0
                                        ) / service.temperatureReadings.length
                                      ).toFixed(1)}
                                      °C
                                    </div>
                                    <div className="text-gray-500">
                                      Promedio
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium text-red-600">
                                      {Math.max(
                                        ...service.temperatureReadings.map(
                                          (r) => r.temperature
                                        )
                                      ).toFixed(1)}
                                      °C
                                    </div>
                                    <div className="text-gray-500">Máxima</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* No Temperature Readings */}
                        {service.temperatureReadings.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            <Thermometer className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">
                              No hay registros de temperatura
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function EstadoGeneralManagement() {
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [showPatientDetails, setShowPatientDetails] = useState<{
    [key: string]: boolean;
  }>({});

  // Fetch current daily process
  const { data: currentDailyProcess } = useCurrentDailyProcess();

  // Fetch all active patients
  const { data: allPatients = [], isLoading: patientsLoading } = usePatients({
    filters: {
      status: PatientStatus.ACTIVE,
    },
  });

  // Fetch all medication processes for current daily process
  const { data: allMedicationProcesses = [], isLoading: processesLoading } =
    useAllMedicationProcesses(currentDailyProcess?.id);

  // Fetch QR scan records with temperature data
  const { data: allQRScanRecords = [], isLoading: qrLoading } = useQuery<
    QRScanRecord[]
  >({
    queryKey: ["all-qr-scan-records", currentDailyProcess?.id],
    queryFn: async (): Promise<QRScanRecord[]> => {
      if (!currentDailyProcess?.id) return [];
      const response = await fetch(
        `/api/qr-scan-records?dailyProcessId=${currentDailyProcess.id}`
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!currentDailyProcess?.id,
  });

  // Process data to create line-based structure with service grouping
  const lines = useMemo(() => {
    if (!allPatients.length || patientsLoading || processesLoading || qrLoading)
      return [];

    // Group patients by line and service
    const patientsByLineAndService = allPatients.reduce(
      (acc, patient) => {
        if (!patient.bed?.line || !patient.service) {
          return acc; // Skip patients without bed, line, or service
        }
        const lineId = patient.bed.line.id;
        const serviceId = patient.service.id;

        if (!acc[lineId]) {
          acc[lineId] = {
            line: patient.bed.line,
            services: {},
          };
        }

        if (!acc[lineId].services[serviceId]) {
          acc[lineId].services[serviceId] = {
            service: patient.service,
            patients: [],
          };
        }

        acc[lineId].services[serviceId].patients.push(patient);
        return acc;
      },
      {} as Record<
        string,
        {
          line?: {
            id: string;
            name: string;
          };
          services: Record<
            string,
            {
              service: {
                id: string;
                name: string;
                lineId: string;
              };
              patients: Array<{
                id: string;
                firstName: string;
                lastName: string;
                externalId: string;
                bed: {
                  id: string;
                  number: string;
                  line?: {
                    id: string;
                    name: string;
                  };
                };
                service: {
                  id: string;
                  name: string;
                  lineId: string;
                };
              }>;
            }
          >;
        }
      >
    );

    // Create QR records lookup by patient
    const qrRecordsByPatient = allQRScanRecords.reduce(
      (acc, record) => {
        if (!acc[record.patientId]) acc[record.patientId] = [];
        acc[record.patientId].push(record);
        return acc;
      },
      {} as Record<string, QRScanRecord[]>
    );

    return Object.values(patientsByLineAndService).map(({ line, services }) => {
      // Get all patients in this line
      const allLinePatients = Object.values(services).flatMap(
        (s) => s.patients
      );

      const stages = Object.values(MedicationProcessStep).map((step) => {
        // Get all processes for this step across patients in this line
        const stageProcesses = allMedicationProcesses.filter(
          (p) =>
            p.step === step &&
            allLinePatients.some((patient) => patient.id === p.patientId)
        );

        // Get QR records for this stage across all patients in this line
        const stageQRRecords = allLinePatients.flatMap(
          (patient) =>
            qrRecordsByPatient[patient.id]?.filter((record) => {
              // Map QR types to medication process steps - more comprehensive mapping
              const qrToStepMap: Record<string, MedicationProcessStep> = {
                PHARMACY_DISPATCH: MedicationProcessStep.PREDESPACHO,
                PHARMACY_DISPATCH_DEVOLUTION: MedicationProcessStep.PREDESPACHO,
                SERVICE_ARRIVAL: MedicationProcessStep.ENTREGA,
                DEVOLUTION_PICKUP: MedicationProcessStep.DEVOLUCION,
                DEVOLUTION_RETURN: MedicationProcessStep.DEVOLUCION,
              };
              return qrToStepMap[record.qrCode.type] === step;
            }) || []
        );

        // Calculate temperature metrics
        const temperatureReadings = stageQRRecords
          .map((r) => r.temperature)
          .filter((temp): temp is number => temp !== null);

        const averageTemperature =
          temperatureReadings.length > 0
            ? temperatureReadings.reduce((sum, temp) => sum + temp, 0) /
              temperatureReadings.length
            : null;

        const lastScannedAt =
          stageQRRecords.length > 0
            ? stageQRRecords.sort(
                (a, b) =>
                  new Date(b.scannedAt).getTime() -
                  new Date(a.scannedAt).getTime()
              )[0].scannedAt
            : null;

        // Count completed patients based on the step type (matching patient detail view logic)
        const completedPatientsCount = allLinePatients.filter((patient) => {
          const patientQRRecords = qrRecordsByPatient[patient.id] || [];
          const patientProcesses = stageProcesses.filter(
            (p) => p.patientId === patient.id
          );

          switch (step) {
            case MedicationProcessStep.PREDESPACHO:
            case MedicationProcessStep.ALISTAMIENTO:
            case MedicationProcessStep.VALIDACION:
              // For basic processes, check medication process status
              return patientProcesses.some(
                (p) => p.status === ProcessStatus.COMPLETED
              );

            case MedicationProcessStep.ENTREGA:
              // For entrega, check if both QR scans exist AND medication process is completed
              const hasPharmacyDispatch = patientQRRecords.some(
                (r) => r.qrCode.type === "PHARMACY_DISPATCH"
              );
              const hasServiceArrival = patientQRRecords.some(
                (r) => r.qrCode.type === "SERVICE_ARRIVAL"
              );
              const hasCompletedEntrega = patientProcesses.some(
                (p) => p.status === ProcessStatus.COMPLETED
              );

              return (
                hasPharmacyDispatch && hasServiceArrival && hasCompletedEntrega
              );

            case MedicationProcessStep.DEVOLUCION:
              // For devolucion, check if there's a process that has been started/completed
              // Special handling - show as completed if nurse has made the request
              return patientProcesses.some(
                (p) =>
                  p.status === ProcessStatus.IN_PROGRESS ||
                  p.status === ProcessStatus.DISPATCHED_FROM_PHARMACY ||
                  p.status === ProcessStatus.DELIVERED_TO_SERVICE ||
                  p.status === ProcessStatus.COMPLETED
              );

            default:
              return patientProcesses.some(
                (p) => p.status === ProcessStatus.COMPLETED
              );
          }
        }).length;

        return {
          id: step,
          name: getStageDisplayName(step),
          status: getStageStatus(
            stageProcesses,
            step,
            completedPatientsCount,
            allLinePatients.length
          ),
          patientCount: allLinePatients.length,
          completedPatients: completedPatientsCount,
          averageTemperature,
          lastScannedAt,
          processMetrics: {
            totalProcesses: stageProcesses.length,
            completedProcesses: stageProcesses.filter(
              (p) => p.status === ProcessStatus.COMPLETED
            ).length,
            averageCompletionTime: null, // Could be calculated if needed
            temperatureReadings,
          },
        };
      });

      // Process service data with temperature information
      const processedServices = Object.values(services).map(
        ({ service, patients }) => {
          // Get all QR records for patients in this service
          const serviceQRRecords = patients.flatMap(
            (patient) => qrRecordsByPatient[patient.id] || []
          );

          const latestQRRecord = serviceQRRecords.sort(
            (a, b) =>
              new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
          )[0];

          // Get all medication processes for patients in this service
          const serviceProcesses = allMedicationProcesses.filter((p) =>
            patients.some((patient) => patient.id === p.patientId)
          );

          // Collect all temperature readings for this service
          const temperatureReadings = serviceQRRecords
            .filter((record) => record.temperature !== null)
            .map((record) => ({
              temperature: record.temperature!,
              scannedAt: record.scannedAt,
              qrType: record.qrCode.type,
              transactionType: record.transactionType,
            }))
            .sort(
              (a, b) =>
                new Date(b.scannedAt).getTime() -
                new Date(a.scannedAt).getTime()
            );

          // Calculate process steps status for this service
          const processSteps = Object.values(MedicationProcessStep).map(
            (step) => {
              const stepProcesses = serviceProcesses.filter(
                (p) => p.step === step
              );

              return {
                step,
                status: getPatientStepStatus(
                  patients[0], // Use first patient as reference for service status
                  step,
                  serviceProcesses,
                  serviceQRRecords
                ),
                startedAt: (() => {
                  const started =
                    stepProcesses.length > 0
                      ? stepProcesses[0].startedAt
                      : null;
                  if (!started) return null;
                  return started instanceof Date
                    ? started.toISOString()
                    : started;
                })(),
                completedAt: (() => {
                  const completed = stepProcesses.find(
                    (p) => p.status === ProcessStatus.COMPLETED
                  )?.completedAt;
                  if (!completed) return null;
                  return completed instanceof Date
                    ? completed.toISOString()
                    : completed;
                })(),
              };
            }
          );

          return {
            id: service.id,
            name: service.name,
            patientCount: patients.length,
            lastTemperature: latestQRRecord?.temperature || null,
            lastScannedAt: latestQRRecord?.scannedAt || null,
            temperatureReadings,
            processSteps,
          };
        }
      );

      return {
        id: line?.id || "unknown",
        name: line?.name || "Desconocida",
        displayName: getLineDisplayName(
          (line?.name as LineName) || LineName.LINE_1
        ),
        patientCount: allLinePatients.length,
        showDetails: showDetails[line?.id || "unknown"] || false,
        stages,
        services: processedServices,
      };
    });
  }, [
    allPatients,
    allMedicationProcesses,
    allQRScanRecords,
    showDetails,
    patientsLoading,
    processesLoading,
    qrLoading,
  ]);

  const handleToggleDetails = (lineId: string) => {
    setShowDetails((prev) => ({
      ...prev,
      [lineId]: !prev[lineId],
    }));
  };

  const handleTogglePatientDetails = (patientId: string) => {
    setShowPatientDetails((prev) => ({
      ...prev,
      [patientId]: !prev[patientId],
    }));
  };

  if (patientsLoading || processesLoading || qrLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Estado General de Líneas
          </h1>
          <p className="text-gray-600">Cargando información del sistema...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalPatients = lines.reduce((sum, line) => sum + line.patientCount, 0);
  const totalQRScans = allQRScanRecords.length;
  const averageTemperature = allQRScanRecords
    .map((r) => r.temperature)
    .filter((temp): temp is number => temp !== null);
  const avgTemp =
    averageTemperature.length > 0
      ? averageTemperature.reduce((sum, temp) => sum + temp, 0) /
        averageTemperature.length
      : null;

  return (
    <div className="space-y-6">
      {/* Header with Real-time Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Estado General de Líneas
            </h1>
            <p className="text-gray-600">
              Monitoreo en tiempo real de todas las líneas hospitalarias
            </p>
          </div>
          {currentDailyProcess && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  Proceso Diario Activo
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Iniciado el{" "}
                {new Date(currentDailyProcess.startedAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totalPatients}
                  </div>
                  <div className="text-xs text-gray-500">Pacientes Activos</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {lines.length}
                  </div>
                  <div className="text-xs text-gray-500">Líneas Activas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totalQRScans}
                  </div>
                  <div className="text-xs text-gray-500">Escaneos QR Hoy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Thermometer className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {avgTemp ? `${avgTemp.toFixed(1)}°C` : "N/A"}
                  </div>
                  <div className="text-xs text-gray-500">Temp. Promedio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* No Data State */}
      {lines.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay datos disponibles
            </h3>
            <p className="text-gray-600 mb-4">
              {!currentDailyProcess
                ? "No hay un proceso diario activo. Inicia un nuevo proceso para ver el estado de las líneas."
                : "No se encontraron pacientes activos en el sistema."}
            </p>
            {!currentDailyProcess && (
              <Button variant="outline">Iniciar Proceso Diario</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Line Sections */}
      {lines.length > 0 && (
        <div className="space-y-6">
          {lines.map((line) => (
            <LineSection
              key={line.id}
              line={line}
              onToggleDetails={handleToggleDetails}
              onTogglePatientDetails={handleTogglePatientDetails}
              showPatientDetails={showPatientDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}
