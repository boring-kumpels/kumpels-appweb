import { useQuery } from "@tanstack/react-query";

export interface StatisticsFilters {
  lineId?: string;
  serviceId?: string;
  personalRole?: string;
  dateFrom?: string;
  dateTo?: string;
  dailyProcessId?: string;
}

export interface GeneralStatistics {
  onTimeDelivery: number;
  onTimeReturns: number;
  medicationCartAdherence: number;
  patientsWithErrors: number;
}

export interface ComparativeStatistics {
  averageTimePerStage: {
    total: number;
    change: number;
    lines: Array<{
      name: string;
      predespacho: number;
      alistamiento: number;
      verificacion: number;
      entrega: number;
      total: number;
    }>;
  };
  manualReturns: {
    total: number;
    change: number;
    percentage: number;
    byReason: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
  };
  temperatureCompliance: {
    averageTemperature: number | null;
    outOfRangeCount: number;
    totalReadings: number;
    compliancePercentage: number;
  };
  processEfficiency: {
    averageCompletionTime: number;
    onTimeCompletionRate: number;
    bottleneckStages: Array<{
      stage: string;
      averageTime: number;
      delayCount: number;
    }>;
  };
}

// Hook for fetching general statistics
export function useGeneralStatistics(filters: StatisticsFilters) {
  return useQuery<GeneralStatistics>({
    queryKey: ["statistics", "general", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("type", "general");
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });

      const response = await fetch(`/api/statistics?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch general statistics");
      }

      const result = await response.json();
      return result.data;
    },
    enabled: true,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for real-time updates
  });
}

// Hook for fetching comparative statistics  
export function useComparativeStatistics(filters: StatisticsFilters) {
  return useQuery<ComparativeStatistics>({
    queryKey: ["statistics", "comparative", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("type", "comparative");
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });

      const response = await fetch(`/api/statistics?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch comparative statistics");
      }

      const result = await response.json();
      return result.data;
    },
    enabled: true,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook for exporting statistics data
export function useExportStatistics() {
  const exportData = async (
    type: "general" | "comparative",
    format: "PDF" | "CSV" | "EXCEL",
    filters: StatisticsFilters
  ) => {
    const params = new URLSearchParams();
    params.set("type", type);
    params.set("format", format.toLowerCase());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const response = await fetch(`/api/statistics/export?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to export ${format} file`);
    }

    // Get filename from response headers
    const contentDisposition = response.headers.get("content-disposition");
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1].replace(/"/g, "")
      : `estadisticas_${type}_${new Date().toISOString().split("T")[0]}.${format.toLowerCase()}`;

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return { exportData };
}