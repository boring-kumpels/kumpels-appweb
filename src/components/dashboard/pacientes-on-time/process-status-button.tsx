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
import { useCurrentUser } from "@/hooks/use-current-user";
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
  allPatientProcesses?: MedicationProcess[];
  preCalculatedState?: ProcessStatus | null;
}

export function ProcessStatusButton({
  patient,
  step,
  userRole,
  preloadedProcess,
  allPatientProcesses = [],
  preCalculatedState,
}: ProcessStatusButtonProps) {
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorNotes, setErrorNotes] = useState("");
  const { user, profile } = useCurrentUser();
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

      // Handle different step behaviors
      if (step === MedicationProcessStep.PREDESPACHO && isRegent) {
        // Predespacho: Auto-complete on first click or complete if in progress
        if (!process) {
          // First click: create, start, and complete immediately
          const createdProcess = await createProcess.mutateAsync({
            patientId: patient.id,
            step,
            dailyProcessId: dailyProcess.id,
          });
          await startProcess.mutateAsync(createdProcess.id);
          await completeProcess.mutateAsync(createdProcess.id);
        } else if (process.status === ProcessStatus.IN_PROGRESS) {
          // If showing as in progress, complete it
          await completeProcess.mutateAsync(process.id);
        }
      } else if (step === MedicationProcessStep.ALISTAMIENTO && isRegent) {
        // Alistamiento: First click = in progress, second click = complete
        if (!process) {
          const createdProcess = await createProcess.mutateAsync({
            patientId: patient.id,
            step,
            dailyProcessId: dailyProcess.id,
          });
          await startProcess.mutateAsync(createdProcess.id);
        } else if (process.status === ProcessStatus.PENDING) {
          await startProcess.mutateAsync(process.id);
        } else if (process.status === ProcessStatus.IN_PROGRESS) {
          await completeProcess.mutateAsync(process.id);
        }
      } else if (step === MedicationProcessStep.VALIDACION && actualUserRole === "PHARMACY_VALIDATOR") {
        // Validacion: Auto-complete on first click by validator
        if (!process) {
          const createdProcess = await createProcess.mutateAsync({
            patientId: patient.id,
            step,
            dailyProcessId: dailyProcess.id,
          });
          await startProcess.mutateAsync(createdProcess.id);
          await completeProcess.mutateAsync(createdProcess.id);
        } else if (process.status === ProcessStatus.PENDING) {
          await startProcess.mutateAsync(process.id);
          await completeProcess.mutateAsync(process.id);
        }
      } else if (step === MedicationProcessStep.ENTREGA) {
        // Entrega: Auto-complete on first click
        if (!process) {
          const createdProcess = await createProcess.mutateAsync({
            patientId: patient.id,
            step,
            dailyProcessId: dailyProcess.id,
          });
          await startProcess.mutateAsync(createdProcess.id);
          await completeProcess.mutateAsync(createdProcess.id);
        } else if (process.status === ProcessStatus.PENDING) {
          await startProcess.mutateAsync(process.id);
          await completeProcess.mutateAsync(process.id);
        }
      } else {
        // Default behavior for other cases
        if (!process) {
          await createProcess.mutateAsync({
            patientId: patient.id,
            step,
            dailyProcessId: dailyProcess.id,
          });
        } else {
          const currentStatus = process.status;
          if (currentStatus === ProcessStatus.PENDING && canStart) {
            await startProcess.mutateAsync(process.id);
          } else if (currentStatus === ProcessStatus.IN_PROGRESS && canComplete) {
            await completeProcess.mutateAsync(process.id);
          } else if (currentStatus === ProcessStatus.ERROR) {
            await startProcess.mutateAsync(process.id);
          }
        }
      }
      
      // Invalidate and refetch queries to refresh the UI immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["medication-processes"] }),
        queryClient.invalidateQueries({ queryKey: ["all-medication-processes"] }),
        queryClient.invalidateQueries({ queryKey: ["daily-processes"] }),
        queryClient.invalidateQueries({ queryKey: ["current-daily-process"] })
      ]);
      
      // Force refetch of all medication processes if daily process was just created
      if (!currentDailyProcess && step === MedicationProcessStep.PREDESPACHO) {
        await queryClient.refetchQueries({ queryKey: ["all-medication-processes"] });
      }
      
      toast({
        title: "Proceso actualizado",
        description: `${stepName} procesado correctamente`,
      });
    } catch (error) {
      console.error("Error handling process:", error);
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
  
  // Determine button status and appearance
  const getButtonStatus = () => {
    // If there's an actual process for this patient/step, return its status
    if (process) {
      return process.status;
    }
    
    // No process exists for this patient/step - determine what state to show
    if (step === MedicationProcessStep.PREDESPACHO) {
      // Check if any predespacho has started in the daily process
      const anyPredespachoStarted = allPatientProcesses.some(
        p => p.step === MedicationProcessStep.PREDESPACHO && 
        (p.status === ProcessStatus.IN_PROGRESS || p.status === ProcessStatus.COMPLETED)
      );
      
      if (anyPredespachoStarted) {
        return ProcessStatus.IN_PROGRESS; // Show as in progress (orange dotted)
      }
      return null; // Show as empty (black border) - not started yet
    }
    
    if (step === MedicationProcessStep.ALISTAMIENTO) {
      const predespachoProcess = allPatientProcesses.find(
        p => p.patientId === patient.id && p.step === MedicationProcessStep.PREDESPACHO
      );
      if (predespachoProcess?.status === ProcessStatus.COMPLETED) {
        return ProcessStatus.PENDING; // Show as pending (orange filled)
      }
      return null; // Show as disabled (black border)
    }
    
    if (step === MedicationProcessStep.VALIDACION || step === MedicationProcessStep.ENTREGA) {
      const alistamientoProcess = allPatientProcesses.find(
        p => p.patientId === patient.id && p.step === MedicationProcessStep.ALISTAMIENTO
      );
      if (alistamientoProcess?.status === ProcessStatus.COMPLETED) {
        return ProcessStatus.PENDING; // Show as pending (orange filled)
      }
      return null; // Show as disabled (black border)
    }
    
    return null; // Default: disabled
  };
  
  const buttonStatus = preCalculatedState !== undefined ? preCalculatedState : getButtonStatus();
  const isStepEnabledByWorkflow = buttonStatus !== null;
  
  
  const colorClass = buttonStatus 
    ? getStatusColorClass(buttonStatus, isStepEnabledByWorkflow)
    : getStatusColorClass(ProcessStatus.PENDING, false); // Use false for disabled state

  // Determine if button should be clickable
  const isClickable = (() => {
    // Special case for predespacho: always clickable for regents when no process exists (empty state)
    if (step === MedicationProcessStep.PREDESPACHO && !process && isRegent) {
      return true;
    }
    
    // Special case for predespacho: clickable when in progress state (orange dotted)
    if (step === MedicationProcessStep.PREDESPACHO && buttonStatus === ProcessStatus.IN_PROGRESS && isRegent) {
      return true;
    }
    
    if (!isStepEnabledByWorkflow) {
      return false; // Step not enabled due to workflow
    }
    
    if (!currentDailyProcess) return false;
    
    // Check role permissions
    if (!canStart && !canComplete) return false;
    
    // If no process but step is enabled, can create and start
    if (!process) return canStart;

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
        return false;
    }
  })();

  // Determine button text based on status and step
  const getButtonText = () => {
    if (!isStepEnabledByWorkflow && buttonStatus !== ProcessStatus.COMPLETED) {
      return stepName;
    }
    
    if (!process && !currentDailyProcess && step !== MedicationProcessStep.PREDESPACHO) {
      return stepName;
    }
    
    switch (buttonStatus) {
      case ProcessStatus.PENDING:
        return stepName;
      case ProcessStatus.IN_PROGRESS:
        return stepName;
      case ProcessStatus.COMPLETED:
        return stepName;
      case ProcessStatus.ERROR:
        return stepName;
      default:
        return stepName;
    }
  };

  const buttonText = getButtonText();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={`px-3 py-1 h-8 min-w-[80px] rounded-full text-xs font-medium ${colorClass} ${!isClickable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={isClickable ? handleButtonClick : undefined}
        disabled={
          !isClickable || startProcess.isPending || completeProcess.isPending
        }
      >
        {startProcess.isPending || completeProcess.isPending ? (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
            <span>...</span>
          </div>
        ) : (
          buttonText
        )}
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
