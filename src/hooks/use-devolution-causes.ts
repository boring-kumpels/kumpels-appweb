import { useQuery } from "@tanstack/react-query";

interface DevolutionCause {
  id: string;
  causeId: number;
  description: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const fetchDevolutionCauses = async (): Promise<DevolutionCause[]> => {
  const response = await fetch("/api/devolution-causes");

  if (!response.ok) {
    throw new Error("Failed to fetch devolution causes");
  }

  return response.json();
};

export const useDevolutionCauses = () => {
  return useQuery({
    queryKey: ["devolution-causes"],
    queryFn: fetchDevolutionCauses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
