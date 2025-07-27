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
import {
  PatientWithRelations,
  MedicationProcessStep,
  MedicationProcess,
  ProcessStatus,
} from "@/types/patient";
import { getLineDisplayName } from "@/lib/lines";
import { ProcessStatusButton } from "./process-status-button";
import { useAuth } from "@/providers/auth-provider";

interface PatientsTableProps {
  patients: PatientWithRelations[];
  isLoading: boolean;
  onOpenPatientDetail?: (patient: PatientWithRelations) => void;
  preloadedMedicationProcesses?: MedicationProcess[];
  currentDailyProcessId?: string;
  buttonStatesMap?: Map<string, Record<string, ProcessStatus | null>>;
  isButtonStatesReady?: boolean;
}

export function PatientsTable({
  patients,
  isLoading,
  onOpenPatientDetail,
  preloadedMedicationProcesses = [],
  currentDailyProcessId,
  buttonStatesMap,
  isButtonStatesReady = false,
}: PatientsTableProps) {
  const pathname = usePathname();
  const { profile } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">
          Cargando pacientes...
        </div>
      </div>
    );
  }

  const handlePatientDetailClick = (patient: PatientWithRelations) => {
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

  // Helper function to get preloaded process for a patient and step
  const getPreloadedProcess = (
    patientId: string,
    step: MedicationProcessStep
  ) => {
    return preloadedMedicationProcesses.find(
      (process) =>
        process.patientId === patientId &&
        process.step === step &&
        process.dailyProcessId === currentDailyProcessId
    );
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
              {patient.bed?.lineName
                ? getLineDisplayName(patient.bed.lineName)
                : "N/A"}
            </TableCell>
            <TableCell className="text-center">
              {patient.bed?.number || "N/A"}
            </TableCell>
            <TableCell className="text-center">{patient.externalId}</TableCell>
            <TableCell>{`${patient.firstName} ${patient.lastName}`}</TableCell>
            <TableCell className="text-center">
              <ProcessStatusButton
                patient={patient}
                step={MedicationProcessStep.PREDESPACHO}
                userRole={profile?.role || ""}
                preloadedProcess={getPreloadedProcess(
                  patient.id,
                  MedicationProcessStep.PREDESPACHO
                )}
                preCalculatedState={isButtonStatesReady ? buttonStatesMap?.get(patient.id)?.[MedicationProcessStep.PREDESPACHO] : undefined}
              />
            </TableCell>
            <TableCell className="text-center">
              <ProcessStatusButton
                patient={patient}
                step={MedicationProcessStep.ALISTAMIENTO}
                userRole={profile?.role || ""}
                preloadedProcess={getPreloadedProcess(
                  patient.id,
                  MedicationProcessStep.ALISTAMIENTO
                )}
                preCalculatedState={isButtonStatesReady ? buttonStatesMap?.get(patient.id)?.[MedicationProcessStep.ALISTAMIENTO] : undefined}
              />
            </TableCell>
            <TableCell className="text-center">
              <ProcessStatusButton
                patient={patient}
                step={MedicationProcessStep.VALIDACION}
                userRole={profile?.role || ""}
                preloadedProcess={getPreloadedProcess(
                  patient.id,
                  MedicationProcessStep.VALIDACION
                )}
                preCalculatedState={isButtonStatesReady ? buttonStatesMap?.get(patient.id)?.[MedicationProcessStep.VALIDACION] : undefined}
              />
            </TableCell>
            <TableCell className="text-center">
              <ProcessStatusButton
                patient={patient}
                step={MedicationProcessStep.ENTREGA}
                userRole={profile?.role || ""}
                preloadedProcess={getPreloadedProcess(
                  patient.id,
                  MedicationProcessStep.ENTREGA
                )}
                preCalculatedState={isButtonStatesReady ? buttonStatesMap?.get(patient.id)?.[MedicationProcessStep.ENTREGA] : undefined}
              />
            </TableCell>
            <TableCell className="text-center">
              <ProcessStatusButton
                patient={patient}
                step={MedicationProcessStep.DEVOLUCION}
                userRole={profile?.role || ""}
                preloadedProcess={getPreloadedProcess(
                  patient.id,
                  MedicationProcessStep.DEVOLUCION
                )}
                preCalculatedState={isButtonStatesReady ? buttonStatesMap?.get(patient.id)?.[MedicationProcessStep.DEVOLUCION] : undefined}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
