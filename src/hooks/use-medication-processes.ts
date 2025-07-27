import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MedicationProcess,
  MedicationProcessStep,
  ProcessStatus,
  MedicationProcessFilters,
  CreateMedicationProcessData,
  UpdateMedicationProcessData,
} from "@/types/patient";

interface UseMedicationProcessesOptions {
  filters?: MedicationProcessFilters;
  enabled?: boolean;
}

interface UseMedicationProcessOptions {
  id: string;
  enabled?: boolean;
}


// Pre-fetch all medication processes for all patients in current daily process
export const useAllMedicationProcesses = (dailyProcessId?: string) => {
  return useQuery({
    queryKey: ["all-medication-processes", dailyProcessId],
    queryFn: async (): Promise<MedicationProcess[]> => {
      const params = new URLSearchParams();
      if (dailyProcessId) {
        params.append("dailyProcessId", dailyProcessId);
      }

      const response = await fetch(
        `/api/medication-processes?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch all medication processes");
      }

      return response.json();
    },
    enabled: !!dailyProcessId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch medication processes with optional filters
export const useMedicationProcesses = ({
  filters,
  enabled = true,
}: UseMedicationProcessesOptions = {}) => {
  return useQuery({
    queryKey: ["medication-processes", filters],
    queryFn: async (): Promise<MedicationProcess[]> => {
      const params = new URLSearchParams();

      if (filters?.patientId) params.append("patientId", filters.patientId);
      if (filters?.step) params.append("step", filters.step);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.dailyProcessId)
        params.append("dailyProcessId", filters.dailyProcessId);

      const response = await fetch(
        `/api/medication-processes?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch medication processes");
      }

      return response.json();
    },
    enabled,
  });
};

// Fetch a single medication process by ID
export const useMedicationProcess = ({
  id,
  enabled = true,
}: UseMedicationProcessOptions) => {
  return useQuery({
    queryKey: ["medication-process", id],
    queryFn: async (): Promise<MedicationProcess> => {
      const response = await fetch(`/api/medication-processes/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch medication process");
      }

      return response.json();
    },
    enabled: enabled && !!id,
  });
};

// Fetch medication process status for a specific patient and step
export const usePatientProcessStatus = (
  patientId: string,
  step: MedicationProcessStep,
  dailyProcessId?: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["patient-process-status", patientId, step, dailyProcessId],
    queryFn: async (): Promise<MedicationProcess | null> => {
      const params = new URLSearchParams({
        patientId,
        step,
      });

      if (dailyProcessId) {
        params.append("dailyProcessId", dailyProcessId);
      }

      const response = await fetch(
        `/api/medication-processes?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch patient process status");
      }

      const processes = await response.json();
      return processes.length > 0 ? processes[0] : null;
    },
    enabled: enabled && !!patientId && !!step,
    staleTime: 10000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Create a new medication process with optimistic updates
export const useCreateMedicationProcess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateMedicationProcessData
    ): Promise<MedicationProcess> => {
      const response = await fetch("/api/medication-processes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create medication process");
      }

      return response.json();
    },
    onMutate: async (newProcess) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["patient-process-status"] });
      await queryClient.cancelQueries({ queryKey: ["medication-processes"] });
      await queryClient.cancelQueries({
        queryKey: ["all-medication-processes"],
      });

      // Create optimistic process
      const optimisticProcess: MedicationProcess = {
        id: `temp-${Date.now()}`,
        patientId: newProcess.patientId,
        dailyProcessId: newProcess.dailyProcessId || undefined,
        step: newProcess.step,
        status: ProcessStatus.PENDING,
        notes: newProcess.notes || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistically update the patient process status
      queryClient.setQueryData(
        [
          "patient-process-status",
          newProcess.patientId,
          newProcess.step,
          newProcess.dailyProcessId,
        ],
        optimisticProcess
      );

      // Also update the all medication processes cache
      const allProcesses = queryClient.getQueryData<MedicationProcess[]>([
        "all-medication-processes",
        newProcess.dailyProcessId,
      ]);
      if (allProcesses) {
        queryClient.setQueryData(
          ["all-medication-processes", newProcess.dailyProcessId],
          [...allProcesses, optimisticProcess]
        );
      }

      return { optimisticProcess };
    },
    onError: (err, newProcess, context) => {
      // Rollback optimistic update on error
      if (context?.optimisticProcess) {
        queryClient.setQueryData(
          [
            "patient-process-status",
            newProcess.patientId,
            newProcess.step,
            newProcess.dailyProcessId,
          ],
          null
        );

        // Rollback all medication processes cache
        const allProcesses = queryClient.getQueryData<MedicationProcess[]>([
          "all-medication-processes",
          newProcess.dailyProcessId,
        ]);
        if (allProcesses) {
          queryClient.setQueryData(
            ["all-medication-processes", newProcess.dailyProcessId],
            allProcesses.filter((p) => p.id !== context.optimisticProcess.id)
          );
        }
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["patient-process-status"] });
      queryClient.invalidateQueries({ queryKey: ["medication-processes"] });
      queryClient.invalidateQueries({ queryKey: ["all-medication-processes"] });
    },
  });
};

// Update a medication process with optimistic updates
export const useUpdateMedicationProcess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMedicationProcessData;
    }): Promise<MedicationProcess> => {
      const response = await fetch(`/api/medication-processes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update medication process");
      }

      return response.json();
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["medication-process", id] });
      await queryClient.cancelQueries({ queryKey: ["patient-process-status"] });
      await queryClient.cancelQueries({
        queryKey: ["all-medication-processes"],
      });

      // Get the current process data
      const previousProcess = queryClient.getQueryData([
        "medication-process",
        id,
      ]);

      // Create optimistic update
      const optimisticProcess = previousProcess
        ? ({
            ...previousProcess,
            ...data,
            updatedAt: new Date(),
          } as MedicationProcess)
        : null;

      // Optimistically update
      if (optimisticProcess) {
        queryClient.setQueryData(["medication-process", id], optimisticProcess);

        // Also update patient process status if we have the patient info
        if (optimisticProcess.patientId && optimisticProcess.step) {
          queryClient.setQueryData(
            [
              "patient-process-status",
              optimisticProcess.patientId,
              optimisticProcess.step,
              optimisticProcess.dailyProcessId,
            ],
            optimisticProcess
          );
        }

        // Update all medication processes cache
        const allProcesses = queryClient.getQueryData<MedicationProcess[]>([
          "all-medication-processes",
          optimisticProcess.dailyProcessId,
        ]);
        if (allProcesses) {
          queryClient.setQueryData(
            ["all-medication-processes", optimisticProcess.dailyProcessId],
            allProcesses.map((p) => (p.id === id ? optimisticProcess : p))
          );
        }
      }

      return { previousProcess, optimisticProcess };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousProcess) {
        queryClient.setQueryData(
          ["medication-process", variables.id],
          context.previousProcess
        );

        const prevProcess = context.previousProcess as MedicationProcess;
        if (prevProcess.patientId && prevProcess.step) {
          queryClient.setQueryData(
            [
              "patient-process-status",
              prevProcess.patientId,
              prevProcess.step,
              prevProcess.dailyProcessId,
            ],
            context.previousProcess
          );
        }

        // Rollback all medication processes cache
        const allProcesses = queryClient.getQueryData<MedicationProcess[]>([
          "all-medication-processes",
          prevProcess.dailyProcessId,
        ]);
        if (allProcesses) {
          queryClient.setQueryData(
            [
              "all-medication-processes",
              prevProcess.dailyProcessId,
            ],
            allProcesses.map((p) =>
              p.id === variables.id ? context.previousProcess : p
            )
          );
        }
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: ["medication-process", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["patient-process-status"] });
      queryClient.invalidateQueries({ queryKey: ["medication-processes"] });
      queryClient.invalidateQueries({ queryKey: ["all-medication-processes"] });
    },
  });
};

// Start a medication process (set status to IN_PROGRESS) with optimistic updates
export const useStartMedicationProcess = () => {
  const updateProcess = useUpdateMedicationProcess();

  return {
    ...updateProcess,
    mutate: (id: string) =>
      updateProcess.mutate({
        id,
        data: {
          status: ProcessStatus.IN_PROGRESS,
        },
      }),
    mutateAsync: (id: string) =>
      updateProcess.mutateAsync({
        id,
        data: {
          status: ProcessStatus.IN_PROGRESS,
        },
      }),
  };
};

// Complete a medication process (set status to COMPLETED) with optimistic updates
export const useCompleteMedicationProcess = () => {
  const updateProcess = useUpdateMedicationProcess();

  return {
    ...updateProcess,
    mutate: (id: string) =>
      updateProcess.mutate({
        id,
        data: {
          status: ProcessStatus.COMPLETED,
        },
      }),
    mutateAsync: (id: string) =>
      updateProcess.mutateAsync({
        id,
        data: {
          status: ProcessStatus.COMPLETED,
        },
      }),
  };
};

// Report error on a medication process (set status to ERROR)
export const useReportMedicationProcessError = () => {
  const updateProcess = useUpdateMedicationProcess();

  return {
    ...updateProcess,
    mutate: ({ id, notes }: { id: string; notes: string }) =>
      updateProcess.mutate({
        id,
        data: {
          status: ProcessStatus.ERROR,
          notes,
        },
      }),
  };
};

// Retry a medication process from error (set status to IN_PROGRESS)
export const useRetryMedicationProcess = () => {
  const updateProcess = useUpdateMedicationProcess();

  return {
    ...updateProcess,
    mutate: (id: string) =>
      updateProcess.mutate({
        id,
        data: {
          status: ProcessStatus.IN_PROGRESS,
        },
      }),
  };
};
