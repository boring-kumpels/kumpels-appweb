import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DailyProcess,
  DailyProcessStatus,
  DailyProcessFilters,
  CreateDailyProcessData,
  UpdateDailyProcessData,
} from "@/types/patient";

interface UseDailyProcessesOptions {
  filters?: DailyProcessFilters;
  enabled?: boolean;
}

interface UseDailyProcessOptions {
  id: string;
  enabled?: boolean;
}

// Fetch daily processes with optional filters
export const useDailyProcesses = ({
  filters,
  enabled = true,
}: UseDailyProcessesOptions = {}) => {
  return useQuery({
    queryKey: ["daily-processes", filters],
    queryFn: async (): Promise<DailyProcess[]> => {
      const params = new URLSearchParams();

      if (filters?.date) params.append("date", filters.date.toISOString());
      if (filters?.status) params.append("status", filters.status);
      if (filters?.startedBy) params.append("startedBy", filters.startedBy);

      const response = await fetch(`/api/daily-processes?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch daily processes");
      }

      return response.json();
    },
    enabled,
  });
};

// Fetch a single daily process by ID
export const useDailyProcess = ({
  id,
  enabled = true,
}: UseDailyProcessOptions) => {
  return useQuery({
    queryKey: ["daily-process", id],
    queryFn: async (): Promise<DailyProcess> => {
      const response = await fetch(`/api/daily-processes/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch daily process");
      }

      return response.json();
    },
    enabled: enabled && !!id,
  });
};

// Fetch today's daily process
export const useTodayDailyProcess = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return useDailyProcesses({
    filters: { date: today },
    enabled: true,
  });
};

// Create a new daily process
export const useCreateDailyProcess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDailyProcessData): Promise<DailyProcess> => {
      const response = await fetch("/api/daily-processes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create daily process");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["daily-processes"] });
      queryClient.invalidateQueries({ queryKey: ["medication-processes"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};

// Update a daily process
export const useUpdateDailyProcess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateDailyProcessData;
    }): Promise<DailyProcess> => {
      const response = await fetch("/api/daily-processes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update daily process");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["daily-processes"] });
      queryClient.invalidateQueries({ queryKey: ["daily-process", data.id] });
      queryClient.invalidateQueries({ queryKey: ["medication-processes"] });
      queryClient.invalidateQueries({ queryKey: ["current-daily-process"] });
    },
  });
};

// Complete a daily process
export const useCompleteDailyProcess = () => {
  const updateProcess = useUpdateDailyProcess();

  return {
    ...updateProcess,
    mutate: (id: string) =>
      updateProcess.mutate({
        id,
        data: {
          status: DailyProcessStatus.COMPLETED,
          completedAt: new Date(),
        },
      }),
  };
};

// Cancel a daily process
export const useCancelDailyProcess = () => {
  const updateProcess = useUpdateDailyProcess();

  return {
    ...updateProcess,
    mutate: (id: string) =>
      updateProcess.mutate({
        id,
        data: {
          status: DailyProcessStatus.CANCELLED,
          completedAt: new Date(),
        },
      }),
    mutateAsync: (id: string) =>
      updateProcess.mutateAsync({
        id,
        data: {
          status: DailyProcessStatus.CANCELLED,
          completedAt: new Date(),
        },
      }),
  };
};

// Hook to get current active daily process
export const useCurrentDailyProcess = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ["current-daily-process", today.toISOString().split("T")[0]],
    queryFn: async (): Promise<DailyProcess | null> => {
      const params = new URLSearchParams({
        date: today.toISOString(),
        status: DailyProcessStatus.ACTIVE,
      });

      const response = await fetch(`/api/daily-processes?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch current daily process");
      }

      const processes = await response.json();
      return processes.length > 0 ? processes[0] : null;
    },
    enabled: true,
  });
};

// Hook to check if daily process can be started
export const useCanStartDailyProcess = () => {
  const { data: currentProcess, isLoading } = useCurrentDailyProcess();

  return {
    canStart: !isLoading && !currentProcess,
    isLoading,
    currentProcess,
  };
};
