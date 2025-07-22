"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  ShoppingCart,
  RotateCcw,
  User,
  AlertTriangle,
  Lock,
  Scale,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function PatientDetailView({
  patientId,
}: PatientDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProcessTab>("dispensacion");
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Manual Returns state
  const [selectedFilterType, setSelectedFilterType] = useState<FilterType | "">(
    ""
  );
  const [userInput, setUserInput] = useState("");
  const [selectedCausa, setSelectedCausa] = useState("");
  const [selectedSuministro, setSelectedSuministro] = useState("");
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
  ];

  const suministrosOptions = [
    "Suministro suspendido",
    "Suministro rechazado por paciente",
    "Paciente dado de alta",
    "Paciente fallece",
    "Otros",
  ];

  const handleEmergencyReport = (stage: string) => {
    const message = `Error reportado en etapa: ${stage}`;
    setMessages((prev) => [...prev, message]);
    setIsEmergencyModalOpen(false);
  };

  const handleAddMessage = () => {
    if (newMessage.trim()) {
      setMessages((prev) => [...prev, newMessage.trim()]);
      setNewMessage("");
    }
  };

  const handleGenerateManualReturn = () => {
    let returnData = [];

    if (selectedFilterType === "usuario" && userInput) {
      returnData.push(`Usuario: ${userInput}`);
    }
    if (selectedFilterType === "causa_devolucion" && selectedCausa) {
      returnData.push(`Causa: ${selectedCausa}`);
    }
    if (selectedFilterType === "suministro") {
      if (selectedSuministro === "Otros" && suministroInput) {
        returnData.push(`Suministro: ${suministroInput}`);
      } else if (selectedSuministro) {
        returnData.push(`Suministro: ${selectedSuministro}`);
      }
    }

    if (returnData.length > 0) {
      const message = `Devolución Manual - ${returnData.join(", ")}`;
      setMessages((prev) => [...prev, message]);
      // Reset form
      setSelectedFilterType("");
      setUserInput("");
      setSelectedCausa("");
      setSelectedSuministro("");
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
          return "text-gray-400";
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
        >
          {step.icon}
        </Button>
        <span className="text-xs text-center font-medium">{step.name}</span>
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Header with Patient Basic Info */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
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
              <h1 className="text-xl font-semibold text-gray-900">
                {mockPatientData.name}
              </h1>
              <p className="text-sm text-gray-600">
                Cama: <span className="font-medium">{mockPatientData.bed}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
              onClick={() => setIsEmergencyModalOpen(true)}
            >
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar - Patient Details */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Detalles del paciente
            </h2>
          </div>

          {/* Patient Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 border-b pb-2">
                Información del paciente
              </h3>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Médico responsable
              </h4>
              <p className="text-xs text-blue-600 leading-relaxed">
                {mockPatientData.responsibleDoctor}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  Identificación
                </h4>
                <p className="text-xs text-blue-600">
                  {mockPatientData.identification}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Edad</h4>
                <p className="text-xs text-gray-600">{mockPatientData.age}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Sexo</h4>
                <p className="text-xs text-gray-600">{mockPatientData.sex}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  Fecha de ingreso
                </h4>
                <p className="text-xs text-gray-600">
                  {mockPatientData.admissionDate}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  Fecha de salida
                </h4>
                <p className="text-xs text-gray-600">
                  {mockPatientData.dischargeDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Process Tabs */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-2xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center",
                    activeTab === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
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
          <div className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">
                  {activeTab.replace("_", " ")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeTab === "devoluciones_manuales" ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-4">
                        Selecciona un filtro:
                      </h4>
                      <div className="flex items-center space-x-2 mb-4">
                        <Input
                          placeholder="Selecciona un filtro para comenzar..."
                          className="max-w-sm"
                          readOnly
                        />
                        <Select
                          value={selectedFilterType}
                          onValueChange={(value: FilterType) =>
                            setSelectedFilterType(value)
                          }
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

                      {/* Dynamic inputs based on filter type */}
                      {selectedFilterType === "usuario" && (
                        <div className="mb-4">
                          <Input
                            placeholder="Escribe el nombre del usuario"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            className="max-w-sm"
                          />
                        </div>
                      )}

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

                      {selectedFilterType === "suministro" && (
                        <div className="space-y-4">
                          <Select
                            value={selectedSuministro}
                            onValueChange={setSelectedSuministro}
                          >
                            <SelectTrigger className="max-w-sm">
                              <SelectValue placeholder="Selecciona una causa" />
                            </SelectTrigger>
                            <SelectContent>
                              {suministrosOptions.map((suministro) => (
                                <SelectItem key={suministro} value={suministro}>
                                  {suministro}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {selectedSuministro === "Otros" && (
                            <Input
                              placeholder="Escribe el suministro"
                              value={suministroInput}
                              onChange={(e) =>
                                setSuministroInput(e.target.value)
                              }
                              className="max-w-sm"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Messages Display */}
                    <div className="border border-gray-200 rounded-lg p-4 min-h-[120px]">
                      {messages.length > 0 ? (
                        <div className="space-y-2">
                          {messages.map((message, index) => (
                            <div
                              key={index}
                              className="text-sm text-gray-700 p-2 bg-gray-50 rounded"
                            >
                              {message}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <p>No hay devoluciones manuales disponibles.</p>
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
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-center space-x-8">
                      {processSteps[activeTab]?.map((step) =>
                        getProcessStepButton(step)
                      )}
                    </div>

                    {/* Messages Display */}
                    <div className="border border-gray-200 rounded-lg p-4 min-h-[120px]">
                      {messages.length > 0 ? (
                        <div className="space-y-2">
                          {messages.map((message, index) => (
                            <div
                              key={index}
                              className="text-sm text-gray-700 p-2 bg-gray-50 rounded"
                            >
                              {message}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <p>No hay mensajes disponibles.</p>
                        </div>
                      )}
                    </div>

                    {activeTab === "dispensacion" && (
                      <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <Input
                            placeholder="Mensaje de error"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleAddMessage}
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>
                    )}

                    {activeTab === "devoluciones" && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="Mensaje"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleAddMessage}
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Emergency Modal */}
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
