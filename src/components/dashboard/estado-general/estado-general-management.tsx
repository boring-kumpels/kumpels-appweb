"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Scale, Check, ShoppingCart, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react"; // Added missing import for React

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
  onClick: () => void;
}> = ({ step, onClick }) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="w-12 h-12 rounded-full border-2 text-muted-foreground border-border bg-background hover:scale-105 transition-all duration-200 hover:border-muted-foreground"
    >
      {step.icon}
    </Button>
  );
};

const ConnectionDot: React.FC<{
  connectionInfo: ConnectionInfo;
  lineId: string;
  stepIndex: number;
}> = ({ connectionInfo }) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="relative">
      <div
        className="w-3 h-3 bg-muted rounded-full cursor-pointer transition-colors duration-200"
        onMouseEnter={() => setShowPopup(true)}
        onMouseLeave={() => setShowPopup(false)}
      />
      {showPopup && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
            <div className="ml-4 space-y-0.5 text-foreground">
              <div className="text-xs">
                Intermedia: {connectionInfo.intermedia}
              </div>
              <div className="text-xs">Inicio: {connectionInfo.inicio}</div>
              <div className="text-xs">Fin: {connectionInfo.fin}</div>
              <div className="text-xs">Horas: {connectionInfo.horas}</div>
              <div className="flex items-center gap-1 text-xs">
                <span>Cumple criterios:</span>
                <div
                  className={cn(
                    "w-3 h-3 rounded-full flex items-center justify-center",
                    connectionInfo.cumpleCriterios
                      ? "bg-green-500"
                      : "bg-red-500"
                  )}
                >
                  {connectionInfo.cumpleCriterios && (
                    <Check className="h-2 w-2 text-white" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LineRow: React.FC<{ line: LineData }> = ({ line }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <span className="text-sm font-medium text-foreground">{line.name}</span>
      </div>
      <div className="flex items-center justify-between">
        {line.steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <ProcessStepButton
                step={step}
                onClick={() => console.log(`Clicked ${step.name}`)}
              />
              <span className="text-xs text-muted-foreground mt-2">
                {step.name}
              </span>
            </div>

            {/* Add connection dots between steps, but not after the last step or between Entrega and Devoluciones */}
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
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default function EstadoGeneralManagement() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Estado general</h1>
      </div>

      {/* Process Flow */}
      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            {linesData.map((line) => (
              <LineRow key={line.id} line={line} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
