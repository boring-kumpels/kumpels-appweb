"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { QrCode, Download, Printer, Loader2, X } from "lucide-react";
import { useLines, useServices } from "@/hooks/use-lines-beds";
import { 
  generatePharmacyDispatchQR, 
  generateFloorArrivalQR, 
  QRCodeType
} from "@/lib/qr-generator";
import { Line, Service } from "@/types/patient";

interface QRGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRGenerator({ open, onOpenChange }: QRGeneratorProps) {
  const [qrType, setQrType] = useState<QRCodeType | "">("");
  const [selectedLineId, setSelectedLineId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [qrDisplayText, setQrDisplayText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: lines = [], isLoading: linesLoading } = useLines();
  const { data: services = [], isLoading: servicesLoading } = useServices(
    selectedLineId || undefined,
    true
  );

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setQrType("");
      setSelectedLineId("");
      setSelectedServiceId("");
      setGeneratedQR(null);
      setQrDisplayText("");
    }
  }, [open]);

  // Reset service selection when line changes
  useEffect(() => {
    setSelectedServiceId("");
  }, [selectedLineId]);

  const handleGenerateQR = async () => {
    if (!qrType) return;

    setIsGenerating(true);
    try {
      let qrDataURL: string;
      let displayText: string;

      if (qrType === QRCodeType.PHARMACY_DISPATCH) {
        if (!selectedLineId) {
          throw new Error("Debe seleccionar una línea");
        }
        
        const selectedLine = lines.find((line: Line) => line.id === selectedLineId);
        qrDataURL = await generatePharmacyDispatchQR(selectedLineId);
        displayText = `Salida de Farmacia - ${selectedLine?.displayName || 'Línea'}`;
      } else if (qrType === QRCodeType.FLOOR_ARRIVAL) {
        if (!selectedServiceId) {
          throw new Error("Debe seleccionar un servicio");
        }
        
        const selectedService = services.find((service: Service) => service.id === selectedServiceId);
        if (!selectedService) {
          throw new Error("Servicio no encontrado");
        }
        
        qrDataURL = await generateFloorArrivalQR(selectedService.name);
        displayText = `Llegada a ${selectedService.name}`;
      } else {
        throw new Error("Tipo de QR no válido");
      }

      setGeneratedQR(qrDataURL);
      setQrDisplayText(displayText);
    } catch (error) {
      console.error("Error generating QR:", error);
      alert(error instanceof Error ? error.message : "Error generando código QR");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    if (!generatedQR) return;

    const link = document.createElement("a");
    link.download = `${qrDisplayText.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = generatedQR;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = () => {
    if (!generatedQR) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Código QR - ${qrDisplayText}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                font-family: Arial, sans-serif; 
              }
              .qr-container { 
                text-align: center; 
                page-break-inside: avoid; 
              }
              .qr-title { 
                font-size: 18px; 
                font-weight: bold; 
                margin-bottom: 10px; 
              }
              .qr-date { 
                font-size: 14px; 
                color: #666; 
                margin-bottom: 20px; 
              }
              .qr-image { 
                max-width: 300px; 
                height: auto; 
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="qr-title">${qrDisplayText}</div>
              <div class="qr-date">${new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
              <img src="${generatedQR}" alt="Código QR" class="qr-image" />
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const canGenerate = () => {
    if (!qrType) return false;
    if (qrType === QRCodeType.PHARMACY_DISPATCH) {
      return !!selectedLineId;
    }
    if (qrType === QRCodeType.FLOOR_ARRIVAL) {
      return !!selectedServiceId;
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background border-0 shadow-2xl">
        <DialogHeader className="relative">
          <DialogTitle className="text-center text-2xl font-bold text-foreground">
            Generar Código QR
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mt-2">
            Genera códigos QR para el seguimiento de entregas
          </DialogDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="absolute right-0 top-0 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Tipo de Código QR
            </Label>
            <Select value={qrType} onValueChange={(value) => setQrType(value as QRCodeType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de QR" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={QRCodeType.PHARMACY_DISPATCH}>
                  Salida de Farmacia (por línea)
                </SelectItem>
                <SelectItem value={QRCodeType.FLOOR_ARRIVAL}>
                  Llegada a Servicio (por servicio)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Line Selection for Pharmacy Dispatch */}
          {qrType === QRCodeType.PHARMACY_DISPATCH && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                Seleccionar Línea
              </Label>
              <Select
                value={selectedLineId}
                onValueChange={setSelectedLineId}
                disabled={linesLoading}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={linesLoading ? "Cargando líneas..." : "Selecciona una línea"} 
                  />
                </SelectTrigger>
                <SelectContent>
                  {lines.map((line: Line) => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Service Selection for Floor Arrival */}
          {qrType === QRCodeType.FLOOR_ARRIVAL && (
            <>
              {/* Line Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">
                  Seleccionar Línea
                </Label>
                <Select
                  value={selectedLineId}
                  onValueChange={setSelectedLineId}
                  disabled={linesLoading}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={linesLoading ? "Cargando líneas..." : "Selecciona una línea"} 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {lines.map((line: Line) => (
                      <SelectItem key={line.id} value={line.id}>
                        {line.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Selection */}
              {selectedLineId && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">
                    Seleccionar Servicio
                  </Label>
                  <Select
                    value={selectedServiceId}
                    onValueChange={setSelectedServiceId}
                    disabled={servicesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={servicesLoading ? "Cargando servicios..." : "Selecciona un servicio"} 
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service: Service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateQR}
            disabled={!canGenerate() || isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Generar Código QR
              </>
            )}
          </Button>

          {/* Generated QR Display */}
          {generatedQR && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">{qrDisplayText}</h3>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                  <Image 
                    src={generatedQR} 
                    alt="Código QR generado" 
                    width={256}
                    height={256}
                    className="mx-auto"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {new Date().toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleDownloadQR}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button
                  onClick={handlePrintQR}
                  variant="outline"
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}