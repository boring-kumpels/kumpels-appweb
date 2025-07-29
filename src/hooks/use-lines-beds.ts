import { useQuery } from "@tanstack/react-query";
import { Bed, Line, Service } from "@/types/patient";

interface UseBedsOptions {
  lineId?: string;
  available?: boolean;
  enabled?: boolean;
}

// Fetch all lines with their services and beds
export const useLines = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["lines"],
    queryFn: async (): Promise<Line[]> => {
      const response = await fetch("/api/lines");

      if (!response.ok) {
        throw new Error("Failed to fetch lines");
      }

      return response.json();
    },
    enabled,
  });
};

// Fetch services, optionally filtered by line
export const useServices = (lineId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["services", lineId],
    queryFn: async (): Promise<Service[]> => {
      const params = new URLSearchParams();
      if (lineId && lineId.trim() !== "") params.append("lineId", lineId);

      const response = await fetch(`/api/services?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      return response.json();
    },
    enabled: enabled && (lineId ? lineId.trim() !== "" : true),
  });
};

// Fetch all beds with optional filters
export const useBeds = ({
  lineId,
  available,
  enabled = true,
}: UseBedsOptions = {}) => {
  return useQuery({
    queryKey: ["beds", lineId, available],
    queryFn: async (): Promise<Bed[]> => {
      const params = new URLSearchParams();

      if (lineId) params.append("lineId", lineId);
      if (available) params.append("available", "true");

      const response = await fetch(`/api/beds?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch beds");
      }

      return response.json();
    },
    enabled,
  });
};

// Fetch available beds (not occupied)
export const useAvailableBeds = (lineId?: string) => {
  return useBeds({ lineId, available: true });
};

// Fetch beds by line
export const useBedsByLine = (lineId: string) => {
  return useBeds({ lineId, enabled: !!lineId });
};

// Fetch services for a specific line
export const useServicesByLine = (lineId: string) => {
  return useServices(lineId, !!lineId);
};

// Get line display name helper
export const getLineDisplayName = (lineName: string): string => {
  const lineDisplayNames: Record<string, string> = {
    LINE_1: "Línea 1",
    LINE_2: "Línea 2",
    LINE_3: "Línea 3",
    LINE_4: "Línea 4",
    LINE_5: "Línea 5",
  };
  return lineDisplayNames[lineName] || lineName;
};
