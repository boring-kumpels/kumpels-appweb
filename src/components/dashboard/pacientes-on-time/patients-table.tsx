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
import { ProcessStatusButton } from "./process-status-button";
import { QRScanRecord } from "./patient-detail-view";
import { useAuth } from "@/providers/auth-provider";

interface PatientsTableProps {
  patients: PatientWithRelations[];
  isLoading: boolean;
  onOpenPatientDetail?: (patient: PatientWithRelations) => void;
  preloadedMedicationProcesses?: MedicationProcess[];
  currentDailyProcessId?: string;
  buttonStatesMap?: Map<string, Record<string, ProcessStatus | null>>;
  isButtonStatesReady?: boolean;
  qrScanRecords?: QRScanRecord[];
}

export function PatientsTable({
  patients,
  isLoading,
  onOpenPatientDetail,
  preloadedMedicationProcesses = [],
  currentDailyProcessId,
  buttonStatesMap,
  isButtonStatesReady = false,
  qrScanRecords = [],
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

  const getPatientQRScanRecords = (patientId: string) => {
    return qrScanRecords.filter((record) => record.patientId === patientId);
  };

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center p-2 text-xs w-14">
              Detalle
            </TableHead>
            <TableHead className="text-center p-2 text-xs w-18">
              Línea
            </TableHead>
            <TableHead className="text-center p-2 text-xs w-20">
              Servicio
            </TableHead>
            <TableHead className="text-center p-2 text-xs w-14">Cama</TableHead>
            <TableHead className="text-center p-2 text-xs w-18">ID</TableHead>
            <TableHead className="p-2 text-xs w-28">Nombre</TableHead>
            <TableHead className="text-center p-2 text-xs w-18">
              Predespacho
            </TableHead>
            <TableHead className="text-center p-2 text-xs w-18">
              Alistamiento
            </TableHead>
            <TableHead className="text-center p-2 text-xs w-18">
              Validación
            </TableHead>
            <TableHead className="text-center p-2 text-xs w-18">
              Entrega
            </TableHead>
            <TableHead className="text-center p-2 text-xs w-18">
              Devolución
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="text-center p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-gray-200 hover:bg-gray-100 px-2 py-1 h-6 rounded-full min-w-[32px] text-gray-500"
                  onClick={() => handlePatientDetailClick(patient)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </TableCell>
              <TableCell className="text-center p-2 text-xs font-medium truncate">
                {patient.service?.line?.displayName || "N/A"}
              </TableCell>
              <TableCell className="text-center p-2 text-xs font-medium truncate">
                {patient.service?.name || "N/A"}
              </TableCell>
              <TableCell className="text-center p-2 text-xs">
                {patient.bed?.number || "N/A"}
              </TableCell>
              <TableCell className="text-center p-2 text-xs">
                {patient.externalId}
              </TableCell>
              <TableCell className="p-2 text-xs truncate">{`${patient.firstName} ${patient.lastName}`}</TableCell>
              <TableCell className="text-center p-2">
                <ProcessStatusButton
                  patient={patient}
                  step={MedicationProcessStep.PREDESPACHO}
                  userRole={profile?.role || ""}
                  preloadedProcess={getPreloadedProcess(
                    patient.id,
                    MedicationProcessStep.PREDESPACHO
                  )}
                  preCalculatedState={
                    isButtonStatesReady
                      ? buttonStatesMap?.get(patient.id)?.[
                          MedicationProcessStep.PREDESPACHO
                        ]
                      : undefined
                  }
                />
              </TableCell>
              <TableCell className="text-center p-2">
                <ProcessStatusButton
                  patient={patient}
                  step={MedicationProcessStep.ALISTAMIENTO}
                  userRole={profile?.role || ""}
                  preloadedProcess={getPreloadedProcess(
                    patient.id,
                    MedicationProcessStep.ALISTAMIENTO
                  )}
                  preCalculatedState={
                    isButtonStatesReady
                      ? buttonStatesMap?.get(patient.id)?.[
                          MedicationProcessStep.ALISTAMIENTO
                        ]
                      : undefined
                  }
                />
              </TableCell>
              <TableCell className="text-center p-2">
                <ProcessStatusButton
                  patient={patient}
                  step={MedicationProcessStep.VALIDACION}
                  userRole={profile?.role || ""}
                  preloadedProcess={getPreloadedProcess(
                    patient.id,
                    MedicationProcessStep.VALIDACION
                  )}
                  preCalculatedState={
                    isButtonStatesReady
                      ? buttonStatesMap?.get(patient.id)?.[
                          MedicationProcessStep.VALIDACION
                        ]
                      : undefined
                  }
                />
              </TableCell>
              <TableCell className="text-center p-2">
                <ProcessStatusButton
                  patient={patient}
                  step={MedicationProcessStep.ENTREGA}
                  userRole={profile?.role || ""}
                  preloadedProcess={getPreloadedProcess(
                    patient.id,
                    MedicationProcessStep.ENTREGA
                  )}
                  preCalculatedState={
                    isButtonStatesReady
                      ? buttonStatesMap?.get(patient.id)?.[
                          MedicationProcessStep.ENTREGA
                        ]
                      : undefined
                  }
                  qrScanRecords={getPatientQRScanRecords(patient.id)}
                />
              </TableCell>
              <TableCell className="text-center p-2">
                <ProcessStatusButton
                  patient={patient}
                  step={MedicationProcessStep.DEVOLUCION}
                  userRole={profile?.role || ""}
                  preloadedProcess={getPreloadedProcess(
                    patient.id,
                    MedicationProcessStep.DEVOLUCION
                  )}
                  preCalculatedState={
                    isButtonStatesReady
                      ? buttonStatesMap?.get(patient.id)?.[
                          MedicationProcessStep.DEVOLUCION
                        ]
                      : undefined
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
