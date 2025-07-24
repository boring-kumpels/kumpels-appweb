import { useQuery } from "@tanstack/react-query";
import { PatientWithRelations, PatientFilters, LineName } from "@/types/patient";

interface UsePatientsOptions {
  filters?: PatientFilters;
  enabled?: boolean;
}

interface UsePatientOptions {
  id: string;
  enabled?: boolean;
}

// Fetch all patients with optional filters
export const usePatients = ({
  filters,
  enabled = true,
}: UsePatientsOptions = {}) => {
  return useQuery({
    queryKey: ["patients", filters],
    queryFn: async (): Promise<PatientWithRelations[]> => {
      const params = new URLSearchParams();

      if (filters?.lineName) params.append("lineName", filters.lineName);
      if (filters?.bedId) params.append("bedId", filters.bedId);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.search) params.append("search", filters.search);

      const response = await fetch(`/api/patients?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch patients");
      }

      return response.json();
    },
    enabled,
  });
};

// Fetch a single patient by ID
export const usePatient = ({ id, enabled = true }: UsePatientOptions) => {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async (): Promise<PatientWithRelations> => {
      const response = await fetch(`/api/patients/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch patient");
      }

      return response.json();
    },
    enabled: enabled && !!id,
  });
};

// Fetch patients by line
export const usePatientsByLine = (lineName: LineName) => {
  return usePatients({
    filters: { lineName },
    enabled: !!lineName,
  });
};

// Fetch active patients
export const useActivePatients = () => {
  return usePatients({
    filters: { status: "ACTIVE" },
  });
};

// Fetch patients by search term
export const usePatientsBySearch = (search: string) => {
  return usePatients({
    filters: { search },
    enabled: !!search && search.length >= 2,
  });
};
