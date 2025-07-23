"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  ShoppingCart,
  RotateCcw,
  User,
  Lock,
  Scale,
  Check,
  AlertTriangle,
  Send,
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
import { useCurrentUser } from "@/hooks/use-current-user";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface PatientDetailViewProps {
  patientId: string;
}

type ProcessTab =
  | "dispensacion"
  | "entrega"
  | "devoluciones"
  | "devoluciones_manuales";

interface LogEntry {
  id: string;
  timestamp: string;
  role: string;
  message: string;
  type: "error" | "info" | "warning";
  patientName: string;
  patientId: string;
}

interface ManualReturn {
  id: string;
  generatedBy: string;
  reviewedBy: string;
  creationDate: string;
  approvalDate: string;
  supplies: {
    code: string;
    supplyCode: string;
    supply: string;
    quantityReturned: number;
  }[];
  cause: string;
  comments: string;
}

const mockPatientData = {
  id: "1",
  name: "JESUS PEREZ",
  bed: "PC01",
  identification: "123123123",
  age: 30,
  sex: "Sin datos",
  admissionDate: "2025-06-21",
  dischargeDate: "Sin datos",
  responsibleDoctor:
    "FIDEICOMISO PATRIMONIOS AUTONOMOS FIDUCIARIA LA PREVISORA S",
};

// Mock log entries based on the image
const initialLogEntries: LogEntry[] = [
  {
    id: "1",
    timestamp: "2025-07-22 07:11:59",
    role: "PharmacyRegents",
    message: "Se ha producido un error en el proceso de predespacho.",
    type: "error",
    patientName: "JESUS PEREZ",
    patientId: "1231231231",
  },
  {
    id: "2",
    timestamp: "2025-07-22 07:21:32",
    role: "PharmacyRegents",
    message: "Se ha producido un error en el proceso de alistamiento.",
    type: "error",
    patientName: "JESUS PEREZ",
    patientId: "1231231231",
  },
  {
    id: "3",
    timestamp: "2025-07-22 09:39:45",
    role: "SUPERUSER",
    message: "que paso",
    type: "info",
    patientName: "JESUS PEREZ",
    patientId: "1231231231",
  },
];

// Mock manual return data based on the image
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockManualReturn: ManualReturn = {
  id: "1",
  generatedBy: "Nurse",
  reviewedBy: "PharmacyRegents",
  creationDate: "7/21/2025, 10:13:36 PM",
  approvalDate: "7/21/2025, 10:14:41 PM",
  supplies: [
    {
      code: "f4f5644f-8732-4477-acd6-99e85fb78866",
      supplyCode: "1400740",
      supply:
        "ABATACEPT 125MG/1ML SOL INYECTABLE SC JER PRELLENA* 1ML BRISTOL CJ *4U (ORENCIA)",
      quantityReturned: 1,
    },
  ],
  cause: "Cambio de vía de administración",
  comments: "Comentario no proporcionado",
};

export default function PatientDetailView({}: PatientDetailViewProps) {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<ProcessTab>("dispensacion");
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isManualReturnModalOpen, setIsManualReturnModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>(initialLogEntries);
  const [newMessage, setNewMessage] = useState("");
  const [manualReturn, setManualReturn] = useState<ManualReturn | null>(null);

  // Manual Returns state

  // New Manual Return Modal State
  const [selectedSupply, setSelectedSupply] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  // Export Modal State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState("Todos los usuarios");
  const [selectedExportCause, setSelectedExportCause] =
    useState("Todas las causas");

  const processSteps = {
    dispensacion: [
      {
        id: "predespacho",
        name: "Predespacho",
        icon: <Lock className="h-4 w-4" />,
        status: "completed" as const,
      },
      {
        id: "alistamiento",
        name: "Alistamiento",
        icon: <Scale className="h-4 w-4" />,
        status: "completed" as const,
      },
      {
        id: "validacion",
        name: "Validación",
        icon: <Check className="h-4 w-4" />,
        status: "completed" as const,
      },
    ],
    entrega: [
      {
        id: "salida_farmacia",
        name: "Salida de farmacia",
        icon: <ShoppingCart className="h-4 w-4" />,
        status: "completed" as const,
      },
      {
        id: "llegada_piso",
        name: "Llegada a piso",
        icon: <ShoppingCart className="h-4 w-4" />,
        status: "pending" as const,
      },
      {
        id: "recepcion_enfermeria",
        name: "Recepción enfermería",
        icon: <User className="h-4 w-4" />,
        status: "pending" as const,
      },
    ],
    devoluciones: [
      {
        id: "solicitud_enfermeria",
        name: "Solicitud enfermería",
        icon: <User className="h-4 w-4" />,
        status: "pending" as const,
      },
      {
        id: "llegada_piso",
        name: "Llegada a piso",
        icon: <RotateCcw className="h-4 w-4" />,
        status: "pending" as const,
      },
      {
        id: "recepcion_farmacia",
        name: "Recepción farmacia",
        icon: <User className="h-4 w-4" />,
        status: "pending" as const,
      },
    ],
    devoluciones_manuales: [],
  };

  const handleAddMessage = () => {
    if (newMessage.trim()) {
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace("T", " ");

      const newEntry: LogEntry = {
        id: Date.now().toString(),
        timestamp,
        role: "SUPERUSER",
        message: newMessage.trim(),
        type: "info",
        patientName: mockPatientData.name,
        patientId: mockPatientData.identification,
      };

      setLogEntries((prev) => [newEntry, ...prev]);
      setNewMessage("");
    }
  };

  const LogEntryComponent = ({ entry }: { entry: LogEntry }) => {
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
      name: "Devoluciones Manuales",
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
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.name}</span>
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
                          Generar Devolución Manual
                        </Button>
                      </div>
                    </div>

                    {/* Subtitle */}
                    <p className="text-sm text-muted-foreground">
                      Devoluciones Manuales Registradas
                    </p>

                    {/* Manual Return Card */}
                    {manualReturn ? (
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">
                                  {manualReturn.supplies[0]?.supply ||
                                    "Omeprazol 20mg"}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                                    Cantidad:{" "}
                                    {manualReturn.supplies[0]
                                      ?.quantityReturned || 1}
                                  </span>
                                  <svg
                                    className="h-4 w-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </div>
                              </div>

                              <div className="space-y-2 mb-4">
                                <p className="text-sm">
                                  <span className="font-medium">Causas:</span>{" "}
                                  {manualReturn.cause}
                                </p>
                                <p className="text-sm">
                                  <span className="font-medium">
                                    Comentario:
                                  </span>{" "}
                                  {manualReturn.comments}
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
                                    {manualReturn.creationDate} -{" "}
                                    {manualReturn.generatedBy}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                                    En espera de aceptación por Farmacia
                                  </span>
                                  <Button
                                    size="sm"
                                    className="bg-green-500 hover:bg-green-600"
                                  >
                                    <svg
                                      className="h-4 w-4 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    Aprobar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500 text-red-500 hover:bg-red-50"
                                  >
                                    <svg
                                      className="h-4 w-4 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                    Rechazar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No hay devoluciones manuales registradas.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Process Steps with States */}
                    <div className="grid grid-cols-3 gap-4">
                      {processSteps[activeTab]?.map((step) => {
                        const getStatusDisplay = (status: string) => {
                          switch (status) {
                            case "completed":
                              return {
                                text: "Completed (Ok)",
                                className: "bg-green-500 text-white",
                              };
                            case "in_progress":
                              return {
                                text: "In Progress",
                                className: "bg-orange-500 text-white",
                              };
                            case "pending":
                              return {
                                text: "Pending",
                                className: "bg-orange-500 text-white",
                              };
                            case "error":
                              return {
                                text: "Error",
                                className: "bg-red-500 text-white",
                              };
                            default:
                              return {
                                text: "Pending",
                                className: "bg-orange-500 text-white",
                              };
                          }
                        };

                        const { text, className } = getStatusDisplay(
                          step.status
                        );

                        return (
                          <div key={step.id} className="text-center space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">
                              {step.name}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`px-4 py-2 h-12 rounded-full min-w-[120px] text-xs font-medium ${className}`}
                            >
                              {text}
                            </Button>
                          </div>
                        );
                      })}
                    </div>

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
                  {mockPatientData.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Cama:{" "}
                  <span className="font-medium">{mockPatientData.bed}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-1">
                    Identificación
                  </h4>
                  <p className="text-xs text-blue-600">
                    {mockPatientData.identification}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-1">
                    Edad
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {mockPatientData.age}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-1">
                    Sexo
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {mockPatientData.sex}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-1">
                    Fecha de ingreso
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {mockPatientData.admissionDate}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Médico responsable
                </h4>
                <p className="text-xs text-blue-600 leading-relaxed">
                  {mockPatientData.responsibleDoctor}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Emergency Modal - Now using the simplified ErrorReportModal */}
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
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="predespacho">Predespacho</SelectItem>
                  <SelectItem value="alistamiento">Alistamiento</SelectItem>
                  <SelectItem value="validacion">Validación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Descripción del error
              </label>
              <textarea
                placeholder="Describe el error encontrado..."
                className="w-full min-h-[100px] p-3 border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsEmergencyModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setIsEmergencyModalOpen(false);
                // Handle error reporting logic here
              }}
            >
              Reportar Error
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Return Modal */}
      <Dialog
        open={isManualReturnModalOpen}
        onOpenChange={setIsManualReturnModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Devolución Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Suministro
              </label>
              <Select value={selectedSupply} onValueChange={setSelectedSupply}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar suministro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="omeprazol">Omeprazol 20mg</SelectItem>
                  <SelectItem value="paracetamol">Paracetamol 500mg</SelectItem>
                  <SelectItem value="ibuprofeno">Ibuprofeno 400mg</SelectItem>
                  <SelectItem value="amoxicilina">Amoxicilina 500mg</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Cantidad
              </label>
              <Input
                placeholder="Cantidad a devolver"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Causa de devolución (selección múltiple)
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[
                  "Suspensión médica",
                  "Reacción adversa",
                  "Dosis incorrecta",
                  "Medicamento vencido",
                  "Error de dispensación",
                ].map((cause) => (
                  <div key={cause} className="flex items-center space-x-2">
                    <Checkbox
                      id={cause}
                      checked={selectedCauses.includes(cause)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCauses([...selectedCauses, cause]);
                        } else {
                          setSelectedCauses(
                            selectedCauses.filter((c) => c !== cause)
                          );
                        }
                      }}
                    />
                    <label htmlFor={cause} className="text-sm text-foreground">
                      {cause}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Comentario
              </label>
              <Textarea
                placeholder="Comentario adicional..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsManualReturnModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                // Create manual return logic here
                const newReturn: ManualReturn = {
                  id: Date.now().toString(),
                  generatedBy: "Usuario Actual",
                  reviewedBy: "PharmacyRegents",
                  creationDate: new Date().toLocaleString(),
                  approvalDate: "",
                  supplies: [
                    {
                      code: "temp-code",
                      supplyCode: "temp-supply",
                      supply: selectedSupply || "Omeprazol 20mg",
                      quantityReturned: parseInt(quantity) || 1,
                    },
                  ],
                  cause: selectedCauses.join(", "),
                  comments: comment,
                };
                setManualReturn(newReturn);
                setIsManualReturnModalOpen(false);
                // Reset form
                setSelectedSupply("");
                setQuantity("");
                setSelectedCauses([]);
                setComment("");
              }}
            >
              Crear Devolución
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <svg
                className="h-5 w-5"
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
              <span>Exportar Consolidado de Devoluciones Manuales</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Rango de Fechas
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Fecha Inicio
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="mm/dd/yyyy"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <svg
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Fecha Fin
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="mm/dd/yyyy"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                      <svg
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Medicamentos Devueltos
                </h4>
                <div className="space-y-2">
                  {[
                    "Paracetamol",
                    "Ibuprofeno",
                    "Amoxicilina",
                    "Omeprazol",
                    "Loratadina",
                  ].map((med) => (
                    <div key={med} className="flex items-center space-x-2">
                      <Checkbox
                        id={med}
                        checked={selectedMedications.includes(med)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMedications([
                              ...selectedMedications,
                              med,
                            ]);
                          } else {
                            setSelectedMedications(
                              selectedMedications.filter((m) => m !== med)
                            );
                          }
                        }}
                      />
                      <label htmlFor={med} className="text-sm text-foreground">
                        {med}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Usuario que Generó o Aceptó
                </label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos los usuarios">
                      Todos los usuarios
                    </SelectItem>
                    <SelectItem value="Usuario 1">Usuario 1</SelectItem>
                    <SelectItem value="Usuario 2">Usuario 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Causa de Devolución
                </label>
                <Select
                  value={selectedExportCause}
                  onValueChange={setSelectedExportCause}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas las causas">
                      Todas las causas
                    </SelectItem>
                    <SelectItem value="Suspensión médica">
                      Suspensión médica
                    </SelectItem>
                    <SelectItem value="Reacción adversa">
                      Reacción adversa
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSelectedMedications([]);
                setSelectedUser("Todos los usuarios");
                setSelectedExportCause("Todas las causas");
              }}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Limpiar Filtros
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsExportModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // Handle export logic here
                  setIsExportModalOpen(false);
                }}
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
                Exportar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
