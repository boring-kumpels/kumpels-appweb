import { useQuery } from "@tanstack/react-query";

interface Medication {
  id: string;
  codigoServinte: string | null;
  codigoNuevoEstandar: string | null;
  cumSinCeros: string | null;
  cumConCeros: string | null;
  nombrePreciso: string | null;
  principioActivo: string | null;
  concentracionEstandarizada: string | null;
  formaFarmaceutica: string | null;
  marcaComercial: string | null;
  nuevaEstructuraEstandarSemantico: string | null;
  clasificacionArticulo: string | null;
  viaAdministracion: string | null;
  descripcionCum: string | null;
  active: boolean;
}

interface MedicationsResponse {
  medications: Medication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface UseMedicationsOptions {
  query?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

const fetchMedications = async (
  options: UseMedicationsOptions
): Promise<MedicationsResponse> => {
  const params = new URLSearchParams();

  if (options.query) {
    params.append("q", options.query);
  }

  if (options.page) {
    params.append("page", options.page.toString());
  }

  if (options.limit) {
    params.append("limit", options.limit.toString());
  }

  const response = await fetch(`/api/medications?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch medications");
  }

  return response.json();
};

export const useMedications = (options: UseMedicationsOptions = {}) => {
  const { query = "", page = 1, limit = 20, enabled = true } = options;

  return useQuery({
    queryKey: ["medications", query, page, limit],
    queryFn: () => fetchMedications({ query, page, limit }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
