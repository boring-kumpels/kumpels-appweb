"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EstadisticasManagement } from "@/components/dashboard/estadisticas/estadisticas-management";

export default function ExampleConditionalFiltersPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">
          Ejemplo: Filtros Condicionales
        </h1>
        <p className="text-gray-600">
          Los filtros cambian dependiendo de la pestaña activa (General vs
          Comparativo)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diferencias en los Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Tab Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-600">
                  General
                </Badge>
                <span className="font-medium text-gray-900">
                  Filtros Simples
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Línea</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Rango de fechas</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Solo los filtros esenciales para vista general
              </p>
            </div>

            {/* Comparativo Tab Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  Comparativo
                </Badge>
                <span className="font-medium text-gray-900">
                  Filtros Completos
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Línea</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Servicio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Personal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Agrupar por</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Rango de fechas</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Filtros avanzados para análisis comparativo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Vista General</h4>
                <p className="text-sm text-gray-600">
                  Haz clic en la pestaña &quot;General&quot; para ver solo los
                  filtros básicos: Línea y Rango de fechas.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Vista Comparativo</h4>
                <p className="text-sm text-gray-600">
                  Haz clic en la pestaña &quot;Comparativo&quot; para acceder a
                  todos los filtros avanzados.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Cambio Automático</h4>
                <p className="text-sm text-gray-600">
                  Los filtros cambian automáticamente al cambiar entre pestañas.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EstadisticasManagement />
    </div>
  );
}
