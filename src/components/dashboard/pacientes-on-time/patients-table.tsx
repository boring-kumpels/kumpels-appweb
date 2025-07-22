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
import {
  Lock,
  Scale,
  Check,
  ShoppingCart,
  RotateCcw,
  FileText,
} from "lucide-react";
import { usePathname } from "next/navigation";
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
  isDistributionColumn?: boolean;
}

const StatusButton: React.FC<StatusButtonProps> = ({
  icon,
  status,
  onClick,
  showErrorReport = false,
  patientName,
  patientId,
  errorType,
  isDistributionColumn = false,
}) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className="bg-white border-gray-200 hover:bg-gray-100 px-3 py-1 h-7 rounded-full min-w-[40px] text-gray-500"
        onClick={onClick}
      >
        {icon}
      </Button>
      {showErrorReport &&
        status === "error" &&
        patientName &&
        patientId &&
        errorType &&
        !isDistributionColumn && (
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
  const pathname = usePathname();

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
      // Determine the base path based on current route
      let basePath = "/dashboard/pacientes-on-time";

      if (pathname.includes("/nurse/")) {
        basePath = "/nurse/pacientes-on-time";
      } else if (pathname.includes("/pharmacy/")) {
        basePath = "/pharmacy/pacientes-on-time";
      } else if (pathname.includes("/regent/")) {
        basePath = "/regent/pacientes-on-time";
      }

      window.location.href = `${basePath}/${patient.id}`;
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
                variant="outline"
                size="sm"
                className="bg-white border-gray-200 hover:bg-gray-100 px-3 py-1 h-7 rounded-full min-w-[40px] text-gray-500"
                onClick={() => handlePatientDetailClick(patient)}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TableCell>
            <TableCell className="text-center">{patient.cama}</TableCell>
            <TableCell className="text-center">
              {patient.identificacion}
            </TableCell>
            <TableCell>{patient.paciente}</TableCell>
            <TableCell className="text-center">
              <div className="flex justify-center space-x-2">
                <StatusButton
                  icon={<Lock className="h-4 w-4" />}
                  status={patient.distribución.status}
                  showErrorReport
                  patientName={patient.paciente}
                  patientId={patient.id}
                  errorType="distribución"
                  isDistributionColumn
                />
                <StatusButton
                  icon={<Scale className="h-4 w-4" />}
                  status={patient.distribución.status}
                  showErrorReport
                  patientName={patient.paciente}
                  patientId={patient.id}
                  errorType="distribución"
                  isDistributionColumn
                />
                <StatusButton
                  icon={<Check className="h-4 w-4" />}
                  status={patient.distribución.status}
                  showErrorReport
                  patientName={patient.paciente}
                  patientId={patient.id}
                  errorType="distribución"
                  isDistributionColumn
                />
                <StatusButton
                  icon={<ShoppingCart className="h-4 w-4" />}
                  status={patient.distribución.status}
                  showErrorReport
                  patientName={patient.paciente}
                  patientId={patient.id}
                  errorType="distribución"
                  isDistributionColumn
                />
                <StatusButton
                  icon={<RotateCcw className="h-4 w-4" />}
                  status={patient.distribución.status}
                  showErrorReport
                  patientName={patient.paciente}
                  patientId={patient.id}
                  errorType="distribución"
                  isDistributionColumn
                />
              </div>
            </TableCell>
            <TableCell className="text-center">
              <StatusButton
                icon={<RotateCcw className="h-4 w-4" />}
                status={patient.devoluciones.status}
                showErrorReport
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
