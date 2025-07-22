"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadisticasManagement } from "@/components/dashboard/estadisticas/estadisticas-management";

export default function ExampleStatisticsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">
          Ejemplo: Sección de Estadísticas
        </h1>
        <p className="text-gray-600">
          Esta es una demostración completa de la sección de estadísticas con
          filtros mejorados
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Características Implementadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Filtros Mejorados</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Filtro de Línea con descripciones</li>
                <li>• Filtro de Servicio dinámico</li>
                <li>• Filtro de Personal con roles</li>
                <li>• Agrupación por período</li>
                <li>• Rango de fechas intuitivo</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Vistas Disponibles</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vista General con métricas</li>
                <li>• Vista Comparativa avanzada</li>
                <li>• Indicadores de progreso</li>
                <li>• Análisis de tendencias</li>
                <li>• Exportación de datos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <EstadisticasManagement />
    </div>
  );
}
