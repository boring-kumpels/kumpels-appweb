"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Send, X } from "lucide-react";

interface ErrorReportModalProps {
  patientName: string;
  patientId: string;
  errorType: "distribución" | "devoluciones" | "alistamiento" | "predespacho";
}

const stageOptions = [
  {
    id: "predespacho",
    label: "Predespacho",
    icon: "🔒",
  },
  {
    id: "alistamiento",
    label: "Alistamiento",
    icon: "⚖️",
  },
];

export function ErrorReportModal({
  patientName,
  patientId,
  errorType,
}: ErrorReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedStage) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Error report submitted:", {
      patientId,
      patientName,
      errorType,
      stage: selectedStage,
    });

    // Reset form
    setSelectedStage("");
    setIsSubmitting(false);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedStage("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 px-3 py-2 h-10 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Reportar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Selecciona que etapa presenta un error</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {stageOptions.map((stage) => (
            <Button
              key={stage.id}
              variant={selectedStage === stage.id ? "default" : "outline"}
              className="h-16 flex flex-col items-center justify-center space-y-2"
              onClick={() => setSelectedStage(stage.id)}
            >
              <span className="text-lg">{stage.icon}</span>
              <span>{stage.label}</span>
            </Button>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedStage || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </div>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Reporte
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
