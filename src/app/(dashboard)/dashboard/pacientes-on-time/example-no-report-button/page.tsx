"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PacientesOnTimeManagement from "@/components/dashboard/pacientes-on-time/pacientes-on-time-management";

export default function ExampleNoReportButtonPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">
          Ejemplo: Sin Botón de Reporte en Distribución
        </h1>
        <p className="text-gray-600">
          El botón "Reportar" ha sido eliminado de la columna de Distribución
          según lo solicitado
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cambios Realizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">
                  Columna de Distribución
                </h3>
                <p className="text-sm text-gray-600">
                  Se eliminó el botón "Reportar" de todos los iconos en la
                  columna de Distribución. Ahora solo muestran el estado visual
                  (verde, naranja, rojo) sin botón de acción.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">
                  Columna de Devoluciones
                </h3>
                <p className="text-sm text-gray-600">
                  El botón "Reportar" se mantiene en la columna de Devoluciones
                  para reportar errores cuando el estado es "error".
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">
                  Funcionalidad Preservada
                </h3>
                <p className="text-sm text-gray-600">
                  Los iconos siguen siendo clickeables y muestran el estado
                  correcto. Solo se eliminó la funcionalidad de reporte de la
                  columna de Distribución.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PacientesOnTimeManagement />
    </div>
  );
}
