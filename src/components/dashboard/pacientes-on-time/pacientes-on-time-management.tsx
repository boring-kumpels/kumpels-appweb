"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Bed, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { PatientsTable } from "./patients-table";
import { DailyProcessStatusCard } from "./daily-process-status";
import { usePatients } from "@/hooks/use-patients";
import { useLines, useServices, useBeds } from "@/hooks/use-lines-beds";
import { useCurrentDailyProcess } from "@/hooks/use-daily-processes";
import { useAllMedicationProcesses } from "@/hooks/use-medication-processes";
import { useQuery } from "@tanstack/react-query";
import {
  PatientWithRelations,
  PatientStatus,
  MedicationProcess,
  MedicationProcessStep,
  ProcessStatus,
} from "@/types/patient";

// Helper function to calculate button state (extracted from ProcessStatusButton logic)
function calculateButtonState(
  patient: PatientWithRelations,
  step: MedicationProcessStep,
  process: MedicationProcess | undefined,
  allMedicationProcesses: MedicationProcess[]
) {
  console.log(
    `[DEBUG] Management calculateButtonState - Patient: ${patient.id}, Step: ${step}, Process:`,
    process?.status
  );

  // If there's an actual process for this patient/step, return its status
  if (process) {
    console.log(
      `[DEBUG] Management - Process exists for ${step}, returning:`,
      process.status
    );
    return process.status;
  }

  // No process exists for this patient/step - determine what state to show
  if (step === MedicationProcessStep.PREDESPACHO) {
    // Check if any predespacho has started in the daily process
    const anyPredespachoStarted = allMedicationProcesses.some(
      (p) =>
        p.step === MedicationProcessStep.PREDESPACHO &&
        (p.status === ProcessStatus.IN_PROGRESS ||
          p.status === ProcessStatus.COMPLETED)
    );

    if (anyPredespachoStarted) {
      return ProcessStatus.IN_PROGRESS; // Show as in progress (orange dotted)
    }
    return null; // Show as empty (black border) - not started yet
  }

  if (step === MedicationProcessStep.ALISTAMIENTO) {
    const predespachoProcess = allMedicationProcesses.find(
      (p) =>
        p.patientId === patient.id &&
        p.step === MedicationProcessStep.PREDESPACHO
    );
    if (predespachoProcess?.status === ProcessStatus.COMPLETED) {
      return ProcessStatus.PENDING; // Show as pending (orange filled)
    }
    return null; // Show as disabled (black border)
  }

  if (step === MedicationProcessStep.VALIDACION) {
    const alistamientoProcess = allMedicationProcesses.find(
      (p) =>
        p.patientId === patient.id &&
        p.step === MedicationProcessStep.ALISTAMIENTO
    );
    if (alistamientoProcess?.status === ProcessStatus.COMPLETED) {
      return ProcessStatus.PENDING; // Show as pending (orange filled)
    }
    return null; // Show as disabled (black border)
  }

  if (step === MedicationProcessStep.ENTREGA) {
    const alistamientoProcess = allMedicationProcesses.find(
      (p) =>
        p.patientId === patient.id &&
        p.step === MedicationProcessStep.ALISTAMIENTO
    );

    // Check if ALISTAMIENTO is completed (prerequisite for QR scanning)
    if (alistamientoProcess?.status === ProcessStatus.COMPLETED) {
      // Check if patient has been through QR scan process
      const entregaProcess = allMedicationProcesses.find(
        (p) =>
          p.patientId === patient.id && p.step === MedicationProcessStep.ENTREGA
      );

      if (entregaProcess) {
        // If ENTREGA process exists, return its actual status
        return entregaProcess.status;
      } else {
        // No ENTREGA process yet - show as pending (orange) for QR scanning
        return ProcessStatus.PENDING;
      }
    }
    return null; // Show as disabled (black border) - ALISTAMIENTO not completed
  }

  if (step === MedicationProcessStep.DEVOLUCION) {
    // Check if patient has a devolution process
    const devolucionProcess = allMedicationProcesses.find(
      (p) =>
        p.patientId === patient.id &&
        p.step === MedicationProcessStep.DEVOLUCION
    );

    if (devolucionProcess) {
      // If DEVOLUCION process exists and is ongoing, show as IN_PROGRESS (orange dashed)
      // Only show as COMPLETED when the entire devolution process is truly finished
      console.log(
        `[DEBUG] Management table - DEVOLUCION process found for patient ${patient.id}, status:`,
        devolucionProcess.status
      );
      if (devolucionProcess.status === ProcessStatus.COMPLETED) {
        console.log(
          `[DEBUG] Management table - Returning COMPLETED (green solid)`
        );
        return ProcessStatus.COMPLETED; // Green solid - fully finished
      } else if (
        devolucionProcess.status === ProcessStatus.DISPATCHED_FROM_PHARMACY ||
        devolucionProcess.status === ProcessStatus.DELIVERED_TO_SERVICE ||
        devolucionProcess.status === ProcessStatus.IN_PROGRESS
      ) {
        console.log(
          `[DEBUG] Management table - Returning IN_PROGRESS (orange dashed) for status: ${devolucionProcess.status}`
        );
        return ProcessStatus.IN_PROGRESS; // Orange dashed - ongoing devolution
      } else {
        console.log(
          `[DEBUG] Management table - Returning status for devolution process: ${devolucionProcess.status}`
        );
        // For other statuses (PENDING, etc.), return the actual status
        return devolucionProcess.status;
      }
    } else {
      // No DEVOLUCION process yet - show as not initialized (outlined) for nurses to start
      // Devolutions are now independent and don't require ENTREGA completion
      return null;
    }
  }

  return null; // Default: disabled
}

// QR Scan Record interface
interface QRScanRecord {
  id: string;
  patientId: string;
  qrCodeId: string;
  scannedBy: string;
  scannedAt: string;
  dailyProcessId: string;
  transactionType?: string; // "ENTREGA" or "DEVOLUCION"
  qrCode: {
    id: string;
    type:
      | "PHARMACY_DISPATCH"
      | "PHARMACY_DISPATCH_DEVOLUTION"
      | "SERVICE_ARRIVAL"
      | "DEVOLUTION_PICKUP"
      | "DEVOLUTION_RETURN";
    service?: {
      id: string;
      name: string;
      line: {
        id: string;
        displayName: string;
      };
    };
  };
}

export default function PacientesOnTimeManagement() {
  const [isBedSelectionOpen, setIsBedSelectionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedBeds, setSelectedBeds] = useState<string[]>([]);
  const [isButtonStatesReady, setIsButtonStatesReady] = useState(false);

  // Fetch current daily process
  const { data: currentDailyProcess } = useCurrentDailyProcess();
  console.log(
    `[DEBUG] Management - currentDailyProcess:`,
    currentDailyProcess?.id,
    currentDailyProcess?.status
  );

  // Pre-fetch all medication processes for the current daily process
  // Note: This will return empty array if no daily process exists, which is correct
  const {
    data: allMedicationProcesses = [],
    isLoading: medicationProcessesLoading,
  } = useAllMedicationProcesses(currentDailyProcess?.id);
  console.log(
    `[DEBUG] Management - medicationProcessesLoading:`,
    medicationProcessesLoading,
    "processes count:",
    allMedicationProcesses.length
  );

  // Fetch ALL active patients at once (no server-side filtering)
  const {
    data: allPatients = [],
    isLoading,
    error,
  } = usePatients({
    filters: {
      status: PatientStatus.ACTIVE,
    },
  });

  // Fetch QR scan records for all patients
  const { data: allQRScanRecords = [] } = useQuery<QRScanRecord[]>({
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

  // Fetch lines and services
  const { data: lines = [], isLoading: linesLoading } = useLines();
  const { data: services = [], isLoading: servicesLoading = false } =
    useServices(selectedLineId || undefined, true);

  // Fetch beds with enhanced filtering
  const { data: allBeds = [], isLoading: bedsLoading } = useBeds({
    lineId: selectedLineId || undefined,
    enabled: true,
  });

  // Enhanced available beds calculation
  const availableBeds = useMemo(() => {
    let beds = allBeds;

    // If a line is selected, filter beds by line
    if (selectedLineId) {
      beds = beds.filter((bed) => bed.lineId === selectedLineId);
    }

    // If a service is selected, filter beds to only show those that have patients in that service
    if (selectedServiceId) {
      // Get all patients in the selected service
      const patientsInService = allPatients.filter(
        (patient) => patient.serviceId === selectedServiceId
      );

      // Get the bed IDs that have patients in this service
      const bedIdsWithPatientsInService = new Set(
        patientsInService.map((patient) => patient.bedId)
      );

      // Filter beds to only include those that have patients in the selected service
      beds = beds.filter((bed) => bedIdsWithPatientsInService.has(bed.id));
    }

    return beds;
  }, [allBeds, selectedLineId, selectedServiceId, allPatients]);

  // Apply filters client-side with enhanced logic
  const patients = useMemo(() => {
    let filtered = allPatients;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (patient) =>
          patient.firstName.toLowerCase().includes(query) ||
          patient.lastName.toLowerCase().includes(query) ||
          patient.externalId.toLowerCase().includes(query) ||
          patient.bed?.number.toLowerCase().includes(query) ||
          patient.service?.name.toLowerCase().includes(query)
      );
    }

    // Apply line filter
    if (selectedLineId) {
      filtered = filtered.filter(
        (patient) => patient.service?.lineId === selectedLineId
      );
    }

    // Apply service filter
    if (selectedServiceId) {
      filtered = filtered.filter(
        (patient) => patient.serviceId === selectedServiceId
      );
    }

    // Apply bed filter with enhanced logic
    if (selectedBeds.length > 0) {
      filtered = filtered.filter(
        (patient) => patient.bed && selectedBeds.includes(patient.bed.id)
      );
    }

    return filtered;
  }, [
    allPatients,
    searchQuery,
    selectedLineId,
    selectedServiceId,
    selectedBeds,
  ]);

  // Pre-calculate all button states to avoid individual calculations per button
  // This automatically updates when allMedicationProcesses changes due to optimistic updates
  const buttonStatesMap = useMemo(() => {
    const statesMap = new Map();

    // Calculate button states for all patients
    if (allPatients.length > 0) {
      allPatients.forEach((patient) => {
        const patientStates: Record<string, ProcessStatus | null> = {};

        // Get processes for this patient
        const patientProcesses = allMedicationProcesses.filter(
          (p) => p.patientId === patient.id
        );
        console.log(
          `[DEBUG] Management - Patient ${patient.id} has ${patientProcesses.length} processes:`,
          patientProcesses.map((p) => `${p.step}:${p.status}`)
        );
        console.log(
          `[DEBUG] Management - Total allMedicationProcesses:`,
          allMedicationProcesses.length
        );

        // Calculate state for each step
        [
          MedicationProcessStep.PREDESPACHO,
          MedicationProcessStep.ALISTAMIENTO,
          MedicationProcessStep.VALIDACION,
          MedicationProcessStep.ENTREGA,
          MedicationProcessStep.DEVOLUCION,
        ].forEach((step) => {
          const process = patientProcesses.find((p) => p.step === step);
          const calculatedState = calculateButtonState(
            patient,
            step,
            process,
            allMedicationProcesses
          );
          patientStates[step] = calculatedState;

          // Debug logging for devolution
          if (step === MedicationProcessStep.DEVOLUCION) {
            console.log(
              `[DEBUG] Management - Patient ${patient.id} DEVOLUCION:`,
              {
                processStatus: process?.status,
                calculatedState,
                patientStates: patientStates,
              }
            );
          }
        });

        statesMap.set(patient.id, patientStates);
      });
    }

    return statesMap;
  }, [allPatients, allMedicationProcesses]);

  // Create a stable loading state object
  const loadingStates = useMemo(
    () => ({
      patients: isLoading,
      lines: linesLoading,
      services: servicesLoading,
      beds: bedsLoading,
      medicationProcesses: medicationProcessesLoading,
    }),
    [
      isLoading,
      linesLoading,
      servicesLoading,
      bedsLoading,
      medicationProcessesLoading,
    ]
  );

  // Use effect to control when button states are considered "ready"
  useEffect(() => {
    const hasAllData =
      !loadingStates.patients &&
      !loadingStates.lines &&
      !loadingStates.services &&
      !loadingStates.beds &&
      !loadingStates.medicationProcesses;
    const hasPatients = allPatients.length > 0;
    const hasCompleteButtonStates =
      buttonStatesMap.size === allPatients.length &&
      allPatients.every((patient) => buttonStatesMap.has(patient.id));

    if (hasAllData && hasPatients && hasCompleteButtonStates) {
      setIsButtonStatesReady(true);
    } else {
      setIsButtonStatesReady(false);
    }
  }, [loadingStates, allPatients, buttonStatesMap]);

  // Enhanced filter reset logic
  const resetFilters = useCallback(() => {
    setSelectedLineId("");
    setSelectedServiceId("");
    setSelectedBeds([]);
    setSearchQuery("");
  }, []);

  const resetServiceAndBeds = useCallback(() => {
    setSelectedServiceId("");
    setSelectedBeds([]);
  }, []);

  const resetBeds = useCallback(() => {
    setSelectedBeds([]);
  }, []);

  // Reset service and beds when line changes
  useEffect(() => {
    resetServiceAndBeds();
  }, [selectedLineId, resetServiceAndBeds]);

  // Reset beds when service changes
  useEffect(() => {
    resetBeds();
  }, [selectedServiceId, resetBeds]);

  const handleOpenPatientDetail = (patient: PatientWithRelations) => {
    console.log(
      "Opening patient detail for:",
      `${patient.firstName} ${patient.lastName}`
    );
  };

  const handleBedSelection = (bedId: string) => {
    setSelectedBeds((prev) =>
      prev.includes(bedId) ? prev.filter((b) => b !== bedId) : [...prev, bedId]
    );
  };

  const handleBedSelectionApply = () => {
    setIsBedSelectionOpen(false);
    console.log("Selected beds:", selectedBeds);
  };

  const handleBedSelectionClear = () => {
    setSelectedBeds([]);
  };

  // Enhanced bed selection with "Select All" functionality
  const handleSelectAllBeds = () => {
    setSelectedBeds(availableBeds.map((bed) => bed.id));
  };

  const handleDeselectAllBeds = () => {
    setSelectedBeds([]);
  };

  // Use the new button states ready flag for more precise control
  const isAllDataLoading = !isButtonStatesReady;

  // Show loading state until ALL data is ready
  if (isAllDataLoading) {
    const getLoadingMessage = () => {
      if (loadingStates.patients) return "Cargando pacientes...";
      if (loadingStates.lines) return "Cargando líneas...";
      if (loadingStates.services) return "Cargando servicios...";
      if (loadingStates.beds) return "Cargando camas...";
      if (loadingStates.medicationProcesses) return "Cargando procesos...";
      return "Calculando estados de botones...";
    };

    return (
      <div className="space-y-6">
        {/* Daily Process Status */}
        <DailyProcessStatusCard />

        {/* Loading Indicator */}
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-lg font-medium">{getLoadingMessage()}</span>
          </div>

          {/* Progress indicators */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div
              className={`flex items-center space-x-1 ${!loadingStates.patients ? "text-green-600" : ""}`}
            >
              {!loadingStates.patients ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Pacientes</span>
            </div>

            <div
              className={`flex items-center space-x-1 ${!loadingStates.lines ? "text-green-600" : ""}`}
            >
              {!loadingStates.lines ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Líneas</span>
            </div>

            <div
              className={`flex items-center space-x-1 ${!loadingStates.services ? "text-green-600" : ""}`}
            >
              {!loadingStates.services ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Servicios</span>
            </div>

            <div
              className={`flex items-center space-x-1 ${!loadingStates.beds ? "text-green-600" : ""}`}
            >
              {!loadingStates.beds ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Camas</span>
            </div>

            <div
              className={`flex items-center space-x-1 ${!loadingStates.medicationProcesses ? "text-green-600" : ""}`}
            >
              {!loadingStates.medicationProcesses ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Procesos</span>
            </div>

            <div
              className={`flex items-center space-x-1 ${isButtonStatesReady ? "text-green-600" : ""}`}
            >
              {isButtonStatesReady ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Estados</span>
            </div>
          </div>

          {/* Additional info */}
          <div className="text-xs text-muted-foreground text-center max-w-md">
            {!isButtonStatesReady && allPatients.length > 0 && (
              <p>
                Procesando {allPatients.length} pacientes y calculando estados
                de botones...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500">Error al cargar los pacientes</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Daily Process Status */}
      <DailyProcessStatusCard />

      {/* Enhanced Filters Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <div className="flex items-center gap-2">
              {/* Reset All Filters Button */}
              {(selectedLineId ||
                selectedServiceId ||
                selectedBeds.length > 0 ||
                searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs"
                >
                  Limpiar todos los filtros
                </Button>
              )}
              {/* Search Section */}
              <div className="flex-1 max-w-md ml-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre, cama, servicio o identificación..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Line Filter */}
          <div>
            <h4 className="text-sm font-medium mb-2">Filtro por Línea</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedLineId === "" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedLineId("");
                  resetServiceAndBeds();
                }}
                className="rounded-full"
              >
                Todas las líneas
              </Button>
              {lines.map((line) => (
                <Button
                  key={line.id}
                  variant={selectedLineId === line.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedLineId(line.id);
                    resetServiceAndBeds();
                  }}
                  className="rounded-full"
                >
                  {line.displayName}
                </Button>
              ))}
            </div>
          </div>

          {/* Service Filter - Enhanced */}
          {selectedLineId && (
            <div>
              <h4 className="text-sm font-medium mb-2">
                Filtro por Servicio
                {services.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({services.length} servicios disponibles)
                  </span>
                )}
              </h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedServiceId === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedServiceId("");
                    resetBeds();
                  }}
                  className="rounded-full"
                >
                  Todos los servicios
                </Button>
                {services.map((service) => (
                  <Button
                    key={service.id}
                    variant={
                      selectedServiceId === service.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      setSelectedServiceId(service.id);
                      resetBeds();
                    }}
                    className="rounded-full"
                  >
                    {service.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Bed Filter */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              Filtro por Cama
              {availableBeds.length > 0 && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({availableBeds.length} camas disponibles
                  {selectedLineId && " en la línea seleccionada"}
                  {selectedServiceId &&
                    " con pacientes en el servicio seleccionado"}
                  )
                </span>
              )}
            </h4>
            <Dialog
              open={isBedSelectionOpen}
              onOpenChange={setIsBedSelectionOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!selectedLineId}
                >
                  <Bed className="h-4 w-4 mr-2" />
                  {selectedBeds.length > 0
                    ? `${selectedBeds.length} cama${selectedBeds.length > 1 ? "s" : ""} seleccionada${selectedBeds.length > 1 ? "s" : ""}`
                    : "Seleccionar camas"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>
                    Camas Disponibles
                    {selectedLineId && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        -{" "}
                        {
                          lines.find((l) => l.id === selectedLineId)
                            ?.displayName
                        }
                      </span>
                    )}
                    {selectedServiceId && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        -{" "}
                        {services.find((s) => s.id === selectedServiceId)?.name}{" "}
                        (filtrado por servicio)
                      </span>
                    )}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p>
                        Selecciona una o múltiples camas
                        {availableBeds.length > 0 && (
                          <span className="ml-1">
                            ({availableBeds.length} disponibles)
                          </span>
                        )}
                      </p>
                      {selectedServiceId && (
                        <p className="text-xs mt-1 text-blue-600">
                          💡 Mostrando solo camas que tienen pacientes en el
                          servicio seleccionado.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAllBeds}
                        disabled={selectedBeds.length === 0}
                      >
                        Deseleccionar todo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllBeds}
                        disabled={availableBeds.length === 0}
                      >
                        Seleccionar todo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBedSelectionClear}
                      >
                        Limpiar
                      </Button>
                      <Button size="sm" onClick={handleBedSelectionApply}>
                        Aplicar ({selectedBeds.length})
                      </Button>
                    </div>
                  </div>

                  {availableBeds.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bed className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>
                        No hay camas disponibles para los filtros seleccionados
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 gap-2 max-h-[60vh] overflow-y-auto">
                      {availableBeds.map((bed) => (
                        <Button
                          key={bed.id}
                          variant={
                            selectedBeds.includes(bed.id)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handleBedSelection(bed.id)}
                          className="h-10"
                        >
                          {bed.number}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filter Summary */}
          {(selectedLineId || selectedServiceId || selectedBeds.length > 0) && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Filtros activos:</span>
                {selectedLineId && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Línea:{" "}
                    {lines.find((l) => l.id === selectedLineId)?.displayName}
                  </span>
                )}
                {selectedServiceId && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Servicio:{" "}
                    {services.find((s) => s.id === selectedServiceId)?.name}
                  </span>
                )}
                {selectedBeds.length > 0 && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                    {selectedBeds.length} cama
                    {selectedBeds.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patients Table Section */}
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Pacientes Activos ({patients.length} pacientes)
            </CardTitle>
            <div className="flex items-center gap-2"></div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Show ready indicator briefly */}
          {buttonStatesMap.size > 0 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 text-green-700">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Todos los estados calculados correctamente (
                  {buttonStatesMap.size} pacientes procesados)
                </span>
              </div>
            </div>
          )}

          <div className="w-full">
            <PatientsTable
              patients={patients}
              isLoading={false} // Don't show loading since we already handled it above
              onOpenPatientDetail={handleOpenPatientDetail}
              preloadedMedicationProcesses={
                (allMedicationProcesses as MedicationProcess[]) || []
              }
              currentDailyProcessId={currentDailyProcess?.id}
              buttonStatesMap={buttonStatesMap}
              isButtonStatesReady={isButtonStatesReady}
              qrScanRecords={allQRScanRecords}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
