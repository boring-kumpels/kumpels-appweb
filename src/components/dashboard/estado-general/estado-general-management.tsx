"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SystemStatus {
  name: string;
  status: "healthy" | "warning" | "error";
  percentage: number;
  description: string;
}

const systemStatuses: SystemStatus[] = [
  {
    name: "Distribución de Medicamentos",
    status: "healthy",
    percentage: 95,
    description: "Sistema funcionando correctamente",
  },
  {
    name: "Validación de Farmacia",
    status: "warning",
    percentage: 78,
    description: "Algunas validaciones pendientes",
  },
  {
    name: "Registro de Pacientes",
    status: "healthy",
    percentage: 98,
    description: "Registros actualizados",
  },
  {
    name: "Control de Errores",
    status: "error",
    percentage: 45,
    description: "Requiere atención inmediata",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "healthy":
      return "bg-green-500";
    case "warning":
      return "bg-yellow-500";
    case "error":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "healthy":
      return "Saludable";
    case "warning":
      return "Advertencia";
    case "error":
      return "Error";
    default:
      return "Desconocido";
  }
};

export default function EstadoGeneralManagement() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStatuses.map((system) => (
          <Card key={system.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {system.name}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(system.status)} text-white border-none`}
                >
                  {getStatusLabel(system.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {system.percentage}%
                  </span>
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(system.status)}`}
                  />
                </div>
                <Progress value={system.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {system.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">156</div>
              <p className="text-sm text-muted-foreground">Pacientes Activos</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">23</div>
              <p className="text-sm text-muted-foreground">
                Medicamentos en Cola
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">7</div>
              <p className="text-sm text-muted-foreground">
                Errores Reportados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
