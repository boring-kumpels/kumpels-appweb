"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorReportModal } from "@/components/dashboard/pacientes-on-time/error-report-modal";

export default function ExampleSimpleModalPage() {
  const [reports, setReports] = useState<string[]>([]);

  const handleReportSubmitted = (data: { stage: string }) => {
    const report = `Error reportado en etapa: ${data.stage}`;
    setReports((prev) => [...prev, report]);
  };

  // Use the function to avoid unused variable warning
  console.log("Handler ready:", handleReportSubmitted);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Ejemplo: Modal Simplificado</h1>
        <p className="text-gray-600">
          Modal simplificado con solo dos opciones: Predespacho o Alistamiento
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modal de Reporte Simplificado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Haz clic en el botón para abrir el modal:
            </span>
            <ErrorReportModal
              patientName="JESUS PEREZ"
              patientId="1"
              errorType="alistamiento"
            />
          </div>

          {/* Reportes enviados */}
          {reports.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Reportes enviados:</h3>
              <div className="space-y-2">
                {reports.map((report, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
                  >
                    {report}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Características del Modal Simplificado</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Solo dos opciones: Predespacho y Alistamiento
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Diseño limpio y minimalista
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Botones grandes y fáciles de usar
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Iconos claros para cada etapa
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Proceso de envío simplificado
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
