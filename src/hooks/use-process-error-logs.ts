import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ProcessErrorLog,
  ProcessErrorLogFilters,
  CreateProcessErrorLogData,
  UpdateProcessErrorLogData,
} from "@/types/patient";

interface UseProcessErrorLogsOptions {
  filters?: ProcessErrorLogFilters;
  enabled?: boolean;
  includeResolved?: boolean; // Whether to include resolved logs (for showing all timeline messages)
}

// Fetch process error logs with optional filters
export const useProcessErrorLogs = ({
  filters,
  enabled = true,
  includeResolved = false,
}: UseProcessErrorLogsOptions = {}) => {
  return useQuery({
    queryKey: ["process-error-logs", filters, includeResolved],
    queryFn: async (): Promise<ProcessErrorLog[]> => {
      const params = new URLSearchParams();

      if (filters?.patientId) params.append("patientId", filters.patientId);
      if (filters?.medicationProcessId) params.append("medicationProcessId", filters.medicationProcessId);
      if (filters?.step) params.append("step", filters.step);
      if (filters?.logType) params.append("logType", filters.logType);
      if (includeResolved) params.append("includeResolved", "true");

      const response = await fetch(
        `/api/process-error-logs?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch process error logs");
      }

      return response.json();
    },
    enabled,
  });
};

// Create a new process error log
export const useCreateProcessErrorLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateProcessErrorLogData
    ): Promise<ProcessErrorLog> => {
      const response = await fetch("/api/process-error-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create process error log");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-error-logs"] });
    },
  });
};

// Update a process error log
export const useUpdateProcessErrorLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProcessErrorLogData;
    }): Promise<ProcessErrorLog> => {
      const response = await fetch(`/api/process-error-logs/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update process error log");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-error-logs"] });
    },
  });
};

// Delete a process error log
export const useDeleteProcessErrorLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/process-error-logs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete process error log");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-error-logs"] });
    },
  });
};

// Mark error log as resolved
export const useResolveProcessErrorLog = () => {
  const updateErrorLog = useUpdateProcessErrorLog();

  return {
    ...updateErrorLog,
    mutate: (id: string) =>
      updateErrorLog.mutate({
        id,
        data: {
          resolvedAt: new Date(),
        },
      }),
    mutateAsync: (id: string) =>
      updateErrorLog.mutateAsync({
        id,
        data: {
          resolvedAt: new Date(),
        },
      }),
  };
};