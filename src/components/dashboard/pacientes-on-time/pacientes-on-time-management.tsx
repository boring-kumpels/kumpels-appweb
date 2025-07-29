"use client";

import { useState, useMemo, useEffect } from "react";
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
import { useLines, useServices } from "@/hooks/use-lines-beds";
import { useCurrentDailyProcess } from "@/hooks/use-daily-processes";
import { useAllMedicationProcesses } from "@/hooks/use-medication-processes";
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
  // If there's an actual process for this patient/step, return its status
  if (process) {
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

  if (
    step === MedicationProcessStep.VALIDACION ||
    step === MedicationProcessStep.ENTREGA
  ) {
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

  return null; // Default: disabled
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

  // Pre-fetch all medication processes for the current daily process
  // Note: This will return empty array if no daily process exists, which is correct
  const {
    data: allMedicationProcesses = [],
    isLoading: medicationProcessesLoading,
  } = useAllMedicationProcesses(currentDailyProcess?.id);

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

  // Apply filters client-side
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

    // Apply bed filter
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

        // Calculate state for each step
        [
          MedicationProcessStep.PREDESPACHO,
          MedicationProcessStep.ALISTAMIENTO,
          MedicationProcessStep.VALIDACION,
          MedicationProcessStep.ENTREGA,
          MedicationProcessStep.DEVOLUCION,
        ].forEach((step) => {
          const process = patientProcesses.find((p) => p.step === step);
          patientStates[step] = calculateButtonState(
            patient,
            step,
            process,
            allMedicationProcesses
          );
        });

        statesMap.set(patient.id, patientStates);
      });
    }

    return statesMap;
  }, [allPatients, allMedicationProcesses]);

  const { data: lines = [], isLoading: linesLoading } = useLines();
  const { data: services = [], isLoading: servicesLoading = false } =
    useServices(selectedLineId || undefined, true);

  // Create a stable loading state object
  const loadingStates = useMemo(
    () => ({
      patients: isLoading,
      lines: linesLoading,
      services: servicesLoading,
      medicationProcesses: medicationProcessesLoading,
    }),
    [isLoading, linesLoading, servicesLoading, medicationProcessesLoading]
  );

  // Use effect to control when button states are considered "ready"
  useEffect(() => {
    const hasAllData =
      !loadingStates.patients &&
      !loadingStates.lines &&
      !loadingStates.services &&
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

  // Reset service selection when line changes
  useEffect(() => {
    setSelectedServiceId("");
  }, [selectedLineId]);

  const handleOpenPatientDetail = (patient: PatientWithRelations) => {
    console.log(
      "Opening patient detail for:",
      `${patient.firstName} ${patient.lastName}`
    );
  };

  // Get available beds for the selected line
  const availableBeds = useMemo(() => {
    if (!selectedLineId) return [];
    const selectedLine = lines.find((line) => line.id === selectedLineId);
    return selectedLine?.beds || [];
  }, [selectedLineId, lines]);

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

  // Use the new button states ready flag for more precise control
  const isAllDataLoading = !isButtonStatesReady;

  // Show loading state until ALL data is ready
  if (isAllDataLoading) {
    const getLoadingMessage = () => {
      if (loadingStates.patients) return "Cargando pacientes...";
      if (loadingStates.lines) return "Cargando líneas...";
      if (loadingStates.services) return "Cargando servicios...";
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
    <div className="space-y-6">
      {/* Daily Process Status */}
      <DailyProcessStatusCard />

      {/* Combined Filters Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
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
                  setSelectedServiceId("");
                  setSelectedBeds([]);
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
                    setSelectedServiceId("");
                    setSelectedBeds([]);
                  }}
                  className="rounded-full"
                >
                  {line.displayName}
                </Button>
              ))}
            </div>
          </div>

          {/* Service Filter */}
          {selectedLineId && (
            <div>
              <h4 className="text-sm font-medium mb-2">Filtro por Servicio</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedServiceId === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedServiceId("");
                    setSelectedBeds([]);
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
                      setSelectedBeds([]);
                    }}
                    className="rounded-full"
                  >
                    {service.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Bed Filter */}
          <div>
            <h4 className="text-sm font-medium mb-2">Filtro por Cama</h4>
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
                    Camas Disponibles -{" "}
                    {lines.find((l) => l.id === selectedLineId)?.displayName ||
                      "Línea"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Selecciona una o múltiples camas
                    </p>
                    <div className="flex items-center gap-2">
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

                  <div className="grid grid-cols-6 gap-2 max-h-[60vh] overflow-y-auto">
                    {availableBeds.map((bed) => (
                      <Button
                        key={bed.id}
                        variant={
                          selectedBeds.includes(bed.id) ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleBedSelection(bed.id)}
                        className="h-10"
                      >
                        {bed.number}
                      </Button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Pacientes Activos ({patients.length} pacientes)
            </CardTitle>
            <div className="flex items-center gap-2"></div>
          </div>
        </CardHeader>
        <CardContent>
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
          />
        </CardContent>
      </Card>
    </div>
  );
}
