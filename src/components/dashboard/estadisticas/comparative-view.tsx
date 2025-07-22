"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparativeData {
  period1: {
    onTimeDelivery: number;
    onTimeReturns: number;
    medicationCartAdherence: number;
    patientsWithErrors: number;
  };
  period2: {
    onTimeDelivery: number;
    onTimeReturns: number;
    medicationCartAdherence: number;
    patientsWithErrors: number;
  };
}

interface ComparativeViewProps {
  filters: any;
}

export function ComparativeView({ filters }: ComparativeViewProps) {
  const [comparisonType, setComparisonType] = useState<
    "period" | "linea" | "servicio"
  >("period");
  const [isLoading, setIsLoading] = useState(false);

  // Mock comparative data
  const [comparativeData, setComparativeData] = useState<ComparativeData>({
    period1: {
      onTimeDelivery: 85,
      onTimeReturns: 92,
      medicationCartAdherence: 78,
      patientsWithErrors: 5,
    },
    period2: {
      onTimeDelivery: 78,
      onTimeReturns: 88,
      medicationCartAdherence: 72,
      patientsWithErrors: 8,
    },
  });

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <BarChart3 className="h-4 w-4 text-gray-600" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const metrics = [
    {
      key: "onTimeDelivery",
      label: "Cumplimiento horario entrega",
      period1: comparativeData.period1.onTimeDelivery,
      period2: comparativeData.period2.onTimeDelivery,
    },
    {
      key: "onTimeReturns",
      label: "Cumplimiento horario devoluciones",
      period1: comparativeData.period1.onTimeReturns,
      period2: comparativeData.period2.onTimeReturns,
    },
    {
      key: "medicationCartAdherence",
      label: "Adherencia verificación carro medicamentos",
      period1: comparativeData.period1.medicationCartAdherence,
      period2: comparativeData.period2.medicationCartAdherence,
    },
    {
      key: "patientsWithErrors",
      label: "Pacientes con errores en entrega de medicamentos",
      period1: comparativeData.period1.patientsWithErrors,
      period2: comparativeData.period2.patientsWithErrors,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Comparison Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Tipo de Comparación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-md">
            <button
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                comparisonType === "period"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
              onClick={() => setComparisonType("period")}
            >
              Por Período
            </button>
            <button
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                comparisonType === "linea"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
              onClick={() => setComparisonType("linea")}
            >
              Por Línea
            </button>
            <button
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                comparisonType === "servicio"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
              onClick={() => setComparisonType("servicio")}
            >
              Por Servicio
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Comparative Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric) => {
          const change = getChangePercentage(metric.period1, metric.period2);
          const changeIcon = getChangeIcon(change);
          const changeColor = getChangeColor(change);

          return (
            <Card key={metric.key}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">
                    {metric.label}
                  </h3>
                  <div className="flex items-center gap-1">
                    {changeIcon}
                    <span className={`text-sm font-medium ${changeColor}`}>
                      {change > 0 ? "+" : ""}
                      {change.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Period 1 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Período 1</span>
                      <span className="text-lg font-bold text-gray-900">
                        {metric.period1}%
                      </span>
                    </div>
                    <Progress value={metric.period1} className="h-2" />
                  </div>

                  {/* Period 2 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Período 2</span>
                      <span className="text-lg font-bold text-gray-900">
                        {metric.period2}%
                      </span>
                    </div>
                    <Progress value={metric.period2} className="h-2" />
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Diferencia:</span>
                    <span className={`font-medium ${changeColor}`}>
                      {metric.period1 - metric.period2 > 0 ? "+" : ""}
                      {(metric.period1 - metric.period2).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Comparación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {
                  metrics.filter(
                    (m) => getChangePercentage(m.period1, m.period2) > 0
                  ).length
                }
              </div>
              <div className="text-sm text-green-600">Métricas Mejoradas</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {
                  metrics.filter(
                    (m) => getChangePercentage(m.period1, m.period2) < 0
                  ).length
                }
              </div>
              <div className="text-sm text-red-600">Métricas Deterioradas</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {
                  metrics.filter(
                    (m) => getChangePercentage(m.period1, m.period2) === 0
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600">Sin Cambios</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
