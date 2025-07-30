import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

export const useResetDailyProcesses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/daily-processes/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al resetear los procesos");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ["daily-processes"] });
      queryClient.invalidateQueries({ queryKey: ["medication-processes"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      
      toast({
        title: "Procesos reseteados",
        description: `Se han eliminado ${data.deleted.medicationProcesses} procesos de medicación y ${data.deleted.dailyProcesses} procesos diarios`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}; 