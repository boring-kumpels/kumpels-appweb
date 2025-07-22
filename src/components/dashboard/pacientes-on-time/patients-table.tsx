"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Lock,
  Scale,
  Check,
  ShoppingCart,
  RotateCcw,
  FileText,
} from "lucide-react";
import type { Patient } from "./pacientes-on-time-management";
import { ErrorReportModal } from "./error-report-modal";

interface PatientsTableProps {
  patients: Patient[];
  isLoading: boolean;
  onOpenPatientDetail?: (patient: Patient) => void;
}

interface StatusButtonProps {
  icon: React.ReactNode;
  status: "empty" | "pending" | "in_progress" | "completed" | "error";
  onClick?: () => void;
  showErrorReport?: boolean;
  patientName?: string;
  patientId?: string;
  errorType?: "distribución" | "devoluciones";
}

const StatusButton: React.FC<StatusButtonProps> = ({
  icon,
  status,
  onClick,
  showErrorReport = false,
  patientName,
  patientId,
  errorType,
}) => {
  const getIconColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "in_progress":
        return "text-orange-500";
      case "pending":
        return "text-orange-500";
      case "error":
        return "text-red-500";
      case "empty":
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "bg-white border-gray-200 hover:bg-gray-50 px-3 py-1 h-7 rounded-full min-w-[40px]",
          getIconColor(status)
        )}
        onClick={onClick}
      >
        {icon}
      </Button>
      {showErrorReport && status === "error" && patientName && patientId && errorType && (
        <ErrorReportModal
          patientName={patientName}
          patientId={patientId}
          errorType={errorType}
        />
      )}
    </div>
  );
};

export function PatientsTable({
  patients,
  isLoading,
  onOpenPatientDetail,
}: PatientsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">
          Cargando pacientes...
        </div>
      </div>
    );
  }

  const handlePatientDetailClick = (patient: Patient) => {
    if (onOpenPatientDetail) {
      // Use Next.js router navigation to go to patient detail page
      window.location.href = `/dashboard/pacientes-on-time/${patient.id}`;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-center">Detalle</TableHead>
          <TableHead className="text-center">Cama</TableHead>
          <TableHead className="text-center">Identificación</TableHead>
          <TableHead>Paciente</TableHead>
          <TableHead className="text-center">Distribución</TableHead>
          <TableHead className="text-center">Devoluciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => (
          <TableRow key={patient.id}>
            <TableCell className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded"
                onClick={() => handlePatientDetailClick(patient)}
              >
                <FileText className="h-4 w-4 text-gray-600" />
              </Button>
            </TableCell>
            <TableCell className="text-center font-medium">
              {patient.cama}
            </TableCell>
            <TableCell className="text-center font-mono">
              {patient.identificacion}
            </TableCell>
            <TableCell className="font-medium">{patient.paciente}</TableCell>
                        <TableCell className="text-center">
              <div className="flex items-center justify-center gap-1">
                <StatusButton
                  icon={<Lock className="h-4 w-4" />}
                  status={
                    patient.distribución.status === "error"
                      ? "error"
                      : "completed"
                  }
                  onClick={() =>
                    console.log("Lock clicked for", patient.paciente)
                  }
                  showErrorReport={patient.distribución.status === "error"}
                  patientName={patient.paciente}
                  patientId={patient.id}
                  errorType="distribución"
                />
                <StatusButton
                  icon={<Scale className="h-4 w-4" />}
                  status={
                    patient.distribución.status === "completed"
                      ? "completed"
                      : "in_progress"
                  }
                  onClick={() =>
                    console.log("Scale clicked for", patient.paciente)
                  }
                  showErrorReport={patient.distribución.status === "error"}
                  patientName={patient.paciente}
                  patientId={patient.id}
                  errorType="distribución"
                />
                <StatusButton
                  icon={<Check className="h-4 w-4" />}
                  status={
                    patient.distribución.status === "completed"
                      ? "completed"
                      : "pending"
                  }
                  onClick={() =>
                    console.log("Check clicked for", patient.paciente)
                  }
                  showErrorReport={patient.distribución.status === "error"}
                  patientName={patient.paciente}
                  patientId={patient.id}
                  errorType="distribución"
                />
                <StatusButton
                  icon={<ShoppingCart className="h-4 w-4" />}
                  status={
                    patient.distribución.status === "completed"
                      ? "completed"
                      : "pending"
                  }
                  onClick={() =>
                    console.log("Cart clicked for", patient.paciente)
                  }
                  showErrorReport={patient.distribución.status === "error"}
                  patientName={patient.paciente}
                  patientId={patient.id}
                  errorType="distribución"
                />
              </div>
            </TableCell>
            <TableCell className="text-center">
              <StatusButton
                icon={<RotateCcw className="h-4 w-4" />}
                status={
                  patient.devoluciones.status === "completed"
                    ? "completed"
                    : "pending"
                  }
                onClick={() =>
                  console.log("Returns clicked for", patient.paciente)
                }
                showErrorReport={patient.devoluciones.status === "error"}
                patientName={patient.paciente}
                patientId={patient.id}
                errorType="devoluciones"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
