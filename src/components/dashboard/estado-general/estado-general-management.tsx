"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessStage {
  id: string;
  name: string;
  status: "pendiente" | "ok" | "en_curso";
  metrics: {
    priority: string;
    startTime: string;
    endTime: string;
    hours: number;
    meetsCriteria: boolean;
  };
}

interface LineData {
  id: string;
  name: string;
  patientCount: number;
  showDetails: boolean;
  stages: ProcessStage[];
}

// Mock data for all lines with process stages and metrics
const linesData: LineData[] = [
  {
    id: "linea1",
    name: "Línea 1",
    patientCount: 15,
    showDetails: false,
    stages: [
      {
        id: "predespacho",
        name: "Predespacho",
        status: "ok",
        metrics: {
          priority: "Alta",
          startTime: "08:00",
          endTime: "09:30",
          hours: 1.5,
          meetsCriteria: true,
        },
      },
      {
        id: "alistamiento",
        name: "Alistamiento",
        status: "en_curso",
        metrics: {
          priority: "Intermedia",
          startTime: "09:30",
          endTime: "",
          hours: 0,
          meetsCriteria: false,
        },
      },
      {
        id: "validacion",
        name: "Validación",
        status: "pendiente",
        metrics: {
          priority: "Baja",
          startTime: "",
          endTime: "",
          hours: 0,
          meetsCriteria: false,
        },
      },
      {
        id: "entrega",
        name: "Entrega",
        status: "pendiente",
        metrics: {
          priority: "Intermedia",
          startTime: "",
          endTime: "",
          hours: 0,
          meetsCriteria: false,
        },
      },
      {
        id: "devolucion",
        name: "Devolución",
        status: "pendiente",
        metrics: {
          priority: "Baja",
          startTime: "",
          endTime: "",
          hours: 0,
          meetsCriteria: false,
        },
      },
    ],
  },
  {
    id: "linea2",
    name: "Línea 2",
    patientCount: 12,
    showDetails: false,
    stages: [
      {
        id: "predespacho",
        name: "Predespacho",
        status: "ok",
        metrics: {
          priority: "Alta",
          startTime: "07:45",
          endTime: "09:15",
          hours: 1.5,
          meetsCriteria: true,
        },
      },
      {
        id: "alistamiento",
        name: "Alistamiento",
        status: "ok",
        metrics: {
          priority: "Intermedia",
          startTime: "09:15",
          endTime: "10:45",
          hours: 1.5,
          meetsCriteria: true,
        },
      },
      {
        id: "validacion",
        name: "Validación",
        status: "en_curso",
        metrics: {
          priority: "Alta",
          startTime: "10:45",
          endTime: "",
          hours: 0.5,
          meetsCriteria: false,
        },
      },
      {
        id: "entrega",
        name: "Entrega",
        status: "pendiente",
        metrics: {
          priority: "Intermedia",
          startTime: "",
          endTime: "",
          hours: 0,
          meetsCriteria: false,
        },
      },
      {
        id: "devolucion",
        name: "Devolución",
        status: "pendiente",
        metrics: {
          priority: "Baja",
          startTime: "",
          endTime: "",
          hours: 0,
          meetsCriteria: false,
        },
      },
    ],
  },
  {
    id: "linea3",
    name: "Línea 3",
    patientCount: 8,
    showDetails: false,
    stages: [
      {
        id: "predespacho",
        name: "Predespacho",
        status: "pendiente",
        metrics: {
          priority: "Baja",
          startTime: "",
          endTime: "",
          hours: 0,
          meetsCriteria: false,
        },
      },
      {
        id: "alistamiento",
        name: "Alistamiento",
        status: "pendiente",
        metrics: {
          priority: "Baja",
          startTime: "",
          endTime: "",
          hours: 0,
          meetsCriteria: false,
        },
      },
      {
        id: "validacion",
        name: "Validación",
        status: "pendiente",
        metrics: {
          priority: "Baja",
          startTime: "",
          endTime: "",
          hours: 0,
          meetsCriteria: false,
        },
      },
      {
        id: "entrega",
        name: "Entrega",
        status: "pendiente",
        metrics: {
          priority: "Baja",
          startTime: "",
          endTime: "",
          hours: 0,
          meetsCriteria: false,
        },
      },
      {
        id: "devolucion",
        name: "Devolución",
        status: "pendiente",
        metrics: {
          priority: "Baja",
          startTime: "",
          endTime: "",
          hours: 0,
          meetsCriteria: false,
        },
      },
    ],
  },
  {
    id: "linea4",
    name: "Línea 4",
    patientCount: 20,
    showDetails: false,
    stages: [
      {
        id: "predespacho",
        name: "Predespacho",
        status: "ok",
        metrics: {
          priority: "Alta",
          startTime: "08:30",
          endTime: "10:00",
          hours: 1.5,
          meetsCriteria: true,
        },
      },
      {
        id: "alistamiento",
        name: "Alistamiento",
        status: "ok",
        metrics: {
          priority: "Alta",
          startTime: "10:00",
          endTime: "11:30",
          hours: 1.5,
          meetsCriteria: true,
        },
      },
      {
        id: "validacion",
        name: "Validación",
        status: "ok",
        metrics: {
          priority: "Intermedia",
          startTime: "11:30",
          endTime: "12:30",
          hours: 1,
          meetsCriteria: true,
        },
      },
      {
        id: "entrega",
        name: "Entrega",
        status: "en_curso",
        metrics: {
          priority: "Alta",
          startTime: "12:30",
          endTime: "",
          hours: 0.5,
          meetsCriteria: false,
        },
      },
      {
        id: "devolucion",
        name: "Devolución",
        status: "pendiente",
        metrics: {
          priority: "Baja",
          startTime: "",
          endTime: "",
          hours: 0,
          meetsCriteria: false,
        },
      },
    ],
  },
  {
    id: "linea5",
    name: "UCIS",
    patientCount: 18,
    showDetails: false,
    stages: [
      {
        id: "predespacho",
        name: "Predespacho",
        status: "ok",
        metrics: {
          priority: "Alta",
          startTime: "07:00",
          endTime: "08:30",
          hours: 1.5,
          meetsCriteria: true,
        },
      },
      {
        id: "alistamiento",
        name: "Alistamiento",
        status: "ok",
        metrics: {
          priority: "Alta",
          startTime: "08:30",
          endTime: "10:00",
          hours: 1.5,
          meetsCriteria: true,
        },
      },
      {
        id: "validacion",
        name: "Validación",
        status: "ok",
        metrics: {
          priority: "Alta",
          startTime: "10:00",
          endTime: "11:00",
          hours: 1,
          meetsCriteria: true,
        },
      },
      {
        id: "entrega",
        name: "Entrega",
        status: "ok",
        metrics: {
          priority: "Alta",
          startTime: "11:00",
          endTime: "12:00",
          hours: 1,
          meetsCriteria: true,
        },
      },
      {
        id: "devolucion",
        name: "Devolución",
        status: "en_curso",
        metrics: {
          priority: "Intermedia",
          startTime: "12:00",
          endTime: "",
          hours: 0.5,
          meetsCriteria: false,
        },
      },
    ],
  },
];

const ProcessStageCard: React.FC<{ stage: ProcessStage }> = ({ stage }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusButton = () => {
    const baseClasses = "px-3 py-1 rounded-md text-xs font-medium";

    switch (stage.status) {
      case "ok":
        return (
          <div className={cn(baseClasses, "bg-green-500 text-white")}>OK</div>
        );
      case "en_curso":
        return (
          <div
            className={cn(
              baseClasses,
              "bg-white text-orange-500 border-2 border-dashed border-orange-500"
            )}
          >
            En Curso
          </div>
        );
      case "pendiente":
        return (
          <div className={cn(baseClasses, "bg-orange-500 text-white")}>
            Pendiente
          </div>
        );
    }
  };

  const getPriorityIcon = () => {
    switch (stage.metrics.priority) {
      case "Alta":
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      case "Intermedia":
        return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
      case "Baja":
        return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
    }
  };

  return (
    <div className="relative">
      <div
        className="flex flex-col items-center space-y-2 p-3 bg-white rounded-lg border border-gray-200 w-full cursor-pointer hover:shadow-md transition-shadow"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center space-x-1">
          {getPriorityIcon()}
          <span className="text-xs text-gray-600">
            {stage.metrics.priority}
          </span>
        </div>
        {getStatusButton()}
        <div className="text-sm font-medium text-gray-900 text-center">
          {stage.name}
        </div>
        <div className="text-xs text-gray-500">
          {stage.metrics.hours > 0 ? `${stage.metrics.hours}h` : "0h"}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[180px]">
          <div className="flex items-center space-x-2 mb-2">
            {getPriorityIcon()}
            <span className="text-sm font-medium">
              {stage.metrics.priority}
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div>
              <strong>Inicio:</strong>{" "}
              {stage.metrics.startTime || "No iniciado"}
            </div>
            <div>
              <strong>Fin:</strong> {stage.metrics.endTime || "En proceso"}
            </div>
            <div>
              <strong>Horas:</strong> {stage.metrics.hours}
            </div>
            <div className="flex items-center space-x-1">
              <strong>Cumple criterio:</strong>
              {stage.metrics.meetsCriteria ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
            </div>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
        </div>
      )}
    </div>
  );
};

const LineSection: React.FC<{
  line: LineData;
  onToggleDetails: (lineId: string) => void;
}> = ({ line, onToggleDetails }) => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{line.name}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleDetails(line.id)}
            className="flex items-center space-x-2"
          >
            {line.showDetails ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Ocultar Detalles</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Ver Detalles</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Process Stages - All displayed horizontally */}
        <div className="grid grid-cols-5 gap-3 pb-2">
          {line.stages.map((stage) => (
            <ProcessStageCard key={stage.id} stage={stage} />
          ))}
        </div>

        {/* Details Section - Optimized Layout */}
        {line.showDetails && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {line.stages.map((stage) => (
                <Card
                  key={stage.id}
                  className="p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="space-y-3">
                    {/* Header with priority and stage name */}
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm text-gray-900">
                        {stage.name}
                      </h5>
                      <div className="flex items-center space-x-1">
                        {stage.metrics.priority === "Alta" && (
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        )}
                        {stage.metrics.priority === "Intermedia" && (
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        )}
                        {stage.metrics.priority === "Baja" && (
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        )}
                        <span className="text-xs text-gray-600">
                          {stage.metrics.priority}
                        </span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex justify-start">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          stage.status === "ok" &&
                            "bg-green-100 text-green-700",
                          stage.status === "en_curso" &&
                            "bg-orange-100 text-orange-700",
                          stage.status === "pendiente" &&
                            "bg-gray-100 text-gray-700"
                        )}
                      >
                        {stage.status === "ok" && "Completado"}
                        {stage.status === "en_curso" && "En Curso"}
                        {stage.status === "pendiente" && "Pendiente"}
                      </span>
                    </div>

                    {/* Time information in a compact grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Inicio:</span>
                        <div className="font-medium">
                          {stage.metrics.startTime || "No iniciado"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Fin:</span>
                        <div className="font-medium">
                          {stage.metrics.endTime || "En proceso"}
                        </div>
                      </div>
                    </div>

                    {/* Duration and criteria in one line */}
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-gray-500">Duración:</span>
                        <span className="font-medium ml-1">
                          {stage.metrics.hours}h
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {stage.metrics.meetsCriteria ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-gray-500">Criterio</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function EstadoGeneralManagement() {
  const [lines] = useState<LineData[]>(linesData);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>(
    {}
  );

  const handleToggleDetails = (lineId: string) => {
    setShowDetails((prev) => ({
      ...prev,
      [lineId]: !prev[lineId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Estado General de Líneas
        </h1>
        <p className="text-gray-600">
          Monitoreo en tiempo real de todas las líneas hospitalarias
        </p>
      </div>

      {/* Line Sections */}
      <div className="space-y-6">
        {lines.map((line) => (
          <LineSection
            key={line.id}
            line={{
              ...line,
              showDetails: showDetails[line.id] || false,
            }}
            onToggleDetails={handleToggleDetails}
          />
        ))}
      </div>
    </div>
  );
}
