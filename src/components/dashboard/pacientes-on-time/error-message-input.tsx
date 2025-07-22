"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { ErrorReportModal } from "./error-report-modal";

interface ErrorMessageInputProps {
  patientName: string;
  patientId: string;
  errorType: "distribución" | "devoluciones" | "alistamiento" | "predespacho";
  placeholder?: string;
  value?: string;
  onMessageChange?: (message: string) => void;
  onAddMessage?: (message: string) => void;
}

export function ErrorMessageInput({
  patientName,
  patientId,
  errorType,
  placeholder = "Mensaje de error",
  value = "",
  onMessageChange,
  onAddMessage,
}: ErrorMessageInputProps) {
  const handleMessageChange = (value: string) => {
    onMessageChange?.(value);
  };

  const handleAddMessage = () => {
    if (value.trim()) {
      onAddMessage?.(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddMessage();
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
      <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleMessageChange(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 bg-white border-orange-200 focus:border-orange-400 focus:ring-orange-400"
      />
      <ErrorReportModal
        patientName={patientName}
        patientId={patientId}
        errorType={errorType}
      />
      <Button
        onClick={handleAddMessage}
        disabled={!value.trim()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
      >
        Agregar
      </Button>
    </div>
  );
}
