"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
} from "lucide-react";
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

export function DailyProcessStatusCard() {
  const { profile } = useCurrentUser();
  const { data: currentProcess, isLoading } = useCurrentDailyProcess();
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

  const isRegent =
    profile?.role === "PHARMACY_REGENT" || profile?.role === "SUPERADMIN";


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

  const getStatusInfo = () => {
    if (isLoading) {
      return {
        icon: <Clock className="h-4 w-4" />,
        title: "Verificando estado...",
        description: "Cargando información del proceso diario",
        variant: "default" as const,
        showActions: false,
      };
    }

    if (!currentProcess) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        title: "Proceso diario no iniciado",
        description: isRegent
          ? "Como regente farmacéutico, puedes iniciar el proceso diario haciendo clic en cualquier botón de predespacho o alistamiento."
          : "El proceso diario de medicación aún no ha sido iniciado por el regente farmacéutico.",
        variant: "destructive" as const,
        showActions: false,
      };
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
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          title: "Proceso diario activo",
          description: `Proceso iniciado a las ${startTime}. Los botones de medicación están habilitados.`,
          variant: "default" as const,
          showActions: isRegent,
        };

      case DailyProcessStatus.COMPLETED:
        const endTime = currentProcess.completedAt
          ? new Date(currentProcess.completedAt).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          title: "Proceso diario completado",
          description: `Proceso completado a las ${endTime}.`,
          variant: "default" as const,
          showActions: false,
        };

      case DailyProcessStatus.CANCELLED:
        const cancelTime = currentProcess.completedAt
          ? new Date(currentProcess.completedAt).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        return {
          icon: <XCircle className="h-4 w-4" />,
          title: "Proceso diario cancelado",
          description: `Proceso cancelado a las ${cancelTime}.`,
          variant: "destructive" as const,
          showActions: false,
        };

      default:
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          title: "Estado desconocido",
          description: "El estado del proceso diario no se pudo determinar.",
          variant: "destructive" as const,
          showActions: false,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle className="text-lg">Estado del Proceso Diario</CardTitle>
          </div>
          {currentProcess && (
            <Badge
              variant={
                currentProcess.status === DailyProcessStatus.ACTIVE
                  ? "default"
                  : "secondary"
              }
              className={
                currentProcess.status === DailyProcessStatus.ACTIVE
                  ? "bg-green-500"
                  : ""
              }
            >
              {currentProcess.status === DailyProcessStatus.ACTIVE && "Activo"}
              {currentProcess.status === DailyProcessStatus.COMPLETED &&
                "Completado"}
              {currentProcess.status === DailyProcessStatus.CANCELLED &&
                "Cancelado"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert variant={statusInfo.variant}>
            <div className="flex items-start gap-3">
              {statusInfo.icon}
              <div className="flex-1">
                <AlertDescription className="font-medium">
                  {statusInfo.title}
                </AlertDescription>
                <AlertDescription className="text-sm mt-1">
                  {statusInfo.description}
                </AlertDescription>
              </div>
            </div>
          </Alert>

          {/* Debug info - remove this after testing */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              Debug: Profile role: {profile?.role || "No profile"} | Is Regent:{" "}
              {isRegent ? "Yes" : "No"} | Show Actions:{" "}
              {statusInfo.showActions ? "Yes" : "No"} | Completed Predespachos:{" "}
              {completedPredespachoProcesses.length}
            </div>
          )}

          {statusInfo.showActions &&
            currentProcess?.status === DailyProcessStatus.ACTIVE && (
              <div className="flex items-center gap-2">
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

                <div className="text-sm text-muted-foreground">
                  <User className="h-4 w-4 inline mr-1" />
                  Solo regentes farmacéuticos pueden gestionar el proceso
                </div>
              </div>
            )}

          {currentProcess?.notes && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Notas:</strong> {currentProcess.notes}
            </div>
          )}

          {currentProcess && (
            <div className="text-xs text-muted-foreground">
              <strong>Iniciado por:</strong> {currentProcess.startedBy}
              {currentProcess.completedAt && (
                <>
                  <br />
                  <strong>Finalizado:</strong>{" "}
                  {new Date(currentProcess.completedAt).toLocaleString("es-ES")}
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
