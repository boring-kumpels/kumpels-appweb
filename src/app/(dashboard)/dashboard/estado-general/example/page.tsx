"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EstadoGeneralByPatients from "@/components/dashboard/estado-general/estado-general-by-patients";

export default function ExampleEstadoGeneralPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Ejemplo: Estado General</h1>
        <p className="text-gray-600">
          Vista general del estado de todas las líneas con sus procesos y
          conexiones
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Características Implementadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-600">
                  Visualización
                </Badge>
                <span className="font-medium text-gray-900">
                  Líneas y Procesos
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    5 líneas (línea 1, 2, 3, 4, ucis)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    5 procesos por línea
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    Puntos de conexión entre procesos
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  Estados
                </Badge>
                <span className="font-medium text-gray-900">
                  Indicadores Visuales
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    Completado (verde)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    En proceso (naranja)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    Pendiente (gris)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Error (rojo)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Procesos por Línea</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-8 h-8 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                🔒
              </div>
              <span className="text-sm font-medium">Predespacho</span>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                ⚖️
              </div>
              <span className="text-sm font-medium">Alistamiento</span>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                ✅
              </div>
              <span className="text-sm font-medium">Validación</span>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                🛒
              </div>
              <span className="text-sm font-medium">Entrega</span>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                🔄
              </div>
              <span className="text-sm font-medium">Devoluciones</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <EstadoGeneralByPatients />
    </div>
  );
}
