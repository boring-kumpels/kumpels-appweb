"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MedicationProcessStep,
  ProcessStatus,
  PatientWithRelations,
  MedicationProcess,
} from "@/types/patient";
import {
  getStepDisplayName,
  getStatusColorClass,
  canPerformAction,
} from "@/lib/medication-process-permissions";
import {
  useStartMedicationProcess,
  useCompleteMedicationProcess,
  useCreateMedicationProcess,
} from "@/hooks/use-medication-processes";
import { useAuth } from "@/providers/auth-provider";
import { useCurrentDailyProcess } from "@/hooks/use-daily-processes";
import { useCreateDailyProcess } from "@/hooks/use-daily-processes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ProcessStatusButtonProps {
  patient: PatientWithRelations;
  step: MedicationProcessStep;
  userRole: string;
  preloadedProcess?: MedicationProcess | null;
  preCalculatedState?: ProcessStatus | null;
}

export function ProcessStatusButton({
  patient,
  step,
  userRole,
  preloadedProcess,
  preCalculatedState,
}: ProcessStatusButtonProps) {
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorNotes, setErrorNotes] = useState("");
  const { user, profile } = useAuth();
  const { data: currentDailyProcess } = useCurrentDailyProcess();
  const createDailyProcess = useCreateDailyProcess();

  // Use the actual user role from profile, or fallback to the passed userRole
  const actualUserRole = profile?.role || userRole;

  // Use preloaded process if available, don't fetch from API to avoid loading states
  const process = preloadedProcess;

  // Mutations
  const startProcess = useStartMedicationProcess();
  const completeProcess = useCompleteMedicationProcess();
  const createProcess = useCreateMedicationProcess();
  const queryClient = useQueryClient();

  // Check permissions
  const canStart = canPerformAction(step, actualUserRole, "start");
  const canComplete = canPerformAction(step, actualUserRole, "complete");
  const canView = canPerformAction(step, actualUserRole, "view");



  if (!canView) {
    return (
      <div className="flex items-center justify-center">
        <span className="text-gray-400 text-xs">--</span>
      </div>
    );
  }

  // Check if user is regent
  const isRegent =
    actualUserRole === "PHARMACY_REGENT" || actualUserRole === "SUPERADMIN";

  // Special handling when no daily process exists
  if (!currentDailyProcess && step !== MedicationProcessStep.PREDESPACHO) {
    return (
      <div className="flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="px-3 py-1 h-8 w-8 rounded-full text-xs font-medium bg-transparent text-gray-900 border-2 border-black cursor-not-allowed"
          disabled
        >
        </Button>
      </div>
    );
  }

  const handleButtonClick = async () => {
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      let dailyProcess = currentDailyProcess;

      // If no daily process exists and this is a regent clicking predespacho, create daily process first
      if (!dailyProcess && isRegent && step === MedicationProcessStep.PREDESPACHO) {
        const today = new Date();
        const createdDailyProcess = await createDailyProcess.mutateAsync({
          date: today,
          notes: `Proceso diario iniciado automáticamente por ${profile.firstName} ${profile.lastName}`,
        });

        dailyProcess = createdDailyProcess;

        toast({
          title: "Proceso diario iniciado",
          description: "Se ha iniciado automáticamente el proceso diario",
        });
      }

      if (!dailyProcess) {
        toast({
          title: "Error",
          description: "No se pudo iniciar el proceso diario",
          variant: "destructive",
        });
        return;
      }

      // Determine the expected final status for optimistic updates
      let expectedFinalStatus: ProcessStatus;
      
      if (step === MedicationProcessStep.PREDESPACHO && isRegent) {
        expectedFinalStatus = ProcessStatus.COMPLETED; // Predespacho auto-completes
      } else if (step === MedicationProcessStep.ALISTAMIENTO && isRegent) {
        if (!process) {
          expectedFinalStatus = ProcessStatus.IN_PROGRESS; // First click starts it
        } else if (process.status === ProcessStatus.PENDING) {
          expectedFinalStatus = ProcessStatus.IN_PROGRESS; // Start it
        } else {
          expectedFinalStatus = ProcessStatus.COMPLETED; // Complete it
        }
      } else if (step === MedicationProcessStep.VALIDACION && actualUserRole === "PHARMACY_VALIDATOR") {
        expectedFinalStatus = ProcessStatus.COMPLETED; // Validacion auto-completes
      } else if (step === MedicationProcessStep.ENTREGA) {
        expectedFinalStatus = ProcessStatus.COMPLETED; // Entrega auto-completes
      } else {
        // Default behavior
        if (!process) {
          expectedFinalStatus = ProcessStatus.PENDING;
        } else if (process.status === ProcessStatus.PENDING && canStart) {
          expectedFinalStatus = ProcessStatus.IN_PROGRESS;
        } else if (process.status === ProcessStatus.IN_PROGRESS && canComplete) {
          expectedFinalStatus = ProcessStatus.COMPLETED;
        } else if (process.status === ProcessStatus.ERROR) {
          expectedFinalStatus = ProcessStatus.IN_PROGRESS;
        } else {
          return; // No action needed
        }
      }

      // Perform optimistic update immediately
      if (!process) {
        // Create optimistic process first
        const optimisticProcess: MedicationProcess = {
          id: `temp-${Date.now()}`,
          patientId: patient.id,
          dailyProcessId: dailyProcess.id,
          step: step,
          status: expectedFinalStatus,
          notes: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Update the cache optimistically
        const currentProcesses = queryClient.getQueryData<MedicationProcess[]>([
          "all-medication-processes",
          dailyProcess.id,
        ]) || [];
        
        queryClient.setQueryData(
          ["all-medication-processes", dailyProcess.id],
          [...currentProcesses, optimisticProcess]
        );

        // Now perform the actual operations in the background
        const createdProcess = await createProcess.mutateAsync({
          patientId: patient.id,
          step,
          dailyProcessId: dailyProcess.id,
        });

        // Continue with the workflow based on expected status
        let finalProcess = createdProcess;
        if (expectedFinalStatus === ProcessStatus.IN_PROGRESS) {
          finalProcess = await startProcess.mutateAsync(createdProcess.id);
        } else if (expectedFinalStatus === ProcessStatus.COMPLETED) {
          await startProcess.mutateAsync(createdProcess.id);
          finalProcess = await completeProcess.mutateAsync(createdProcess.id);
        }

        // Update the optimistic process with the real data once all operations complete
        const finalCurrentProcesses = queryClient.getQueryData<MedicationProcess[]>([
          "all-medication-processes",
          dailyProcess.id,
        ]) || [];
        
        const finalProcesses = finalCurrentProcesses.map(p => 
          p.id === optimisticProcess.id ? finalProcess : p
        );
        queryClient.setQueryData(
          ["all-medication-processes", dailyProcess.id],
          finalProcesses
        );
      } else {
        // Update existing process optimistically
        const currentProcesses = queryClient.getQueryData<MedicationProcess[]>([
          "all-medication-processes",
          dailyProcess.id,
        ]) || [];
        
        const updatedProcesses = currentProcesses.map(p => 
          p.id === process.id 
            ? { ...p, status: expectedFinalStatus, updatedAt: new Date() }
            : p
        );
        queryClient.setQueryData(
          ["all-medication-processes", dailyProcess.id],
          updatedProcesses
        );

        // Perform actual server operations and update with real data
        let finalProcess = process;
        if (expectedFinalStatus === ProcessStatus.IN_PROGRESS) {
          finalProcess = await startProcess.mutateAsync(process.id);
        } else if (expectedFinalStatus === ProcessStatus.COMPLETED) {
          if (process.status === ProcessStatus.PENDING) {
            await startProcess.mutateAsync(process.id);
          }
          finalProcess = await completeProcess.mutateAsync(process.id);
        }

        // Update the cache with the real data once operations complete
        const finalUpdatedProcesses = queryClient.getQueryData<MedicationProcess[]>([
          "all-medication-processes",
          dailyProcess.id,
        ]) || [];
        
        const completedProcesses = finalUpdatedProcesses.map(p => 
          p.id === process.id ? finalProcess : p
        );
        queryClient.setQueryData(
          ["all-medication-processes", dailyProcess.id],
          completedProcesses
        );
      }
      
      // Only invalidate daily process queries if a new one was created
      if (!currentDailyProcess && step === MedicationProcessStep.PREDESPACHO && dailyProcess) {
        queryClient.invalidateQueries({ queryKey: ["daily-processes"] });
        queryClient.invalidateQueries({ queryKey: ["current-daily-process"] });
      }
      
      toast({
        title: "Proceso actualizado",
        description: `${stepName} procesado correctamente`,
      });
    } catch (error) {
      console.error("Error handling process:", error);
      
      // Revert optimistic updates on error by invalidating and refetching
      queryClient.invalidateQueries({ 
        queryKey: ["all-medication-processes"],
        refetchType: "active"
      });
      
      toast({
        title: "Error",
        description: "Error al procesar la acción",
        variant: "destructive",
      });
    }
  };

  const handleErrorReport = async () => {
    if (!process) return;

    try {
      await fetch(`/api/medication-processes/${process.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: ProcessStatus.ERROR,
          notes: errorNotes,
        }),
      });

      setIsErrorDialogOpen(false);
      setErrorNotes("");
      toast({
        title: "Error reportado",
        description: "Se ha reportado el error correctamente",
      });
    } catch {
      toast({
        title: "Error",
        description: "Error al reportar el problema",
        variant: "destructive",
      });
    }
  };


  const stepName = getStepDisplayName(step);
  
  // CRITICAL: Only use pre-calculated state to ensure all buttons update simultaneously
  // Never fall back to individual calculations as this causes gradual button enabling
  const buttonStatus = preCalculatedState;
  
  const isStepEnabledByWorkflow = buttonStatus !== null;
  
  
  const colorClass = buttonStatus 
    ? getStatusColorClass(buttonStatus, isStepEnabledByWorkflow)
    : getStatusColorClass(ProcessStatus.PENDING, false); // Use false for disabled state

  // Determine if button should be clickable
  const isClickable = (() => {
    // If preCalculatedState is undefined, button states are still being computed
    // Don't allow clicks during this phase to prevent inconsistent behavior
    if (preCalculatedState === undefined) {
      return false;
    }
    
    // Special case for predespacho: always clickable for regents when empty or in progress
    if (step === MedicationProcessStep.PREDESPACHO && isRegent) {
      return buttonStatus === null || buttonStatus === ProcessStatus.IN_PROGRESS;
    }
    
    if (!isStepEnabledByWorkflow) {
      return false; // Step not enabled due to workflow
    }
    
    // Check role permissions
    if (!canStart && !canComplete) return false;
    
    switch (buttonStatus) {
      case ProcessStatus.PENDING:
        return canStart;
      case ProcessStatus.IN_PROGRESS:
        return canComplete;
      case ProcessStatus.COMPLETED:
        return false; // Cannot modify completed process
      case ProcessStatus.ERROR:
        return canStart; // Can retry from error
      default:
        return canStart; // Can create new process if step is enabled and button shows as enabled
    }
  })();

  // Determine button text based on status and step
  const getButtonText = () => {
    // If states are being computed, show loading indicator
    if (preCalculatedState === undefined) {
      return "...";
    }
    
    return stepName;
  };

  const buttonText = getButtonText();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={`px-3 py-1 h-8 min-w-[80px] rounded-full text-xs font-medium ${colorClass} ${!isClickable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={isClickable ? handleButtonClick : undefined}
        disabled={!isClickable || preCalculatedState === undefined}
      >
        {buttonText}
      </Button>

      {/* Error Report Dialog - Only show for processes that can have errors */}
      {process && canStart && (
        <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="px-2 py-1 h-7 rounded-full text-xs font-medium bg-red-50 text-red-600 border-red-200"
              onClick={(e) => {
                e.stopPropagation();
                setIsErrorDialogOpen(true);
              }}
            >
              !
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reportar Error - {stepName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="error-notes">Descripción del problema</Label>
                <Textarea
                  id="error-notes"
                  placeholder="Describe el problema encontrado..."
                  value={errorNotes}
                  onChange={(e) => setErrorNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsErrorDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleErrorReport} disabled={!errorNotes.trim()}>
                  Reportar Error
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
