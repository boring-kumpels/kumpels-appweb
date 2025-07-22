"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Patient } from "./pacientes-on-time-management";

interface PatientsTableProps {
  patients: Patient[];
  isLoading: boolean;
}

interface StatusIndicatorProps {
  status: "pending" | "in_progress" | "completed" | "error";
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-yellow-500";
      case "pending":
        return "bg-orange-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado";
      case "in_progress":
        return "En curso";
      case "pending":
        return "Pendiente";
      case "error":
        return "Error";
      default:
        return "Vacío";
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium",
          getStatusColor(status)
        )}
        title={getStatusLabel(status)}
      >
        {status === "completed" && "✓"}
        {status === "error" && "!"}
        {status === "in_progress" && "..."}
        {status === "pending" && "•"}
      </div>
    </div>
  );
};

export function PatientsTable({ patients, isLoading }: PatientsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">
          Cargando pacientes...
        </div>
      </div>
    );
  }

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
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-center font-medium">
              {patient.cama}
            </TableCell>
            <TableCell className="text-center font-mono">
              {patient.identificacion}
            </TableCell>
            <TableCell className="font-medium">{patient.paciente}</TableCell>
            <TableCell className="text-center">
              <StatusIndicator status={patient.distribución.status} />
            </TableCell>
            <TableCell className="text-center">
              <StatusIndicator status={patient.devoluciones.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
