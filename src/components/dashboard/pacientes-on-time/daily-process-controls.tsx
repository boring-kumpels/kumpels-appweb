"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, XCircle } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  useCurrentDailyProcess,
  useCancelDailyProcess,
} from "@/hooks/use-daily-processes";
import { useMedicationProcesses } from "@/hooks/use-medication-processes";
import {
  DailyProcessStatus,
  MedicationProcessStep,
  ProcessStatus,
} from "@/types/patient";
import { toast } from "@/components/ui/use-toast";

export function DailyProcessControls() {
  const { user } = useCurrentUser();
  const { data: currentProcess } = useCurrentDailyProcess();
  const cancelProcess = useCancelDailyProcess();

  // Fetch completed predespacho processes to determine if cancel is allowed
  const { data: completedPredespachoProcesses = [] } = useMedicationProcesses({
    filters: {
      step: MedicationProcessStep.PREDESPACHO,
      status: ProcessStatus.COMPLETED,
      dailyProcessId: currentProcess?.id,
    },
    enabled: !!currentProcess?.id,
  });

  // Only show for PHARMACY_REGENT and SUPERADMIN
  const canManageDailyProcess =
    user?.role === "PHARMACY_REGENT" || user?.role === "SUPERADMIN";

  if (!canManageDailyProcess) {
    return null;
  }


  const handleCancelDailyProcess = async () => {
    if (!currentProcess) return;

    // Check if any predespacho has been completed
    if (completedPredespachoProcesses.length > 0) {
      toast({
        title: "No se puede cancelar",
        description:
          "No se puede cancelar el proceso porque ya se han completado predespachos",
        variant: "destructive",
      });
      return;
    }

    try {
      await cancelProcess.mutateAsync(currentProcess.id);
      toast({
        title: "Proceso cancelado",
        description: "Se ha cancelado el proceso diario",
      });
    } catch (error) {
      console.error("Error canceling daily process:", error);
      toast({
        title: "Error",
        description: "Error al cancelar el proceso diario",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    if (!currentProcess) {
      return <Badge variant="secondary">Sin sesión</Badge>;
    }

    switch (currentProcess.status) {
      case DailyProcessStatus.ACTIVE:
        return <Badge className="bg-green-500">Activo</Badge>;
      case DailyProcessStatus.COMPLETED:
        return <Badge className="bg-blue-500">Completado</Badge>;
      case DailyProcessStatus.CANCELLED:
        return <Badge className="bg-red-500">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getStatusText = () => {
    if (!currentProcess) {
      return "No hay un proceso diario activo para hoy";
    }

    const startTime = new Date(currentProcess.startedAt).toLocaleTimeString(
      "es-ES",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    switch (currentProcess.status) {
      case DailyProcessStatus.ACTIVE:
        return `Proceso iniciado a las ${startTime}`;
      case DailyProcessStatus.COMPLETED:
        const endTime = currentProcess.completedAt
          ? new Date(currentProcess.completedAt).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        return `Proceso completado a las ${endTime}`;
      case DailyProcessStatus.CANCELLED:
        const cancelTime = currentProcess.completedAt
          ? new Date(currentProcess.completedAt).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        return `Proceso cancelado a las ${cancelTime}`;
      default:
        return "Estado desconocido";
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle className="text-lg">Proceso Diario</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{getStatusText()}</p>

          <div className="flex items-center gap-2">
            {currentProcess?.status === DailyProcessStatus.ACTIVE && (
              <Button
                onClick={handleCancelDailyProcess}
                disabled={
                  cancelProcess.isPending ||
                  completedPredespachoProcesses.length > 0
                }
                variant="destructive"
                className="flex items-center gap-2"
                title={
                  completedPredespachoProcesses.length > 0
                    ? "No se puede cancelar porque ya se han completado predespachos"
                    : "Cancelar proceso diario"
                }
              >
                <XCircle className="h-4 w-4" />
                {cancelProcess.isPending ? "Cancelando..." : "Cancelar"}
              </Button>
            )}
          </div>

          {currentProcess?.notes && (
            <div className="text-sm text-muted-foreground">
              <strong>Notas:</strong> {currentProcess.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
