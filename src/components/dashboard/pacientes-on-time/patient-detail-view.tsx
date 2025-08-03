"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Plus,
  ShoppingCart,
  RotateCcw,
  User,
  Lock,
  Scale,
  Check,
  AlertTriangle,
  Send,
  Camera,
  Truck,
  MapPin,
  UserCheck,
  Loader2,
  Clock,
  PackageCheck,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

import { Textarea } from "@/components/ui/textarea";
import { usePatient } from "@/hooks/use-patients";
import { useCurrentDailyProcess } from "@/hooks/use-daily-processes";
import {
  useAllMedicationProcesses,
  useUpdateMedicationProcess,
} from "@/hooks/use-medication-processes";
import {
  useProcessErrorLogs,
  useCreateProcessErrorLog,
} from "@/hooks/use-process-error-logs";
import {
  useManualReturns,
  useApproveManualReturn,
  useRejectManualReturn,
} from "@/hooks/use-manual-returns";
import { useQuery, useQueryClient, QueryClient } from "@tanstack/react-query";
import { useExportStatistics } from "@/hooks/use-statistics";
import { ProcessStatusButton } from "./process-status-button";
import { QRScanner } from "../qr-scanner";
import { DevolutionForm } from "./devolution-form";
import { DevolutionApproval } from "./devolution-approval";
import { useCompleteDevolutionReception } from "@/hooks/use-medication-processes";
import {
  MedicationProcessStep,
  ProcessStatus,
  PatientWithRelations,
  MedicationProcess,
  LogType,
  DailyProcess,
} from "@/types/patient";
import { UserRole } from "@prisma/client";
import { getLineDisplayName } from "@/lib/lines";
import { toast } from "@/components/ui/use-toast";

// Custom button component for devolution reception step
function DevolutionReceptionButton({
  patient,
  step,
  userRole,
  patientProcesses,
  queryClient,
  currentDailyProcess,
}: {
  patient: PatientWithRelations;
  step: ProcessStep;
  userRole: string;
  patientProcesses: MedicationProcess[];
  queryClient: QueryClient;
  currentDailyProcess?: DailyProcess | null;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const completeDevolutionReception = useCompleteDevolutionReception();

  const devolutionProcess = patientProcesses.find(
    (p) => p.step === MedicationProcessStep.DEVOLUCION
  );

  const isClickable = () => {
    if (isSyncing) return false;
    if (userRole !== "PHARMACY_REGENT" && userRole !== "SUPERADMIN")
      return false;
    if (!devolutionProcess) return false;
    return devolutionProcess.status === ProcessStatus.DELIVERED_TO_SERVICE;
  };

  const handleClick = async () => {
    if (!isClickable() || !devolutionProcess) return;

    setIsSyncing(true);
    try {
      await completeDevolutionReception.mutateAsync({
        patientId: patient.id,
        medicationProcessId: devolutionProcess.id,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["all-medication-processes"],
      });
    } catch (error) {
      console.error("Error completing devolution reception:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getButtonStyle = () => {
    if (step.status === ProcessStatus.COMPLETED) {
      return "bg-green-500 hover:bg-green-600 text-white border-green-500";
    }
    if (step.status === ProcessStatus.IN_PROGRESS) {
      return "bg-orange-500 hover:bg-orange-600 text-white border-orange-500";
    }
    return "bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed";
  };

  const getButtonText = () => {
    if (isSyncing) return "Completando...";
    if (step.status === ProcessStatus.COMPLETED) return "Completada";
    if (step.status === ProcessStatus.IN_PROGRESS) return "Recepción";
    return "Pendiente";
  };

  return (
    <Button
      onClick={handleClick}
      disabled={!isClickable()}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${getButtonStyle()}`}
    >
      {getButtonText()}
    </Button>
  );
}

// Helper function to calculate button state (same as in management component)
function calculateButtonState(
  patient: PatientWithRelations,
  step: MedicationProcessStep,
  process: MedicationProcess | undefined,
  allMedicationProcesses: MedicationProcess[]
) {
  // Special handling for DEVOLUCION step - override process status for "Solicitud Enfermería" button
  if (step === MedicationProcessStep.DEVOLUCION && process) {
    if (
      process.status === ProcessStatus.IN_PROGRESS ||
      process.status === ProcessStatus.DISPATCHED_FROM_PHARMACY ||
      process.status === ProcessStatus.DELIVERED_TO_SERVICE ||
      process.status === ProcessStatus.COMPLETED
    ) {
      return ProcessStatus.COMPLETED; // Show as green - nurse action completed
    }
    // For other statuses, fall through to normal logic
  }

  // If there's an actual process for this patient/step, return its status
  if (process) {
    return process.status;
  }

  // No process exists for this patient/step - determine what state to show
  if (step === MedicationProcessStep.PREDESPACHO) {
    // Check if any predespacho has started in the daily process
    const anyPredespachoStarted = allMedicationProcesses.some(
      (p) =>
        p.step === MedicationProcessStep.PREDESPACHO &&
        (p.status === ProcessStatus.IN_PROGRESS ||
          p.status === ProcessStatus.COMPLETED)
    );

    if (anyPredespachoStarted) {
      return ProcessStatus.IN_PROGRESS; // Show as in progress (orange dotted)
    }
    return null; // Show as empty (black border) - not started yet
  }

  if (step === MedicationProcessStep.ALISTAMIENTO) {
    const predespachoProcess = allMedicationProcesses.find(
      (p) =>
        p.patientId === patient.id &&
        p.step === MedicationProcessStep.PREDESPACHO
    );
    if (predespachoProcess?.status === ProcessStatus.COMPLETED) {
      return ProcessStatus.PENDING; // Show as pending (orange filled)
    }
    return null; // Show as disabled (black border)
  }

  if (step === MedicationProcessStep.VALIDACION) {
    const alistamientoProcess = allMedicationProcesses.find(
      (p) =>
        p.patientId === patient.id &&
        p.step === MedicationProcessStep.ALISTAMIENTO
    );
    if (alistamientoProcess?.status === ProcessStatus.COMPLETED) {
      return ProcessStatus.PENDING; // Show as pending (orange filled)
    }
    return null; // Show as disabled (black border)
  }

  if (step === MedicationProcessStep.ENTREGA) {
    const alistamientoProcess = allMedicationProcesses.find(
      (p) =>
        p.patientId === patient.id &&
        p.step === MedicationProcessStep.ALISTAMIENTO
    );

    // Check if ALISTAMIENTO is completed (prerequisite for QR scanning)
    if (alistamientoProcess?.status === ProcessStatus.COMPLETED) {
      // Check if patient has been through QR scan process
      const entregaProcess = allMedicationProcesses.find(
        (p) =>
          p.patientId === patient.id && p.step === MedicationProcessStep.ENTREGA
      );

      if (entregaProcess) {
        // If ENTREGA process exists, return its actual status
        return entregaProcess.status;
      } else {
        // No ENTREGA process yet - show as pending (orange) for QR scanning
        return ProcessStatus.PENDING;
      }
    }
    return null; // Show as disabled (black border) - ALISTAMIENTO not completed
  }

  if (step === MedicationProcessStep.DEVOLUCION) {
    // Check if delivery is completed (prerequisite for devolution)
    const entregaProcess = allMedicationProcesses.find(
      (p) =>
        p.patientId === patient.id && p.step === MedicationProcessStep.ENTREGA
    );
    if (entregaProcess?.status === ProcessStatus.COMPLETED) {
      // If we reach here, no devolution process exists yet (handled above if it exists)
      return ProcessStatus.PENDING; // Ready to start devolution
    }
    return null; // Delivery not completed yet, show as disabled
  }

  return null; // Default: disabled
}

interface PatientDetailViewProps {
  patientId: string;
  isNursePanel?: boolean;
}

type ProcessTab =
  | "dispensacion"
  | "entrega"
  | "devoluciones"
  | "devoluciones_manuales";

// UI-specific interfaces for compatibility
interface LogEntryDisplay {
  id: string;
  timestamp: string;
  role: string;
  message: string;
  type: "error" | "info" | "warning";
  patientName: string;
  patientId: string;
}

export interface QRScanRecord {
  id: string;
  patientId: string;
  qrCodeId: string;
  scannedBy: string;
  scannedAt: string;
  dailyProcessId: string;
  transactionType?: string; // "ENTREGA" or "DEVOLUCION"
  qrCode: {
    id: string;
    type:
      | "PHARMACY_DISPATCH"
      | "PHARMACY_DISPATCH_DEVOLUTION"
      | "SERVICE_ARRIVAL"
      | "DEVOLUTION_PICKUP"
      | "DEVOLUTION_RETURN";
    service?: {
      id: string;
      name: string;
      line: {
        id: string;
        displayName: string;
      };
    };
  };
}

// QR Step Button Component
interface ProcessStep {
  id: string;
  name: string;
  icon: React.ReactElement;
  status: ProcessStatus | null;
  step: MedicationProcessStep;
}

interface QRProcessStep extends ProcessStep {
  isQRStep: true;
  qrType: string;
}

interface QRStepButtonProps {
  step: QRProcessStep;
  qrScanRecords: QRScanRecord[];
  allMedicationProcesses: MedicationProcess[];
  patientId: string;
  onOpenQRScanner: () => void;
  userRole: string;
  queryClient: QueryClient;
  currentDailyProcess?: DailyProcess | null;
  isNursePanel?: boolean;
}

function QRStepButton({
  step,
  qrScanRecords,
  allMedicationProcesses,
  patientId,
  onOpenQRScanner,
  userRole,
  queryClient,
  currentDailyProcess,
  isNursePanel = false,
}: QRStepButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const isCompleted = step.status === ProcessStatus.COMPLETED;
  const isRegent = userRole === "PHARMACY_REGENT" || userRole === "SUPERADMIN";
  const isNurse = userRole === "NURSE" || userRole === "SUPERADMIN";

  // Debug logging for nursing reception button
  if (step.qrType === "NURSING_RECEPTION") {
    console.log("Nursing Reception Button Debug:", {
      step,
      qrScanRecords,
      isCompleted,
      isNurse,
      pharmacyDispatchScanned: qrScanRecords.some(
        (record) => record.qrCode.type === "PHARMACY_DISPATCH"
      ),
      serviceArrivalScanned: qrScanRecords.some(
        (record) => record.qrCode.type === "SERVICE_ARRIVAL"
      ),
      canInteract:
        isNurse &&
        isNursePanel &&
        qrScanRecords.some(
          (record) => record.qrCode.type === "PHARMACY_DISPATCH"
        ) &&
        qrScanRecords.some(
          (record) => record.qrCode.type === "SERVICE_ARRIVAL"
        ),
    });
  }

  // Determine if this step can be interacted with
  const canInteract = () => {
    if (isCompleted || isProcessing) return false;

    if (step.qrType === "NURSING_RECEPTION") {
      // Nursing reception can only be completed by nurses in the nurse panel, and only if both QR codes are scanned
      return (
        isNurse &&
        isNursePanel &&
        qrScanRecords.some(
          (record) => record.qrCode.type === "PHARMACY_DISPATCH"
        ) &&
        qrScanRecords.some((record) => record.qrCode.type === "SERVICE_ARRIVAL")
      );
    }

    // Devolutions steps
    if (step.qrType === "NURSING_REQUEST") {
      // Nursing request can only be started by nurses after delivery is confirmed
      const entregaCompleted = allMedicationProcesses.some(
        (mp) =>
          mp.patientId === patientId &&
          mp.step === "ENTREGA" &&
          mp.status === "COMPLETED"
      );
      const devolucionExists = allMedicationProcesses.some(
        (mp) => mp.patientId === patientId && mp.step === "DEVOLUCION"
      );
      return isNurse && entregaCompleted && !devolucionExists;
    }

    if (step.qrType === "FLOOR_ARRIVAL") {
      // Floor arrival can only be done by regents after nursing request
      const devolucionStarted = allMedicationProcesses.some(
        (mp) =>
          mp.patientId === patientId &&
          mp.step === "DEVOLUCION" &&
          mp.status === "IN_PROGRESS"
      );
      return isRegent && devolucionStarted;
    }

    if (step.qrType === "PHARMACY_RECEPTION") {
      // Pharmacy reception can only be done by regents after both devolution QR scans are completed
      const devolutionProcess = allMedicationProcesses.find(
        (mp) =>
          mp.patientId === patientId &&
          mp.step === "DEVOLUCION" &&
          mp.status === "DELIVERED_TO_SERVICE"
      );
      return isRegent && !!devolutionProcess;
    }

    if (step.qrType === "PHARMACY_DISPATCH_DEVOLUTION") {
      // First devolution pharmacy dispatch can be scanned after nursing request
      const devolucionStarted = allMedicationProcesses.some(
        (mp) =>
          mp.patientId === patientId &&
          mp.step === "DEVOLUCION" &&
          mp.status === "IN_PROGRESS"
      );
      const alreadyScanned = qrScanRecords.some(
        (record) =>
          record.transactionType === "DEVOLUCION" &&
          record.qrCode.type === "PHARMACY_DISPATCH_DEVOLUTION"
      );
      return isRegent && devolucionStarted && !alreadyScanned;
    }

    if (step.qrType === "PHARMACY_DISPATCH") {
      // Second devolution pharmacy dispatch can be scanned after first one
      const firstDevolutionScanned = qrScanRecords.some(
        (record) =>
          record.transactionType === "DEVOLUCION" &&
          record.qrCode.type === "PHARMACY_DISPATCH_DEVOLUTION"
      );
      const alreadyScanned = qrScanRecords.some(
        (record) =>
          record.transactionType === "DEVOLUCION" &&
          record.qrCode.type === "PHARMACY_DISPATCH"
      );
      return isRegent && firstDevolutionScanned && !alreadyScanned;
    }

    // QR scan steps can only be done by regents
    return isRegent;
  };

  // Get button styling based on status
  const getButtonStyle = () => {
    if (isCompleted) {
      return "bg-green-500 text-white border-0 hover:bg-green-600";
    }

    // For nursing reception, check if both QR codes are scanned
    if (step.qrType === "NURSING_RECEPTION") {
      const bothQRCodesScanned =
        qrScanRecords.some(
          (record) => record.qrCode.type === "PHARMACY_DISPATCH"
        ) &&
        qrScanRecords.some(
          (record) => record.qrCode.type === "SERVICE_ARRIVAL"
        );

      if (bothQRCodesScanned) {
        if (isNursePanel) {
          return "bg-transparent text-orange-500 border-2 border-dashed border-orange-500 hover:bg-orange-50";
        } else {
          // In dashboard panel - show as ready but not clickable
          return "bg-transparent text-blue-500 border-2 border-dashed border-blue-500";
        }
      } else {
        return "bg-transparent text-gray-500 border-2 border-gray-300 hover:bg-gray-50";
      }
    }

    // Devolutions styling
    if (step.qrType === "NURSING_REQUEST") {
      const devolucionExists = allMedicationProcesses.some(
        (mp) => mp.patientId === patientId && mp.step === "DEVOLUCION"
      );
      if (devolucionExists) {
        return "bg-green-500 text-white border-0 hover:bg-green-600";
      }
      const entregaCompleted = allMedicationProcesses.some(
        (mp) =>
          mp.patientId === patientId &&
          mp.step === "ENTREGA" &&
          mp.status === "COMPLETED"
      );
      if (entregaCompleted) {
        return "bg-transparent text-red-500 border-2 border-dashed border-red-500 hover:bg-red-50";
      }
      return "bg-transparent text-gray-500 border-2 border-gray-300 hover:bg-gray-50";
    }

    if (
      step.qrType === "FLOOR_ARRIVAL" ||
      step.qrType === "PHARMACY_RECEPTION" ||
      step.qrType === "PHARMACY_DISPATCH_DEVOLUTION"
    ) {
      return "bg-transparent text-red-500 border-2 border-dashed border-red-500 hover:bg-red-50";
    }

    if (step.qrType === "PHARMACY_DISPATCH") {
      return "bg-transparent text-orange-500 border-2 border-dashed border-orange-500 hover:bg-orange-50";
    }

    return "bg-transparent text-orange-500 border-2 border-dashed border-orange-500 hover:bg-orange-50";
  };

  const getButtonText = () => {
    if (isCompleted) {
      return "Completado";
    }
    if (step.qrType === "NURSING_RECEPTION") {
      if (isProcessing) return "Confirmando...";

      const bothQRCodesScanned =
        qrScanRecords.some(
          (record) => record.qrCode.type === "PHARMACY_DISPATCH"
        ) &&
        qrScanRecords.some(
          (record) => record.qrCode.type === "SERVICE_ARRIVAL"
        );

      if (bothQRCodesScanned) {
        return isNursePanel ? "Confirmar" : "Listo para Confirmar";
      }
      return "Pendiente";
    }

    // Devolutions text
    if (step.qrType === "NURSING_REQUEST") {
      if (isProcessing) return "Iniciando...";

      // Check if first QR has been scanned (means nursing request is completed)
      const firstQRScanned = qrScanRecords.some(
        (record) =>
          record.qrCode.type === "PHARMACY_DISPATCH_DEVOLUTION" &&
          record.transactionType === "DEVOLUCION"
      );
      if (firstQRScanned) return "Completado";

      // Check if devolution process exists (means nursing request is in progress)
      const devolucionInProgress = allMedicationProcesses.some(
        (mp) =>
          mp.patientId === patientId &&
          mp.step === "DEVOLUCION" &&
          mp.status === "IN_PROGRESS"
      );
      if (devolucionInProgress) return "En Proceso";

      return "Iniciar Devolución";
    }

    if (step.qrType === "FLOOR_ARRIVAL") {
      return "Escanear Llegada";
    }

    if (step.qrType === "PHARMACY_RECEPTION") {
      return "Confirmar Recepción";
    }

    if (step.qrType === "PHARMACY_DISPATCH_DEVOLUTION") {
      return "Escanear Salida (Devolución)";
    }

    if (step.qrType === "PHARMACY_DISPATCH") {
      return "Escanear Salida (Entrega)";
    }

    return "Escanear";
  };

  const getButtonIcon = () => {
    if (isCompleted) {
      return <Check className="h-3 w-3" />;
    }
    if (step.qrType === "NURSING_RECEPTION") {
      return isProcessing ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <UserCheck className="h-3 w-3" />
      );
    }

    // Devolutions icons
    if (step.qrType === "NURSING_REQUEST") {
      if (isProcessing) return <Loader2 className="h-3 w-3 animate-spin" />;

      // Check if first QR has been scanned (means nursing request is completed)
      const firstQRScanned = qrScanRecords.some(
        (record) =>
          record.qrCode.type === "PHARMACY_DISPATCH_DEVOLUTION" &&
          record.transactionType === "DEVOLUCION"
      );
      if (firstQRScanned) return <Check className="h-3 w-3" />;

      // Check if devolution process exists (means nursing request is in progress)
      const devolucionInProgress = allMedicationProcesses.some(
        (mp) =>
          mp.patientId === patientId &&
          mp.step === "DEVOLUCION" &&
          mp.status === "IN_PROGRESS"
      );
      if (devolucionInProgress) return <Clock className="h-3 w-3" />;

      return <User className="h-3 w-3" />;
    }

    if (step.qrType === "FLOOR_ARRIVAL") {
      return <MapPin className="h-3 w-3" />;
    }

    if (step.qrType === "PHARMACY_RECEPTION") {
      return isProcessing ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <PackageCheck className="h-3 w-3" />
      );
    }

    if (step.qrType === "PHARMACY_DISPATCH_DEVOLUTION") {
      return <Truck className="h-3 w-3" />;
    }

    if (step.qrType === "PHARMACY_DISPATCH") {
      return <ArrowRight className="h-3 w-3" />;
    }

    return <Camera className="h-3 w-3" />;
  };

  const handleButtonClick = async () => {
    if (step.qrType === "NURSING_RECEPTION") {
      // Handle nursing reception confirmation
      setIsProcessing(true);
      try {
        // Find the entrega process for this patient
        const entregaProcess = allMedicationProcesses.find(
          (mp) => mp.patientId === patientId && mp.step === "ENTREGA"
        );

        if (entregaProcess) {
          // Update the entrega process to COMPLETED
          const response = await fetch(
            `/api/medication-processes/${entregaProcess.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "COMPLETED",
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to update medication process");
          }
        } else {
          // Create a new entrega process with COMPLETED status
          if (!currentDailyProcess?.id) {
            throw new Error("No active daily process found");
          }

          const response = await fetch("/api/medication-processes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              patientId: patientId,
              step: "ENTREGA",
              status: "COMPLETED",
              dailyProcessId: currentDailyProcess.id,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to create medication process");
          }
        }

        // Invalidate queries to refresh the UI
        if (queryClient) {
          queryClient.invalidateQueries({
            queryKey: ["all-medication-processes"],
          });
          queryClient.invalidateQueries({
            queryKey: ["patients"],
          });
        }

        // Show success toast
        toast({
          title: "Recepción confirmada",
          description:
            "Se ha confirmado la recepción de medicamentos por enfermería",
        });
      } catch (error) {
        console.error("Error confirming nursing reception:", error);
        // Show error toast
        toast({
          title: "Error",
          description: "No se pudo confirmar la recepción de medicamentos",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    } else if (step.qrType === "PHARMACY_RECEPTION") {
      // Handle pharmacy reception confirmation (final step of devolution)
      setIsProcessing(true);
      try {
        // Find the devolution process for this patient
        const devolutionProcess = allMedicationProcesses.find(
          (mp) => mp.patientId === patientId && mp.step === "DEVOLUCION"
        );

        if (!devolutionProcess) {
          throw new Error("No devolution process found for this patient");
        }

        if (devolutionProcess.status !== "DELIVERED_TO_SERVICE") {
          throw new Error(
            "Devolution process must be in DELIVERED_TO_SERVICE status to complete reception"
          );
        }

        // Use the devolution reception API endpoint
        const response = await fetch("/api/devolution-reception", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientId: patientId,
            medicationProcessId: devolutionProcess.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to complete devolution reception"
          );
        }

        // Invalidate queries to refresh the UI
        if (queryClient) {
          queryClient.invalidateQueries({
            queryKey: ["all-medication-processes"],
          });
          queryClient.invalidateQueries({
            queryKey: ["patients"],
          });
        }

        // Show success toast
        toast({
          title: "Recepción de devolución completada",
          description:
            "Se ha completado exitosamente la recepción de la devolución",
        });
      } catch (error) {
        console.error("Error completing devolution reception:", error);
        // Show error toast
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "No se pudo completar la recepción de devolución",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    } else if (step.qrType === "NURSING_REQUEST") {
      // Handle nursing request initiation
      setIsProcessing(true);
      try {
        if (!currentDailyProcess?.id) {
          throw new Error("No active daily process found");
        }

        // Check if devolucion process already exists
        const existingDevolucion = allMedicationProcesses.find(
          (mp) => mp.patientId === patientId && mp.step === "DEVOLUCION"
        );

        let response;
        if (existingDevolucion) {
          // Update existing process to IN_PROGRESS if it's not already
          if (existingDevolucion.status !== "IN_PROGRESS") {
            response = await fetch(
              `/api/medication-processes/${existingDevolucion.id}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  status: "IN_PROGRESS",
                  startedAt: new Date().toISOString(),
                }),
              }
            );
          } else {
            // Process is already in progress, just return success
            response = { ok: true };
          }
        } else {
          // Create new devolucion process with IN_PROGRESS status
          response = await fetch("/api/medication-processes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              patientId: patientId,
              step: "DEVOLUCION",
              status: "IN_PROGRESS",
              dailyProcessId: currentDailyProcess.id,
            }),
          });
        }

        if (!response.ok) {
          throw new Error("Failed to create/update devolucion process");
        }

        // Invalidate queries to refresh the UI
        if (queryClient) {
          queryClient.invalidateQueries({
            queryKey: ["all-medication-processes"],
          });
          queryClient.invalidateQueries({
            queryKey: ["patients"],
          });
        }

        // Show success toast
        toast({
          title: "Devolución iniciada",
          description: "Se ha iniciado el proceso de devolución",
        });
      } catch (error) {
        console.error("Error starting devolucion process:", error);
        // Show error toast
        toast({
          title: "Error",
          description: "No se pudo iniciar el proceso de devolución",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Open QR scanner for QR scan steps
      onOpenQRScanner();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`px-3 py-1 h-8 min-w-[80px] rounded-full text-xs font-medium ${getButtonStyle()} ${!canInteract() ? "cursor-not-allowed" : "cursor-pointer"}`}
      onClick={canInteract() ? handleButtonClick : undefined}
      disabled={!canInteract()}
    >
      <div className="flex items-center gap-1">
        {getButtonIcon()}
        <span>{getButtonText()}</span>
      </div>
    </Button>
  );
}

export default function PatientDetailView({
  patientId,
  isNursePanel = false,
}: PatientDetailViewProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ProcessTab>("dispensacion");
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isManualReturnModalOpen, setIsManualReturnModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [selectedErrorStep, setSelectedErrorStep] = useState<
    MedicationProcessStep | ""
  >("");

  // Devolution workflow state
  const [isDevolutionFormOpen, setIsDevolutionFormOpen] = useState(false);

  // Export Modal State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);

  // Fetch patient data
  const { data: patient, isLoading: patientLoading } = usePatient({
    id: patientId,
  });

  // Fetch current daily process and medication processes
  const { data: currentDailyProcess } = useCurrentDailyProcess();
  const { data: allMedicationProcesses = [] } = useAllMedicationProcesses(
    currentDailyProcess?.id
  );

  // Fetch QR scan records for this patient
  const { data: qrScanRecords = [] } = useQuery<QRScanRecord[]>({
    queryKey: ["qr-scan-records", patientId, currentDailyProcess?.id],
    queryFn: async (): Promise<QRScanRecord[]> => {
      if (!currentDailyProcess?.id) return [];
      const response = await fetch(
        `/api/patients/${patientId}/qr-scan-records?dailyProcessId=${currentDailyProcess.id}`
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!patientId && !!currentDailyProcess?.id,
  });

  // Fetch all logs for this patient (including resolved status change logs)
  const { data: errorLogs = [] } = useProcessErrorLogs({
    filters: { patientId },
    includeResolved: true, // Include all logs to show complete timeline
  });

  // Fetch real manual returns for this patient
  const { data: manualReturns = [] } = useManualReturns({
    filters: { patientId },
  });

  // Mutations
  const createErrorLog = useCreateProcessErrorLog();
  const updateMedicationProcess = useUpdateMedicationProcess();
  const exportStatistics = useExportStatistics();

  const approveManualReturn = useApproveManualReturn();
  const rejectManualReturn = useRejectManualReturn();

  // Filter processes for this patient
  const patientProcesses = allMedicationProcesses.filter(
    (p) => p.patientId === patientId
  );

  // Watch for new devolution processes that need manual devolution form
  // Note: This is now optional - nurses can choose to create manual devolutions during the devolution process

  // Handle export function
  const handleExport = async () => {
    if (!startDate || !endDate) return;

    try {
      await exportStatistics.exportData("general", "CSV", {
        dateFrom: startDate,
        dateTo: endDate,
      });
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  // Calculate button states for optimistic updates
  const buttonStates = useMemo(() => {
    if (!patient) return {};

    const states: Record<string, ProcessStatus | null> = {};

    [
      MedicationProcessStep.PREDESPACHO,
      MedicationProcessStep.ALISTAMIENTO,
      MedicationProcessStep.VALIDACION,
      MedicationProcessStep.ENTREGA,
      MedicationProcessStep.DEVOLUCION,
    ].forEach((step) => {
      const process = patientProcesses.find((p) => p.step === step);
      states[step] = calculateButtonState(
        patient,
        step,
        process,
        allMedicationProcesses
      );
    });

    return states;
  }, [patient, patientProcesses, allMedicationProcesses]);

  if (patientLoading || !patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">
            Cargando datos del paciente...
          </p>
        </div>
      </div>
    );
  }

  // Get process status for display
  const getProcessStatus = (step: MedicationProcessStep) => {
    const process = patientProcesses.find((p) => p.step === step);
    return process?.status || ProcessStatus.PENDING;
  };

  const processSteps = {
    dispensacion: [
      {
        id: "predespacho",
        name: "Predespacho",
        icon: <Lock className="h-4 w-4" />,
        status: getProcessStatus(MedicationProcessStep.PREDESPACHO),
        step: MedicationProcessStep.PREDESPACHO,
      },
      {
        id: "alistamiento",
        name: "Alistamiento",
        icon: <Scale className="h-4 w-4" />,
        status: getProcessStatus(MedicationProcessStep.ALISTAMIENTO),
        step: MedicationProcessStep.ALISTAMIENTO,
      },
      {
        id: "validacion",
        name: "Validación",
        icon: <Check className="h-4 w-4" />,
        status: getProcessStatus(MedicationProcessStep.VALIDACION),
        step: MedicationProcessStep.VALIDACION,
      },
    ],
    entrega: [
      {
        id: "salida-farmacia",
        name: "Salida de Farmacia",
        icon: <Truck className="h-4 w-4" />,
        status: qrScanRecords.some(
          (record) => record.qrCode.type === "PHARMACY_DISPATCH"
        )
          ? ProcessStatus.COMPLETED
          : ProcessStatus.PENDING,
        step: MedicationProcessStep.ENTREGA,
        isQRStep: true,
        qrType: "PHARMACY_DISPATCH",
      },
      {
        id: "llegada-servicio",
        name: "Llegada a Servicio",
        icon: <MapPin className="h-4 w-4" />,
        status: qrScanRecords.some(
          (record) => record.qrCode.type === "SERVICE_ARRIVAL"
        )
          ? ProcessStatus.COMPLETED
          : ProcessStatus.PENDING,
        step: MedicationProcessStep.ENTREGA,
        isQRStep: true,
        qrType: "SERVICE_ARRIVAL",
      },
      {
        id: "recepcion-enfermeria",
        name: "Recepción Enfermería",
        icon: <UserCheck className="h-4 w-4" />,
        status:
          qrScanRecords.some(
            (record) => record.qrCode.type === "PHARMACY_DISPATCH"
          ) &&
          qrScanRecords.some(
            (record) => record.qrCode.type === "SERVICE_ARRIVAL"
          ) &&
          allMedicationProcesses.some(
            (mp) =>
              mp.patientId === patientId &&
              mp.step === "ENTREGA" &&
              mp.status === "COMPLETED"
          )
            ? ProcessStatus.COMPLETED
            : qrScanRecords.some(
                  (record) => record.qrCode.type === "PHARMACY_DISPATCH"
                ) &&
                qrScanRecords.some(
                  (record) => record.qrCode.type === "SERVICE_ARRIVAL"
                )
              ? ProcessStatus.IN_PROGRESS
              : ProcessStatus.PENDING,
        step: MedicationProcessStep.ENTREGA,
        isQRStep: true,
        qrType: "NURSING_RECEPTION",
      },
    ],
    devoluciones: [
      {
        id: "solicitud-enfermeria",
        name: "Solicitud Enfermería",
        icon: <User className="h-4 w-4" />,
        status: allMedicationProcesses.some(
          (mp) =>
            mp.patientId === patientId &&
            mp.step === "DEVOLUCION" &&
            (mp.status === "IN_PROGRESS" ||
              mp.status === "DISPATCHED_FROM_PHARMACY" ||
              mp.status === "DELIVERED_TO_SERVICE" ||
              mp.status === "COMPLETED")
        )
          ? ProcessStatus.COMPLETED
          : allMedicationProcesses.some(
                (mp) =>
                  mp.patientId === patientId &&
                  mp.step === "ENTREGA" &&
                  mp.status === "COMPLETED"
              )
            ? ProcessStatus.PENDING
            : ProcessStatus.PENDING,
        step: MedicationProcessStep.DEVOLUCION,
        isQRStep: false,
        description:
          "Enfermería inicia el proceso de devolución desde la gestión de pacientes",
      },
      {
        id: "salida-farmacia-devolucion",
        name: "Salida Farmacia (Devolución)",
        icon: <Truck className="h-4 w-4" />,
        status: qrScanRecords.some(
          (record) =>
            record.qrCode.type === "PHARMACY_DISPATCH_DEVOLUTION" &&
            record.transactionType === "DEVOLUCION"
        )
          ? ProcessStatus.COMPLETED
          : allMedicationProcesses.some(
                (mp) =>
                  mp.patientId === patientId &&
                  mp.step === "DEVOLUCION" &&
                  mp.status === "IN_PROGRESS"
              )
            ? ProcessStatus.PENDING
            : ProcessStatus.PENDING,
        step: MedicationProcessStep.DEVOLUCION,
        isQRStep: true,
        qrType: "PHARMACY_DISPATCH_DEVOLUTION",
        description: "Primer QR: Registra salida de farmacia para devolución",
      },
      {
        id: "salida-farmacia-entrega",
        name: "Salida Farmacia (Entrega)",
        icon: <ArrowRight className="h-4 w-4" />,
        status: qrScanRecords.some(
          (record) =>
            record.qrCode.type === "PHARMACY_DISPATCH" &&
            record.transactionType === "DEVOLUCION"
        )
          ? ProcessStatus.COMPLETED
          : qrScanRecords.some(
                (record) =>
                  record.qrCode.type === "PHARMACY_DISPATCH_DEVOLUTION" &&
                  record.transactionType === "DEVOLUCION"
              )
            ? ProcessStatus.PENDING
            : ProcessStatus.PENDING,
        step: MedicationProcessStep.DEVOLUCION,
        isQRStep: true,
        qrType: "PHARMACY_DISPATCH",
        description:
          "Segundo QR: Completa el proceso de salida para devolución",
      },
      {
        id: "recepcion-farmacia",
        name: "Recepción de Farmacia",
        icon: <Check className="h-4 w-4" />,
        status: allMedicationProcesses.some(
          (mp) =>
            mp.patientId === patientId &&
            mp.step === "DEVOLUCION" &&
            mp.status === "COMPLETED"
        )
          ? ProcessStatus.COMPLETED
          : allMedicationProcesses.some(
                (mp) =>
                  mp.patientId === patientId &&
                  mp.step === "DEVOLUCION" &&
                  mp.status === "DELIVERED_TO_SERVICE"
              )
            ? ProcessStatus.IN_PROGRESS
            : ProcessStatus.PENDING,
        step: MedicationProcessStep.DEVOLUCION,
        isQRStep: false,
        qrType: "PHARMACY_RECEPTION",
        description:
          "Paso final: Regente de farmacia confirma recepción completa de devolución",
      },
    ],
    devoluciones_manuales: [],
  };

  const handleAddMessage = async () => {
    if (newMessage.trim() && patient) {
      try {
        await createErrorLog.mutateAsync({
          patientId: patient.id,
          logType: LogType.INFO,
          message: newMessage.trim(),
          reportedByRole: profile?.role || UserRole.SUPERADMIN,
        });
        setNewMessage("");
      } catch (error) {
        console.error("Error creating log entry:", error);
      }
    }
  };

  const handleReportError = async () => {
    if (newMessage.trim() && selectedErrorStep && patient) {
      try {
        // Find the medication process for this patient and step
        const medicationProcess = patientProcesses.find(
          (p) => p.step === selectedErrorStep && p.patientId === patient.id
        );

        // Create the error log
        await createErrorLog.mutateAsync({
          patientId: patient.id,
          medicationProcessId: medicationProcess?.id,
          step: selectedErrorStep as MedicationProcessStep,
          logType: LogType.ERROR,
          message: newMessage.trim(),
          reportedByRole: profile?.role || UserRole.SUPERADMIN,
        });

        // Update the medication process to ERROR status if it exists
        if (medicationProcess) {
          await updateMedicationProcess.mutateAsync({
            id: medicationProcess.id,
            data: {
              status: ProcessStatus.ERROR,
              notes: `Error reported: ${newMessage.trim()}`,
            },
          });
        }

        setNewMessage("");
        setSelectedErrorStep("");
        setIsEmergencyModalOpen(false);
      } catch (error) {
        console.error("Error reporting error:", error);
      }
    }
  };

  // Convert error logs to display format
  const logEntries: LogEntryDisplay[] = errorLogs.map((log) => ({
    id: log.id,
    timestamp: new Date(log.createdAt).toLocaleString(),
    role: log.reportedByRole,
    message: log.message,
    type: log.logType.toLowerCase() as "error" | "info" | "warning",
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
    patientId: patient?.externalId || "",
  }));

  const LogEntryComponent = ({ entry }: { entry: LogEntryDisplay }) => {
    const getTypeIcon = (type: string) => {
      switch (type) {
        case "error":
          return <AlertTriangle className="h-4 w-4 text-red-500" />;
        case "warning":
          return <AlertTriangle className="h-4 w-4 text-orange-500" />;
        default:
          return (
            <div className="h-4 w-4 bg-green-500 rounded-sm flex items-center justify-center">
              <Check className="w-2 h-2 text-white" />
            </div>
          );
      }
    };

    return (
      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex-shrink-0 mt-1">{getTypeIcon(entry.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">
              {entry.role}
            </span>
            <span className="text-xs text-muted-foreground">
              {entry.timestamp}
            </span>
          </div>
          <p className="text-sm text-foreground mb-1">{entry.message}</p>
          <p className="text-xs text-muted-foreground">
            Nombre: {entry.patientName}, Identificación: {entry.patientId}
          </p>
        </div>
      </div>
    );
  };

  const tabs = [
    {
      id: "dispensacion" as const,
      name: "Dispensación",
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      id: "entrega" as const,
      name: "Entrega",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      id: "devoluciones" as const,
      name: "Devoluciones",
      icon: <RotateCcw className="h-4 w-4" />,
    },
    {
      id: "devoluciones_manuales" as const,
      name: "Devoluciones Independientes",
      icon: <User className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header with Patient Basic Info */}
      <div className="bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 rounded-full px-6"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Detalles del paciente
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Removed warning icon */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6">
        {/* Process Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg max-w-2xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                  (tab as { disabled?: boolean }).disabled &&
                    "opacity-50 cursor-not-allowed"
                )}
                onClick={() => {
                  if (!(tab as { disabled?: boolean }).disabled) {
                    setActiveTab(tab.id);
                  }
                }}
                disabled={(tab as { disabled?: boolean }).disabled}
              >
                {tab.icon}
                <span>{tab.name}</span>
                {(tab as { disabled?: boolean }).disabled && (
                  <Lock className="h-3 w-3 ml-1" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area - Side by Side Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Process Content - Left Side (2/3 width) */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">
                    {activeTab.replace("_", " ")}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-500 text-white hover:bg-red-600"
                    onClick={() => setIsEmergencyModalOpen(true)}
                  >
                    REPORTAR
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activeTab === "devoluciones_manuales" ? (
                  <div className="space-y-6">
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-foreground">
                        Devoluciones Manuales
                      </h2>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsExportModalOpen(true)}
                        >
                          <svg
                            className="h-4 w-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Exportar Devoluciones
                        </Button>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => setIsManualReturnModalOpen(true)}
                        >
                          <svg
                            className="h-4 w-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Generar Devolución Independiente
                        </Button>
                      </div>
                    </div>
                    {/* Subtitle */}
                    <p className="text-sm text-muted-foreground">
                      Devoluciones Independientes Registradas
                    </p>
                    {/* Manual Return Cards */}
                    {manualReturns.length > 0 ? (
                      <div className="space-y-4">
                        {manualReturns.map((manualReturn) => (
                          <Card key={manualReturn.id}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-foreground">
                                      {manualReturn.supplies?.[0]?.supplyName ||
                                        "Medicamento"}
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                                        Cantidad:{" "}
                                        {manualReturn.supplies?.[0]
                                          ?.quantityReturned || 0}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="space-y-2 mb-4">
                                    <p className="text-sm">
                                      <span className="font-medium">
                                        Causas:
                                      </span>{" "}
                                      {manualReturn.cause}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium">
                                        Comentario:
                                      </span>{" "}
                                      {manualReturn.comments ||
                                        "Sin comentarios"}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                      <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      <span>
                                        {new Date(
                                          manualReturn.createdAt
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span
                                        className={`text-xs px-2 py-1 rounded-full ${
                                          manualReturn.status === "PENDING"
                                            ? "bg-orange-100 text-orange-800"
                                            : manualReturn.status === "APPROVED"
                                              ? "bg-green-100 text-green-800"
                                              : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {manualReturn.status === "PENDING" &&
                                          "En espera de revisión"}
                                        {manualReturn.status === "APPROVED" &&
                                          "Aprobado"}
                                        {manualReturn.status === "REJECTED" &&
                                          "Rechazado"}
                                      </span>
                                      {manualReturn.status === "PENDING" && (
                                        <>
                                          {/* Only show approve/reject buttons for authorized roles */}
                                          {profile?.role ===
                                            "PHARMACY_REGENT" ||
                                          profile?.role === "SUPERADMIN" ? (
                                            <>
                                              <Button
                                                size="sm"
                                                className="bg-green-500 hover:bg-green-600"
                                                onClick={() =>
                                                  approveManualReturn.mutate(
                                                    manualReturn.id
                                                  )
                                                }
                                                disabled={
                                                  approveManualReturn.isPending
                                                }
                                              >
                                                <Check className="h-4 w-4 mr-1" />
                                                Aprobar
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-500 text-red-500 hover:bg-red-50"
                                                onClick={() =>
                                                  rejectManualReturn.mutate({
                                                    id: manualReturn.id,
                                                  })
                                                }
                                                disabled={
                                                  rejectManualReturn.isPending
                                                }
                                              >
                                                <AlertTriangle className="h-4 w-4 mr-1" />
                                                Rechazar
                                              </Button>
                                            </>
                                          ) : (
                                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                              Pendiente de aprobación
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No hay devoluciones independientes registradas.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Process Steps with Enhanced Layout */}
                    <div className="grid grid-cols-3 gap-6">
                      {processSteps[activeTab]?.map((step) => {
                        return (
                          <div
                            key={step.id}
                            className="flex flex-col items-center space-y-3"
                          >
                            {/* Process Button */}
                            <div className="flex flex-col items-center space-y-2">
                              {"isQRStep" in step && step.isQRStep ? (
                                <QRStepButton
                                  step={step as QRProcessStep}
                                  qrScanRecords={qrScanRecords}
                                  allMedicationProcesses={
                                    allMedicationProcesses
                                  }
                                  patientId={patientId}
                                  onOpenQRScanner={() =>
                                    setIsQRScannerOpen(true)
                                  }
                                  userRole={profile?.role || ""}
                                  queryClient={queryClient}
                                  currentDailyProcess={currentDailyProcess}
                                  isNursePanel={isNursePanel}
                                />
                              ) : step.id === "recepcion-farmacia" ? (
                                <DevolutionReceptionButton
                                  patient={patient}
                                  step={step}
                                  userRole={profile?.role || ""}
                                  patientProcesses={patientProcesses}
                                  queryClient={queryClient}
                                  currentDailyProcess={currentDailyProcess}
                                />
                              ) : (
                                <ProcessStatusButton
                                  patient={patient}
                                  step={step.step}
                                  userRole={profile?.role || ""}
                                  preloadedProcess={patientProcesses.find(
                                    (p) => p.step === step.step
                                  )}
                                  preCalculatedState={buttonStates[step.step]}
                                />
                              )}
                              {/* Step Label Below Button */}
                              <div className="text-sm font-medium text-muted-foreground text-center">
                                {step.name}
                              </div>
                            </div>

                            {/* Step Icon and Status */}
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              {step.icon}
                              <span className="capitalize">
                                {step.status === ProcessStatus.COMPLETED &&
                                  "Completado"}
                                {step.status ===
                                  ProcessStatus.DISPATCHED_FROM_PHARMACY &&
                                  "Salió de Farmacia"}
                                {step.status ===
                                  ProcessStatus.DELIVERED_TO_SERVICE &&
                                  "Entregado en Servicio"}
                                {step.status === ProcessStatus.IN_PROGRESS &&
                                  "En Progreso"}
                                {step.status === ProcessStatus.PENDING &&
                                  "Pendiente"}
                                {step.status === ProcessStatus.ERROR && "Error"}
                                {!step.status && "Sin Iniciar"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Devolution Approval - Show to all roles but with conditional actions */}
                    {activeTab === "devoluciones" && (
                      <div className="mt-6">
                        <DevolutionApproval
                          manualReturns={manualReturns}
                          userRole={profile?.role}
                          onApprovalChange={() => {
                            queryClient.invalidateQueries({
                              queryKey: ["manual-returns"],
                            });
                            queryClient.invalidateQueries({
                              queryKey: ["all-medication-processes"],
                            });
                          }}
                        />
                      </div>
                    )}

                    {/* Optional Manual Devolution Button for Nurses */}
                    {activeTab === "devoluciones" &&
                      profile?.role === "NURSE" && (
                        <div className="mt-6">
                          {(() => {
                            const devolutionProcess = patientProcesses.find(
                              (p) =>
                                p.step === MedicationProcessStep.DEVOLUCION &&
                                p.status === ProcessStatus.IN_PROGRESS
                            );

                            if (devolutionProcess) {
                              return (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="text-sm font-medium text-blue-900">
                                        Devolución Manual Opcional
                                      </h4>
                                      <p className="text-xs text-blue-700 mt-1">
                                        ¿Necesitas crear una devolución manual
                                        durante este proceso?
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        // No longer needed - devolutions are independent
                                        setIsDevolutionFormOpen(true);
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Crear Devolución Manual
                                    </Button>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}

                    {/* QR Scanner Button for Entrega Tab */}
                    {activeTab === "entrega" &&
                      profile?.role === "PHARMACY_REGENT" && (
                        <div className="mt-6 text-center">
                          <Button
                            onClick={() => setIsQRScannerOpen(true)}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Camera className="h-5 w-5" />
                            Escanear Código QR
                          </Button>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Escanea los códigos QR para registrar la salida de
                            farmacia y llegada al servicio
                          </p>
                        </div>
                      )}

                    {/* QR Scanner Button for Devoluciones Tab */}
                    {activeTab === "devoluciones" &&
                      (profile?.role === "NURSE" ||
                        profile?.role === "PHARMACY_REGENT") && (
                        <div className="mt-6 text-center">
                          <Button
                            onClick={() => setIsQRScannerOpen(true)}
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Camera className="h-5 w-5" />
                            Escanear Código QR
                          </Button>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Escanea los códigos QR para registrar el proceso de
                            devolución
                          </p>
                        </div>
                      )}

                    {/* Messages Display */}
                    <div className="border border-border rounded-lg p-4 min-h-[120px]">
                      {logEntries.length > 0 ? (
                        <div className="space-y-3">
                          {logEntries.map((entry) => (
                            <LogEntryComponent key={entry.id} entry={entry} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <p>No hay mensajes disponibles.</p>
                        </div>
                      )}
                    </div>

                    {/* Error Message Input - Show in Dispensación tab for all roles EXCEPT NURSE */}
                    {activeTab === "dispensacion" &&
                      profile?.role !== "NURSE" && (
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                          </div>
                          <Input
                            placeholder="Mensaje de error"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleAddMessage();
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleAddMessage}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!newMessage.trim()}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Agregar
                          </Button>
                        </div>
                      )}

                    {/* Error Message Input - Show in Devoluciones tab ONLY for NURSE role */}
                    {activeTab === "devoluciones" &&
                      profile?.role === "NURSE" && (
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                          </div>
                          <Input
                            placeholder="Mensaje de error"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleAddMessage();
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleAddMessage}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!newMessage.trim()}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Agregar
                          </Button>
                        </div>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Patient Info Card - Right Side */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {patient.firstName} {patient.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Cama:{" "}
                  <span className="font-medium">
                    {patient.bed?.number || "N/A"}
                  </span>
                  {" - "}
                  <span className="font-medium">
                    {patient.bed?.line?.name
                      ? getLineDisplayName(patient.bed.line.name)
                      : "N/A"}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-1">
                    Identificación
                  </h4>
                  <p className="text-xs text-blue-600">{patient.externalId}</p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-1">
                    Edad
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {patient.dateOfBirth
                      ? Math.floor(
                          (new Date().getTime() -
                            new Date(patient.dateOfBirth).getTime()) /
                            (365.25 * 24 * 60 * 60 * 1000)
                        )
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-1">
                    Sexo
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {patient.gender || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-1">
                    Fecha de ingreso
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {patient.admissionDate
                      ? new Date(patient.admissionDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Notas médicas
                </h4>
                <p className="text-xs text-blue-600 leading-relaxed">
                  {patient.notes || "No hay notas disponibles"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Report Modal */}
      <Dialog
        open={isEmergencyModalOpen}
        onOpenChange={setIsEmergencyModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reportar Error en Etapa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Etapa con error
              </label>
              <Select
                value={selectedErrorStep}
                onValueChange={(value) =>
                  setSelectedErrorStep(value as MedicationProcessStep | "")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MedicationProcessStep.PREDESPACHO}>
                    Predespacho
                  </SelectItem>
                  <SelectItem value={MedicationProcessStep.ALISTAMIENTO}>
                    Alistamiento
                  </SelectItem>
                  <SelectItem value={MedicationProcessStep.VALIDACION}>
                    Validación
                  </SelectItem>
                  <SelectItem value={MedicationProcessStep.ENTREGA}>
                    Entrega
                  </SelectItem>
                  <SelectItem value={MedicationProcessStep.DEVOLUCION}>
                    Devolución
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Descripción del error
              </label>
              <Textarea
                placeholder="Describe el error encontrado..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEmergencyModalOpen(false);
                setNewMessage("");
                setSelectedErrorStep("");
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleReportError}
              disabled={
                !selectedErrorStep ||
                !newMessage.trim() ||
                createErrorLog.isPending
              }
            >
              {createErrorLog.isPending ? "Reportando..." : "Reportar Error"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Return Modal */}
      <Dialog
        open={isManualReturnModalOpen}
        onOpenChange={setIsManualReturnModalOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Devolución Independiente</DialogTitle>
          </DialogHeader>
          <DevolutionForm
            patientId={patientId}
            onSuccess={() => {
              setIsManualReturnModalOpen(false);
              // Refresh data
              queryClient.invalidateQueries({ queryKey: ["manual-returns"] });
            }}
            onCancel={() => {
              setIsManualReturnModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Devolution Form Modal */}
      <Dialog
        open={isDevolutionFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDevolutionFormOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Proceso de Devolución - Crear Devolución Manual
            </DialogTitle>
          </DialogHeader>
          <DevolutionForm
            patientId={patientId}
            onSuccess={() => {
              setIsDevolutionFormOpen(false);
              // Refresh data
              queryClient.invalidateQueries({ queryKey: ["manual-returns"] });
            }}
            onCancel={() => {
              setIsDevolutionFormOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Exportar Estadísticas</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Fecha de inicio
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Fecha de fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Medicamentos (opcional)
              </label>
              <Input
                placeholder="Separar por comas (ej: Med1, Med2)"
                value={selectedMedications.join(", ")}
                onChange={(e) =>
                  setSelectedMedications(
                    e.target.value.split(",").map((m) => m.trim())
                  )
                }
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsExportModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={!startDate || !endDate}
              className="bg-green-600 hover:bg-green-700"
            >
              {false ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Scanner Modal */}
      <QRScanner
        open={isQRScannerOpen}
        onOpenChange={setIsQRScannerOpen}
        currentTab={activeTab}
      />
    </div>
  );
}
