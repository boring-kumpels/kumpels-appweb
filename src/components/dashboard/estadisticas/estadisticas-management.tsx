"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface MetricCard {
  title: string;
  value: number;
  change: number;
  changeType: "increase" | "decrease" | "neutral";
  unit: string;
  description: string;
}

const metrics: MetricCard[] = [
  {
    title: "Medicamentos Distribuidos",
    value: 1247,
    change: 12,
    changeType: "increase",
    unit: "medicamentos",
    description: "Últimas 24 horas",
  },
  {
    title: "Errores de Medicación",
    value: 7,
    change: -3,
    changeType: "decrease",
    unit: "errores",
    description: "Últimas 24 horas",
  },
  {
    title: "Tiempo Promedio",
    value: 15.3,
    change: -2.1,
    changeType: "decrease",
    unit: "minutos",
    description: "Por distribución",
  },
  {
    title: "Eficiencia del Sistema",
    value: 94.2,
    change: 1.8,
    changeType: "increase",
    unit: "%",
    description: "Rendimiento general",
  },
];

const hourlyData = [
  { hour: "00:00", distributions: 12, errors: 0 },
  { hour: "06:00", distributions: 45, errors: 1 },
  { hour: "12:00", distributions: 89, errors: 2 },
  { hour: "18:00", distributions: 67, errors: 1 },
];

export default function EstadisticasManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState<"24h" | "7d" | "30d">(
    "24h"
  );

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case "increase":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "decrease":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case "increase":
        return "text-green-600";
      case "decrease":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span className="font-medium">Período:</span>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={selectedPeriod === "24h" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod("24h")}
          >
            24h
          </Button>
          <Button
            variant={selectedPeriod === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod("7d")}
          >
            7d
          </Button>
          <Button
            variant={selectedPeriod === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod("30d")}
          >
            30d
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metric.value}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {metric.unit}
                    </span>
                  </span>
                  <div className="flex items-center gap-1">
                    {getChangeIcon(metric.changeType)}
                    <span
                      className={`text-sm font-medium ${getChangeColor(metric.changeType)}`}
                    >
                      {metric.change > 0 ? "+" : ""}
                      {metric.change}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Distribuciones por Hora</span>
              <Badge variant="secondary">Tiempo Real</Badge>
            </div>
            <div className="space-y-3">
              {hourlyData.map((data, index) => (
                <div key={data.hour} className="flex items-center gap-4">
                  <span className="w-12 text-sm text-muted-foreground">
                    {data.hour}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">
                        Distribuciones: {data.distributions}
                      </span>
                      <span className="text-sm text-red-600">
                        Errores: {data.errors}
                      </span>
                    </div>
                    <Progress
                      value={(data.distributions / 100) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Líneas de Servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>UCI Pediátrica Cardiovascular</span>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800"
                >
                  96%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>UCI Quirúrgica</span>
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800"
                >
                  89%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>UCI Pediátrica General</span>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800"
                >
                  93%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">Error de validación en PC04</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  5 min
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Distribución retrasada UQ3</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  12 min
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">
                  Sistema actualizado correctamente
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  1h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
