"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ProcessStatusButtonProps {
  patient: PatientWithRelations;
  step: MedicationProcessStep;
  userRole: string;
  preloadedProcess?: MedicationProcess | null;
  preCalculatedState?: ProcessStatus | null;
  qrScanRecords?: any[];
}

export function ProcessStatusButton({
  patient,
  step,
  userRole,
  preloadedProcess,
  preCalculatedState,
  qrScanRecords = [],
}: ProcessStatusButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
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
        ></Button>
      </div>
    );
  }

  const handleButtonClick = async () => {
    // Prevent any action if process is in ERROR status
    if (process?.status === ProcessStatus.ERROR) {
      toast({
        title: "Error",
        description:
          "Este proceso tiene un error. Debe ser resuelto desde la página de detalles del paciente.",
        variant: "destructive",
      });
      return;
    }

    if (!user || !profile) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive",
      });
      return;
    }

    // Set syncing state to show loading indicator
    setIsSyncing(true);

    try {
      let dailyProcess = currentDailyProcess;

      // If no daily process exists and this is a regent clicking predespacho, create daily process first
      if (
        !dailyProcess &&
        isRegent &&
        step === MedicationProcessStep.PREDESPACHO
      ) {
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
      } else if (
        step === MedicationProcessStep.VALIDACION &&
        actualUserRole === "PHARMACY_VALIDATOR"
      ) {
        expectedFinalStatus = ProcessStatus.COMPLETED; // Validacion auto-completes
      } else if (step === MedicationProcessStep.ENTREGA) {
        expectedFinalStatus = ProcessStatus.COMPLETED; // Entrega auto-completes
      } else {
        // Default behavior
        if (!process) {
          expectedFinalStatus = ProcessStatus.PENDING;
        } else if (process.status === ProcessStatus.PENDING && canStart) {
          expectedFinalStatus = ProcessStatus.IN_PROGRESS;
        } else if (
          process.status === ProcessStatus.IN_PROGRESS &&
          canComplete
        ) {
          expectedFinalStatus = ProcessStatus.COMPLETED;
        } else {
          return; // No action needed
        }
      }

      // Perform optimistic update immediately
      if (!process) {
        // Create optimistic process first
        const optimisticId = `temp-${Date.now()}-${Math.random()}`;
        const optimisticProcess: MedicationProcess = {
          id: optimisticId,
          patientId: patient.id,
          dailyProcessId: dailyProcess.id,
          step: step,
          status: expectedFinalStatus,
          notes: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Update the cache optimistically
        const currentProcesses =
          queryClient.getQueryData<MedicationProcess[]>([
            "all-medication-processes",
            dailyProcess.id,
          ]) || [];

        queryClient.setQueryData(
          ["all-medication-processes", dailyProcess.id],
          [...currentProcesses, optimisticProcess]
        );

        try {
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
          const finalCurrentProcesses =
            queryClient.getQueryData<MedicationProcess[]>([
              "all-medication-processes",
              dailyProcess.id,
            ]) || [];

          const finalProcesses = finalCurrentProcesses.map((p) =>
            p.id === optimisticId ? finalProcess : p
          );
          queryClient.setQueryData(
            ["all-medication-processes", dailyProcess.id],
            finalProcesses
          );
        } catch (error) {
          // Remove the optimistic process on error
          const revertProcesses =
            queryClient.getQueryData<MedicationProcess[]>([
              "all-medication-processes",
              dailyProcess.id,
            ]) || [];

          const filteredProcesses = revertProcesses.filter(
            (p) => p.id !== optimisticId
          );
          queryClient.setQueryData(
            ["all-medication-processes", dailyProcess.id],
            filteredProcesses
          );
          throw error; // Re-throw to be caught by outer error handler
        }
      } else {
        // Update existing process optimistically
        const currentProcesses =
          queryClient.getQueryData<MedicationProcess[]>([
            "all-medication-processes",
            dailyProcess.id,
          ]) || [];

        const originalProcess = currentProcesses.find(
          (p) => p.id === process.id
        );
        const updatedProcesses = currentProcesses.map((p) =>
          p.id === process.id
            ? { ...p, status: expectedFinalStatus, updatedAt: new Date() }
            : p
        );
        queryClient.setQueryData(
          ["all-medication-processes", dailyProcess.id],
          updatedProcesses
        );

        try {
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
          const finalUpdatedProcesses =
            queryClient.getQueryData<MedicationProcess[]>([
              "all-medication-processes",
              dailyProcess.id,
            ]) || [];

          const completedProcesses = finalUpdatedProcesses.map((p) =>
            p.id === process.id ? finalProcess : p
          );
          queryClient.setQueryData(
            ["all-medication-processes", dailyProcess.id],
            completedProcesses
          );
        } catch (error) {
          // Revert the optimistic update on error
          if (originalProcess) {
            const revertProcesses =
              queryClient.getQueryData<MedicationProcess[]>([
                "all-medication-processes",
                dailyProcess.id,
              ]) || [];

            const revertedProcesses = revertProcesses.map((p) =>
              p.id === process.id ? originalProcess : p
            );
            queryClient.setQueryData(
              ["all-medication-processes", dailyProcess.id],
              revertedProcesses
            );
          }
          throw error; // Re-throw to be caught by outer error handler
        }
      }

      // Only invalidate daily process queries if a new one was created
      if (
        !currentDailyProcess &&
        step === MedicationProcessStep.PREDESPACHO &&
        dailyProcess
      ) {
        queryClient.invalidateQueries({ queryKey: ["daily-processes"] });
        queryClient.invalidateQueries({ queryKey: ["current-daily-process"] });
      }

      toast({
        title: "Proceso actualizado",
        description: `${stepName} procesado correctamente`,
      });
    } catch (error) {
      console.error("Error handling process:", error);

      // Get error message
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      // For conflict errors (409), invalidate and refetch to get latest state
      if (
        errorMessage.includes("Ya existe un proceso") ||
        errorMessage.includes("Process not found")
      ) {
        queryClient.invalidateQueries({
          queryKey: ["all-medication-processes", currentDailyProcess?.id],
          refetchType: "active",
        });

        toast({
          title: "Estado actualizado",
          description:
            "Se ha detectado un cambio. La vista se ha actualizada con el estado más reciente.",
          variant: "default",
        });
      } else {
        // For other errors, just show the error message
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      // Always clear syncing state
      setIsSyncing(false);
    }
  };

  const stepName = getStepDisplayName(step);

  // CRITICAL: Only use pre-calculated state to ensure all buttons update simultaneously
  // Never fall back to individual calculations as this causes gradual button enabling
  const buttonStatus = preCalculatedState;

  const isStepEnabledByWorkflow = buttonStatus !== null;

  const colorClass = buttonStatus
    ? getStatusColorClass(buttonStatus, isStepEnabledByWorkflow, step)
    : getStatusColorClass(ProcessStatus.PENDING, false, step); // Use false for disabled state

  // Determine if button should be clickable
  const isClickable = (() => {
    // If syncing is in progress, disable the button
    if (isSyncing) {
      return false;
    }

    // If preCalculatedState is undefined, button states are still being computed
    // Don't allow clicks during this phase to prevent inconsistent behavior
    if (preCalculatedState === undefined) {
      return false;
    }

    // Special case for predespacho: always clickable for regents when empty or in progress
    if (step === MedicationProcessStep.PREDESPACHO && isRegent) {
      return (
        buttonStatus === null || buttonStatus === ProcessStatus.IN_PROGRESS
      );
    }

    // Special case for entrega: only clickable if both QR codes are scanned
    if (step === MedicationProcessStep.ENTREGA) {
      const bothQRCodesScanned =
        qrScanRecords.some(
          (record) => record.qrCode.type === "PHARMACY_DISPATCH"
        ) &&
        qrScanRecords.some(
          (record) => record.qrCode.type === "SERVICE_ARRIVAL"
        );

      if (!bothQRCodesScanned) {
        return false; // Disable until both QR codes are scanned
      }
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
        return false; // Cannot interact with error status - must be resolved from detail page
      default:
        return canStart; // Can create new process if step is enabled and button shows as enabled
    }
  })();

  // Determine button text based on status and step
  const getButtonText = () => {
    // If syncing is in progress, show syncing text
    if (isSyncing) {
      return "Sync...";
    }

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
        className={`px-3 py-1 h-8 min-w-[80px] rounded-full text-xs font-medium ${colorClass} ${!isClickable ? "cursor-not-allowed" : "cursor-pointer"} ${isSyncing ? "opacity-75" : ""}`}
        onClick={isClickable ? handleButtonClick : undefined}
        disabled={!isClickable || preCalculatedState === undefined || isSyncing}
      >
        <div className="flex items-center gap-1">
          {isSyncing && <Loader2 className="h-3 w-3 animate-spin" />}
          <span>{buttonText}</span>
        </div>
      </Button>
    </div>
  );
}
