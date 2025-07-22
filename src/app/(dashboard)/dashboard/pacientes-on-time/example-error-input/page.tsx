"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessageInput } from "@/components/dashboard/pacientes-on-time/error-message-input";

export default function ExampleErrorInputPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const handleAddMessage = (message: string) => {
    setMessages((prev) => [...prev, message]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">
          Ejemplo: Campo de Mensaje de Error
        </h1>
        <p className="text-gray-600">
          Este es un ejemplo del componente ErrorMessageInput con el botón de
          reportar error integrado
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campo de Mensaje de Error con Reporte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorMessageInput
            patientName="JESUS PEREZ"
            patientId="1"
            errorType="alistamiento"
            placeholder="Mensaje de error"
            value={newMessage}
            onMessageChange={setNewMessage}
            onAddMessage={handleAddMessage}
          />

          {/* Mensajes agregados */}
          {messages.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Mensajes agregados:</h3>
              <div className="space-y-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg text-sm"
                  >
                    {message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Características del Componente</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Campo de entrada con icono de advertencia
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Botón "Reportar" integrado al lado del campo
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Modal mejorado con tipos de error y prioridades
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Soporte para Enter para agregar mensajes
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Diseño responsivo y accesible
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
