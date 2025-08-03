import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ManualReturn,
  ManualReturnFilters,
  CreateManualReturnData,
  UpdateManualReturnData,
  ManualReturnStatus,
} from "@/types/patient";

interface UseManualReturnsOptions {
  filters?: ManualReturnFilters;
  enabled?: boolean;
}

// Fetch manual returns with optional filters
export const useManualReturns = ({
  filters,
  enabled = true,
}: UseManualReturnsOptions = {}) => {
  return useQuery({
    queryKey: ["manual-returns", filters],
    queryFn: async (): Promise<ManualReturn[]> => {
      const params = new URLSearchParams();

      if (filters?.patientId) params.append("patientId", filters.patientId);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.generatedBy)
        params.append("generatedBy", filters.generatedBy);
      if (filters?.reviewedBy) params.append("reviewedBy", filters.reviewedBy);

      const response = await fetch(`/api/manual-returns?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch manual returns");
      }

      return response.json();
    },
    enabled,
  });
};

// Create a new manual return
export const useCreateManualReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateManualReturnData): Promise<ManualReturn> => {
      const response = await fetch("/api/manual-returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create manual return");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-returns"] });
    },
  });
};

// Update a manual return
export const useUpdateManualReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateManualReturnData;
    }): Promise<ManualReturn> => {
      const response = await fetch(`/api/manual-returns/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update manual return");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-returns"] });
    },
  });
};

// Delete a manual return
export const useDeleteManualReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/manual-returns/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete manual return");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-returns"] });
    },
  });
};

// Approve a manual return
export const useApproveManualReturn = () => {
  const updateManualReturn = useUpdateManualReturn();

  return {
    ...updateManualReturn,
    mutate: (id: string) =>
      updateManualReturn.mutate({
        id,
        data: {
          status: ManualReturnStatus.APPROVED,
        },
      }),
    mutateAsync: (id: string) =>
      updateManualReturn.mutateAsync({
        id,
        data: {
          status: ManualReturnStatus.APPROVED,
        },
      }),
  };
};

// Reject a manual return
export const useRejectManualReturn = () => {
  const updateManualReturn = useUpdateManualReturn();

  return {
    ...updateManualReturn,
    mutate: ({ id, comments }: { id: string; comments?: string }) =>
      updateManualReturn.mutate({
        id,
        data: {
          status: ManualReturnStatus.REJECTED,
          ...(comments && { comments }),
        },
      }),
    mutateAsync: ({ id, comments }: { id: string; comments?: string }) =>
      updateManualReturn.mutateAsync({
        id,
        data: {
          status: ManualReturnStatus.REJECTED,
          ...(comments && { comments }),
        },
      }),
  };
};
