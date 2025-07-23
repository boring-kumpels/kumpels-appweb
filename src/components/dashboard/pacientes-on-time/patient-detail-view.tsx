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
import { ErrorReportModal } from "./error-report-modal";
import { useCurrentUser } from "@/hooks/use-current-user";

interface PatientDetailViewProps {
  patientId: string;
}

type ProcessTab =
  | "dispensacion"
  | "entrega"
  | "devoluciones"
  | "devoluciones_manuales";
type FilterType = "usuario" | "causa_devolucion" | "suministro";

interface ProcessStep {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "pending" | "in_progress" | "completed" | "error";
  description?: string;
}

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
  const [logEntries, setLogEntries] = useState<LogEntry[]>(initialLogEntries);
  const [newMessage, setNewMessage] = useState("");
  const [manualReturn, setManualReturn] = useState<ManualReturn | null>(null);

  // Manual Returns state
  const [selectedFilterType, setSelectedFilterType] = useState<FilterType | "">(
    ""
  );
  const [userInput, setUserInput] = useState("");
  const [selectedCausa, setSelectedCausa] = useState("");
  const [suministroInput, setSuministroInput] = useState("");

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
      {
        id: "entrega",
        name: "Entrega",
        icon: <ShoppingCart className="h-4 w-4" />,
        status: "pending" as const,
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

  const causasDevolucion = [
    "Cambio de vía de administración",
    "Cambio de forma farmacéutica",
    "Cambio de frecuencia de administración",
    "Cambio de dosis",
    "Equivocación en entrega de farmacia",
    "Suministro suspendido",
    "Suministro rechazado por paciente",
    "Paciente dado de alta",
    "Paciente fallece",
    "Otros",
  ];

  const handleEmergencyReport = (stage: string) => {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace("T", " ");

    const newEntry: LogEntry = {
      id: Date.now().toString(),
      timestamp,
      role: "PharmacyRegents",
      message: `Se ha producido un error en el proceso de ${stage.toLowerCase()}.`,
      type: "error",
      patientName: mockPatientData.name,
      patientId: mockPatientData.identification,
    };

    setLogEntries((prev) => [newEntry, ...prev]);
    setIsEmergencyModalOpen(false);
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

  const handleGenerateManualReturn = () => {
    const returnData = [];

    if (selectedFilterType === "usuario" && userInput) {
      returnData.push(`Usuario: ${userInput}`);
    }
    if (selectedFilterType === "causa_devolucion" && selectedCausa) {
      returnData.push(`Causa: ${selectedCausa}`);
    }
    if (selectedFilterType === "suministro" && suministroInput) {
      returnData.push(`Suministro: ${suministroInput}`);
    }

    if (returnData.length > 0) {
      // Create a new manual return with the form data
      const now = new Date();
      const creationDate = now.toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const approvalDate = new Date(now.getTime() + 65000).toLocaleString(
        "en-US",
        {
          month: "numeric",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }
      );

      const newManualReturn: ManualReturn = {
        id: Date.now().toString(),
        generatedBy: userInput || "Nurse",
        reviewedBy: "PharmacyRegents",
        creationDate,
        approvalDate,
        supplies: [
          {
            code: "f4f5644f-8732-4477-acd6-99e85fb78866",
            supplyCode: "1400740",
            supply:
              suministroInput ||
              "ABATACEPT 125MG/1ML SOL INYECTABLE SC JER PRELLENA* 1ML BRISTOL CJ *4U (ORENCIA)",
            quantityReturned: 1,
          },
        ],
        cause: selectedCausa || "Cambio de vía de administración",
        comments: "Comentario no proporcionado",
      };

      setManualReturn(newManualReturn);

      // Reset form
      setSelectedFilterType("");
      setUserInput("");
      setSelectedCausa("");
      setSuministroInput("");
    }
  };

  const getProcessStepButton = (step: ProcessStep) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "completed":
          return "text-green-500";
        case "in_progress":
          return "text-orange-500";
        case "pending":
          return "text-orange-500";
        case "error":
          return "text-red-500";
        default:
          return "text-muted-foreground";
      }
    };

    return (
      <div key={step.id} className="flex flex-col items-center space-y-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "bg-white border-gray-200 hover:bg-gray-50 px-4 py-2 h-12 rounded-full min-w-[80px]",
            getStatusColor(step.status)
          )}
          onClick={
            step.name === "Predespacho" || step.name === "Alistamiento"
              ? () => setIsEmergencyModalOpen(true)
              : undefined
          }
        >
          {step.icon}
        </Button>
        <span className="text-xs text-center font-medium">{step.name}</span>
      </div>
    );
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

  const ManualReturnDetails = ({
    returnData,
  }: {
    returnData: ManualReturn;
  }) => {
    return (
      <div className="space-y-6">
        {/* Return Status/Metadata */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-foreground">
              Generado por: {returnData.generatedBy} - Revisado por:{" "}
              {returnData.reviewedBy}
            </span>
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-1">
            <div>Fecha de creación: {returnData.creationDate}</div>
            <div>Fecha de aprobación: {returnData.approvalDate}</div>
          </div>
        </div>

        {/* Description of Supplies */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            Descripción de los suministros
          </h4>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-foreground">
                    Código
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-foreground">
                    Código suministro
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-foreground">
                    Suministro
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-foreground">
                    Cantidad devuelta
                  </th>
                </tr>
              </thead>
              <tbody>
                {returnData.supplies.map((supply, index) => (
                  <tr key={index} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground font-mono text-xs">
                      {supply.code}
                    </td>
                    <td className="px-3 py-2 text-foreground">
                      {supply.supplyCode}
                    </td>
                    <td className="px-3 py-2 text-foreground">
                      {supply.supply}
                    </td>
                    <td className="px-3 py-2 text-foreground">
                      {supply.quantityReturned}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Causes of Return */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Causas de la devolución
          </h4>
          <p className="text-sm text-foreground p-3 bg-muted rounded-lg">
            {returnData.cause}
          </p>
        </div>

        {/* Comments */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Comentarios</h4>
          <p className="text-sm text-foreground p-3 bg-muted rounded-lg">
            {returnData.comments}
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

      {/* Patient Details Card - Horizontal Layout */}
      <div className="px-6 py-4">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient Basic Info */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {mockPatientData.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Cama:{" "}
                    <span className="font-medium">{mockPatientData.bed}</span>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
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
                </div>
              </div>

              {/* Medical Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Médico responsable
                  </h4>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    {mockPatientData.responsibleDoctor}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-foreground mb-1">
                      Fecha de ingreso
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {mockPatientData.admissionDate}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-foreground mb-1">
                      Fecha de salida
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {mockPatientData.dischargeDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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

        {/* Content Area */}
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">
              {activeTab.replace("_", " ")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === "devoluciones_manuales" ? (
              <div className="space-y-6">
                {!manualReturn ? (
                  <>
                    <div>
                      <h4 className="text-sm font-medium mb-4">
                        Selecciona un filtro:
                      </h4>
                      <div className="flex items-center space-x-2 mb-4">
                        <Input
                          placeholder={
                            selectedFilterType === "usuario"
                              ? "Escribe el nombre del usuario"
                              : selectedFilterType === "suministro"
                                ? "Escribe el suministro"
                                : "Selecciona un filtro para comenzar..."
                          }
                          value={
                            selectedFilterType === "usuario"
                              ? userInput
                              : selectedFilterType === "suministro"
                                ? suministroInput
                                : ""
                          }
                          onChange={(e) => {
                            if (selectedFilterType === "usuario") {
                              setUserInput(e.target.value);
                            } else if (selectedFilterType === "suministro") {
                              setSuministroInput(e.target.value);
                            }
                          }}
                          className="max-w-sm"
                          readOnly={
                            !selectedFilterType ||
                            selectedFilterType === "causa_devolucion"
                          }
                        />
                        <Select
                          value={selectedFilterType}
                          onValueChange={(value: FilterType) => {
                            setSelectedFilterType(value);
                            // Reset all fields when changing filter type
                            setUserInput("");
                            setSelectedCausa("");
                            setSuministroInput("");
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="usuario">Usuario</SelectItem>
                            <SelectItem value="causa_devolucion">
                              Causa de la devolución
                            </SelectItem>
                            <SelectItem value="suministro">
                              Suministro
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">
                          😊
                        </Button>
                      </div>

                      {/* Causa dropdown when causa_devolucion is selected */}
                      {selectedFilterType === "causa_devolucion" && (
                        <div className="mb-4">
                          <Select
                            value={selectedCausa}
                            onValueChange={setSelectedCausa}
                          >
                            <SelectTrigger className="max-w-sm">
                              <SelectValue placeholder="Selecciona una causa" />
                            </SelectTrigger>
                            <SelectContent>
                              {causasDevolucion.map((causa) => (
                                <SelectItem key={causa} value={causa}>
                                  {causa}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleGenerateManualReturn}
                      >
                        Generar Devolución Manual
                      </Button>
                    </div>
                  </>
                ) : (
                  <ManualReturnDetails returnData={manualReturn} />
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center space-x-8">
                  {processSteps[activeTab]?.map((step) =>
                    getProcessStepButton(step)
                  )}
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
                {activeTab === "dispensacion" && profile?.role !== "NURSE" && (
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
                    <ErrorReportModal
                      patientName={mockPatientData.name}
                      patientId={mockPatientData.identification}
                      errorType="alistamiento"
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
                {activeTab === "devoluciones" && profile?.role === "NURSE" && (
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
                    <ErrorReportModal
                      patientName={mockPatientData.name}
                      patientId={mockPatientData.identification}
                      errorType="devolucion"
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

      {/* Emergency Modal - Now using the simplified ErrorReportModal */}
      <Dialog
        open={isEmergencyModalOpen}
        onOpenChange={setIsEmergencyModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecciona que etapa presenta un error</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2"
              onClick={() => handleEmergencyReport("Predespacho")}
            >
              <Lock className="h-5 w-5" />
              <span>Predespacho</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2"
              onClick={() => handleEmergencyReport("Alistamiento")}
            >
              <Scale className="h-5 w-5" />
              <span>Alistamiento</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
