import { useQuery } from "@tanstack/react-query";
import { Bed, LineName } from "@/types/patient";

// Fetch all lines with their beds and patients
export const useLines = () => {
  return useQuery({
    queryKey: ["lines"],
    queryFn: async (): Promise<Array<{
      name: LineName;
      displayName: string;
      description: string;
      beds: Bed[];
    }>> => {
      const response = await fetch("/api/lines");

      if (!response.ok) {
        throw new Error("Failed to fetch lines");
      }

      return response.json();
    },
  });
};

// Fetch all beds with optional filters
export const useBeds = (lineName?: LineName, available?: boolean) => {
  return useQuery({
    queryKey: ["beds", lineName, available],
    queryFn: async (): Promise<Bed[]> => {
      const params = new URLSearchParams();

      if (lineName) params.append("lineName", lineName);
      if (available) params.append("available", "true");

      const response = await fetch(`/api/beds?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch beds");
      }

      return response.json();
    },
  });
};

// Fetch available beds (not occupied)
export const useAvailableBeds = (lineName?: LineName) => {
  return useBeds(lineName, true);
};

// Fetch beds by line
export const useBedsByLine = (lineName: LineName) => {
  return useBeds(lineName);
};
