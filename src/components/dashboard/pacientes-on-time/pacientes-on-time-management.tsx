"use client";

import { useState, useMemo } from "react";
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
import { useLines } from "@/hooks/use-lines-beds";
import { useCurrentDailyProcess } from "@/hooks/use-daily-processes";
import { useAllMedicationProcesses } from "@/hooks/use-medication-processes";
import { PatientWithRelations, PatientStatus, LineName, MedicationProcess, MedicationProcessStep, ProcessStatus } from "@/types/patient";

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
      p => p.step === MedicationProcessStep.PREDESPACHO && 
      (p.status === ProcessStatus.IN_PROGRESS || p.status === ProcessStatus.COMPLETED)
    );
    
    if (anyPredespachoStarted) {
      return ProcessStatus.IN_PROGRESS; // Show as in progress (orange dotted)
    }
    return null; // Show as empty (black border) - not started yet
  }
  
  if (step === MedicationProcessStep.ALISTAMIENTO) {
    const predespachoProcess = allMedicationProcesses.find(
      p => p.patientId === patient.id && p.step === MedicationProcessStep.PREDESPACHO
    );
    if (predespachoProcess?.status === ProcessStatus.COMPLETED) {
      return ProcessStatus.PENDING; // Show as pending (orange filled)
    }
    return null; // Show as disabled (black border)
  }
  
  if (step === MedicationProcessStep.VALIDACION || step === MedicationProcessStep.ENTREGA) {
    const alistamientoProcess = allMedicationProcesses.find(
      p => p.patientId === patient.id && p.step === MedicationProcessStep.ALISTAMIENTO
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
  const [selectedLineName, setSelectedLineName] = useState<LineName | "">("");
  const [selectedBeds, setSelectedBeds] = useState<string[]>([]);

  // Fetch current daily process
  const { data: currentDailyProcess } = useCurrentDailyProcess();

  // Pre-fetch all medication processes for the current daily process
  // Note: This will return empty array if no daily process exists, which is correct
  const { 
    data: allMedicationProcesses = [], 
    isLoading: medicationProcessesLoading,
    isFetching: medicationProcessesFetching
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
      filtered = filtered.filter(patient => 
        patient.firstName.toLowerCase().includes(query) ||
        patient.lastName.toLowerCase().includes(query) ||
        patient.externalId.toLowerCase().includes(query) ||
        patient.bed?.number.toLowerCase().includes(query)
      );
    }

    // Apply line filter
    if (selectedLineName) {
      filtered = filtered.filter(patient => 
        patient.bed?.lineName === selectedLineName
      );
    }

    // Apply bed filter
    if (selectedBeds.length > 0) {
      filtered = filtered.filter(patient => 
        patient.bed && selectedBeds.includes(patient.bed.id)
      );
    }

    return filtered;
  }, [allPatients, searchQuery, selectedLineName, selectedBeds]);

  // Pre-calculate all button states to avoid individual calculations per button
  const buttonStatesMap = useMemo(() => {
    const statesMap = new Map();
    
    // Only calculate if we have the data
    if (allPatients.length > 0) {
      allPatients.forEach(patient => {
        const patientStates: Record<string, ProcessStatus | null> = {};
        
        // Get processes for this patient
        const patientProcesses = allMedicationProcesses.filter(
          p => p.patientId === patient.id
        );
        
        // Calculate state for each step
        [
          MedicationProcessStep.PREDESPACHO,
          MedicationProcessStep.ALISTAMIENTO, 
          MedicationProcessStep.VALIDACION,
          MedicationProcessStep.ENTREGA,
          MedicationProcessStep.DEVOLUCION
        ].forEach(step => {
          const process = patientProcesses.find(p => p.step === step);
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

  const handleOpenPatientDetail = (patient: PatientWithRelations) => {
    console.log(
      "Opening patient detail for:",
      `${patient.firstName} ${patient.lastName}`
    );
  };

  // Get available beds for the selected line
  const availableBeds = useMemo(() => {
    if (!selectedLineName) return [];
    const selectedLine = lines.find((line) => line.name === selectedLineName);
    return selectedLine?.beds || [];
  }, [selectedLineName, lines]);

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

  // Check if all critical data is loaded
  const isDataLoading = isLoading || linesLoading || (currentDailyProcess && (medicationProcessesLoading || medicationProcessesFetching));
  
  // Check if button states are being computed
  const isComputingStates = allPatients.length > 0 && buttonStatesMap.size === 0;
  
  // Overall loading state
  const isAllDataLoading = isDataLoading || isComputingStates;
  
  // Show loading state until ALL data is ready
  if (isAllDataLoading) {
    const getLoadingMessage = () => {
      if (isLoading) return "Cargando pacientes...";
      if (linesLoading) return "Cargando líneas...";
      if (medicationProcessesLoading || medicationProcessesFetching) return "Cargando procesos...";
      if (isComputingStates) return "Calculando estados de botones...";
      return "Cargando datos...";
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
            <div className={`flex items-center space-x-1 ${!isLoading ? 'text-green-600' : ''}`}>
              {!isLoading ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Pacientes</span>
            </div>
            
            <div className={`flex items-center space-x-1 ${!linesLoading ? 'text-green-600' : ''}`}>
              {!linesLoading ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Líneas</span>
            </div>
            
            <div className={`flex items-center space-x-1 ${!medicationProcessesLoading && !medicationProcessesFetching ? 'text-green-600' : ''}`}>
              {!medicationProcessesLoading && !medicationProcessesFetching ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Procesos</span>
            </div>
            
            <div className={`flex items-center space-x-1 ${!isComputingStates ? 'text-green-600' : ''}`}>
              {!isComputingStates ? (
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
            {isComputingStates && (
              <p>Procesando {allPatients.length} pacientes y calculando estados de botones...</p>
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
                  placeholder="Buscar por nombre, cama o identificación..."
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
                variant={selectedLineName === "" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedLineName("");
                  setSelectedBeds([]);
                }}
                className="rounded-full"
              >
                Todas las líneas
              </Button>
              {lines.map((line) => (
                <Button
                  key={line.name}
                  variant={
                    selectedLineName === line.name ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    setSelectedLineName(line.name as LineName);
                    setSelectedBeds([]);
                  }}
                  className="rounded-full"
                >
                  {line.displayName}
                </Button>
              ))}
            </div>
          </div>

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
                  disabled={!selectedLineName}
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
                    {lines.find((l) => l.name === selectedLineName)
                      ?.displayName || "Línea"}
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
                  Todos los estados calculados correctamente ({buttonStatesMap.size} pacientes procesados)
                </span>
              </div>
            </div>
          )}
          
          <PatientsTable
            patients={patients}
            isLoading={isLoading}
            onOpenPatientDetail={handleOpenPatientDetail}
            preloadedMedicationProcesses={(allMedicationProcesses as MedicationProcess[]) || []}
            currentDailyProcessId={currentDailyProcess?.id}
            buttonStatesMap={buttonStatesMap}
          />
        </CardContent>
      </Card>
    </div>
  );
}
