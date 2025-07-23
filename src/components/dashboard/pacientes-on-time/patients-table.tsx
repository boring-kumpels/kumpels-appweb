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
import { Eye } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Patient } from "./pacientes-on-time-management";

interface PatientsTableProps {
  patients: Patient[];
  isLoading: boolean;
  onOpenPatientDetail?: (patient: Patient) => void;
}

interface StatusButtonProps {
  status: "ok" | "pending" | "in_progress" | "error";
  onClick?: () => void;
}

const StatusButton: React.FC<StatusButtonProps> = ({ status, onClick }) => {
  const getStatusDisplay = () => {
    switch (status) {
      case "ok":
        return { text: "OK", className: "bg-green-500 text-white" };
      case "pending":
        return { text: "Pend.", className: "bg-orange-500 text-white" };
      case "in_progress":
        return {
          text: "Curso",
          className:
            "bg-orange-500 text-white border-2 border-dashed border-orange-600",
        };
      case "error":
        return { text: "Error", className: "bg-red-500 text-white" };
      default:
        return { text: "--", className: "bg-gray-200 text-gray-500" };
    }
  };

  const { text, className } = getStatusDisplay();

  if (status === "pending" && text === "--") {
    return (
      <div className="flex items-center justify-center">
        <span className="text-gray-400">--</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className={`px-3 py-1 h-7 rounded-full min-w-[50px] text-xs font-medium ${className}`}
        onClick={onClick}
      >
        {text}
      </Button>
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
          <TableHead className="text-center">Servicio</TableHead>
          <TableHead className="text-center">Cama</TableHead>
          <TableHead className="text-center">Identificación</TableHead>
          <TableHead>Nombre del Paciente</TableHead>
          <TableHead className="text-center">Predespacho</TableHead>
          <TableHead className="text-center">Alistamiento</TableHead>
          <TableHead className="text-center">Validación</TableHead>
          <TableHead className="text-center">Entrega</TableHead>
          <TableHead className="text-center">Devolución</TableHead>
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
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
            <TableCell className="text-center font-medium">
              {patient.servicio}
            </TableCell>
            <TableCell className="text-center">{patient.cama}</TableCell>
            <TableCell className="text-center">
              {patient.identificacion}
            </TableCell>
            <TableCell>{patient.paciente}</TableCell>
            <TableCell className="text-center">
              <StatusButton status={patient.predespacho.status} />
            </TableCell>
            <TableCell className="text-center">
              <StatusButton status={patient.alistamiento.status} />
            </TableCell>
            <TableCell className="text-center">
              <Button
                variant="outline"
                size="sm"
                className="px-3 py-1 h-7 rounded-full min-w-[50px] text-xs font-medium bg-orange-50 text-orange-600 border-orange-200"
              >
                En Curso
              </Button>
            </TableCell>
            <TableCell className="text-center">
              <StatusButton status={patient.entrega.status} />
            </TableCell>
            <TableCell className="text-center">
              <StatusButton status={patient.devolucion.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
