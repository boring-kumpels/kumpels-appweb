"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Scale, Check, ShoppingCart, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessStep {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "pending" | "in_progress" | "completed" | "error";
}

interface LineData {
  id: string;
  name: string;
  steps: ProcessStep[];
}

interface ConnectionInfo {
  intermedia: number;
  inicio: number;
  fin: number;
  horas: number;
  cumpleCriterios: boolean;
}

// Mock data for connection information (based on the popup image)
const getConnectionInfo = (
  lineId: string,
  stepIndex: number
): ConnectionInfo => {
  // This would normally come from your API/database
  const baseData = {
    intermedia: 0,
    inicio: 0,
    fin: 0,
    horas: 0,
    cumpleCriterios: true,
  };

  // Different data for different lines and connections
  switch (lineId) {
    case "linea1":
      return {
        intermedia: stepIndex + 1,
        inicio: stepIndex * 2,
        fin: (stepIndex + 1) * 2,
        horas: stepIndex + 2,
        cumpleCriterios: stepIndex % 2 === 0,
      };
    case "linea2":
      return {
        intermedia: stepIndex + 2,
        inicio: stepIndex * 3,
        fin: (stepIndex + 1) * 3,
        horas: stepIndex + 3,
        cumpleCriterios: stepIndex % 3 === 0,
      };
    default:
      return {
        ...baseData,
        intermedia: stepIndex,
        horas: stepIndex + 1,
        cumpleCriterios: stepIndex % 2 === 1,
      };
  }
};

// Mock data with all steps as pending by default
const linesData: LineData[] = [
  {
    id: "linea1",
    name: "línea 1",
    steps: [
      {
        id: "predespacho",
        name: "Predespacho",
        icon: <Lock className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "alistamiento",
        name: "Alistamiento",
        icon: <Scale className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "validacion",
        name: "Validación",
        icon: <Check className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "entrega",
        name: "Entrega",
        icon: <ShoppingCart className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "devoluciones",
        name: "Devoluciones",
        icon: <RotateCcw className="h-4 w-4" />,
        status: "pending",
      },
    ],
  },
  {
    id: "linea2",
    name: "línea 2",
    steps: [
      {
        id: "predespacho",
        name: "Predespacho",
        icon: <Lock className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "alistamiento",
        name: "Alistamiento",
        icon: <Scale className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "validacion",
        name: "Validación",
        icon: <Check className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "entrega",
        name: "Entrega",
        icon: <ShoppingCart className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "devoluciones",
        name: "Devoluciones",
        icon: <RotateCcw className="h-4 w-4" />,
        status: "pending",
      },
    ],
  },
  {
    id: "linea3",
    name: "línea 3",
    steps: [
      {
        id: "predespacho",
        name: "Predespacho",
        icon: <Lock className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "alistamiento",
        name: "Alistamiento",
        icon: <Scale className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "validacion",
        name: "Validación",
        icon: <Check className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "entrega",
        name: "Entrega",
        icon: <ShoppingCart className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "devoluciones",
        name: "Devoluciones",
        icon: <RotateCcw className="h-4 w-4" />,
        status: "pending",
      },
    ],
  },
  {
    id: "linea4",
    name: "línea 4",
    steps: [
      {
        id: "predespacho",
        name: "Predespacho",
        icon: <Lock className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "alistamiento",
        name: "Alistamiento",
        icon: <Scale className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "validacion",
        name: "Validación",
        icon: <Check className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "entrega",
        name: "Entrega",
        icon: <ShoppingCart className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "devoluciones",
        name: "Devoluciones",
        icon: <RotateCcw className="h-4 w-4" />,
        status: "pending",
      },
    ],
  },
  {
    id: "ucis",
    name: "ucis",
    steps: [
      {
        id: "predespacho",
        name: "Predespacho",
        icon: <Lock className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "alistamiento",
        name: "Alistamiento",
        icon: <Scale className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "validacion",
        name: "Validación",
        icon: <Check className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "entrega",
        name: "Entrega",
        icon: <ShoppingCart className="h-4 w-4" />,
        status: "pending",
      },
      {
        id: "devoluciones",
        name: "Devoluciones",
        icon: <RotateCcw className="h-4 w-4" />,
        status: "pending",
      },
    ],
  },
];

const ProcessStepButton: React.FC<{
  step: ProcessStep;
  onClick?: () => void;
}> = ({ step, onClick }) => {
  // All buttons are gray by default (no colors)
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-12 h-12 rounded-full border-2 text-gray-400 border-gray-300 bg-gray-50 hover:scale-105 transition-all duration-200 hover:border-gray-400"
      onClick={onClick}
    >
      {step.icon}
    </Button>
  );
};

const ConnectionDot: React.FC<{
  connectionInfo: ConnectionInfo;
  lineId: string;
  stepIndex: number;
}> = ({ connectionInfo, lineId, stepIndex }) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="relative">
      <div
        className="w-3 h-3 bg-gray-300 rounded-full cursor-pointer transition-colors duration-200"
        onMouseEnter={() => setShowPopup(true)}
        onMouseLeave={() => setShowPopup(false)}
      />

      {/* Popup */}
      {showPopup && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[140px]">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Intermedia</span>
              </div>
              <div className="ml-4 space-y-0.5 text-gray-600">
                <div>Inicio: {connectionInfo.inicio}</div>
                <div>Fin: {connectionInfo.fin}</div>
                <div>Horas: {connectionInfo.horas}</div>
                <div className="flex items-center gap-1">
                  <span>Cumple criterios</span>
                  {connectionInfo.cumpleCriterios && (
                    <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Arrow pointing down */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LineRow: React.FC<{
  line: LineData;
  onStepClick?: (lineId: string, stepId: string) => void;
}> = ({ line, onStepClick }) => {
  return (
    <div className="flex items-center py-6 border-b border-gray-100 last:border-b-0">
      {/* Line Name */}
      <div className="w-24 flex-shrink-0">
        <span className="text-sm font-medium text-gray-900">{line.name}</span>
      </div>

      {/* Process Steps with Connection Dots */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center">
          {line.steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <ProcessStepButton
                step={step}
                onClick={() => onStepClick?.(line.id, step.id)}
              />
              {/* Connection dot after each step except the last and except between Entrega and Devoluciones */}
              {index < line.steps.length - 1 &&
                index !== line.steps.length - 2 && (
                  <div className="px-8">
                    <ConnectionDot
                      connectionInfo={getConnectionInfo(line.id, index)}
                      lineId={line.id}
                      stepIndex={index}
                    />
                  </div>
                )}
              {/* Add extra padding between all steps except the last */}
              {index < line.steps.length - 1 &&
                index === line.steps.length - 2 && <div className="px-8" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function EstadoGeneralManagement() {
  const handleStepClick = (lineId: string, stepId: string) => {
    console.log(`Clicked on ${stepId} for ${lineId}`);
    // Here you could navigate to detailed view or show modal
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Estado general</h1>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            {linesData.map((line) => (
              <LineRow
                key={line.id}
                line={line}
                onStepClick={handleStepClick}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
