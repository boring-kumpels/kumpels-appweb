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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Bed, User, Hash } from "lucide-react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();

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

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        {patients.map((patient) => (
          <Card key={patient.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">
                      {patient.firstName} {patient.lastName}
                    </span>
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      <Hash className="h-3 w-3 mr-1" />
                      {patient.externalId}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Bed className="h-3 w-3 mr-1" />
                      {patient.bed?.number || "N/A"}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-gray-200 hover:bg-gray-100 px-2 py-1 h-8 rounded-full min-w-[32px] text-gray-500 flex-shrink-0"
                  onClick={() => handlePatientDetailClick(patient)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {patient.service?.line?.displayName || "N/A"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {patient.service?.name || "N/A"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Predespacho
                  </div>
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
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Alistamiento
                  </div>
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
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Validación
                  </div>
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
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Entrega
                  </div>
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
                </div>
                <div className="space-y-2 col-span-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Devolución
                  </div>
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop Table View
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
