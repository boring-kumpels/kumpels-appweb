"use client";

import { useState, useRef, useEffect } from "react";
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
import { Camera, ArrowRight, QrCode, X, ChevronDown } from "lucide-react";

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRScanner({ open, onOpenChange }: QRScannerProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [showLineSelectionModal, setShowLineSelectionModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const lines = ["linea 1", "linea 2", "linea 3", "linea 4", "ucis"];

  useEffect(() => {
    if (open) {
      // Always show simulated camera view for now
      setIsCameraActive(true);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [open]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const handleSimulatePharmacyDispatch = () => {
    console.log("Simulating Pharmacy Dispatch");
    // Navigate to pharmacy dispatch page
    window.location.href = "/dashboard/pharmacy-dispatch";
  };

  const handleSimulateFloorArrival = () => {
    console.log("Opening line selection modal");
    setShowLineSelectionModal(true);
  };

  const handleLineSelection = () => {
    if (selectedLine) {
      console.log("Simulating Floor Arrival with line:", selectedLine);
      // Navigate to floor arrival page with selected line
      window.location.href = `/dashboard/floor-arrival?line=${encodeURIComponent(selectedLine)}`;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-background border-0 shadow-2xl">
          <DialogHeader className="relative">
            <DialogTitle className="text-center text-2xl font-bold text-foreground">
              Escáner QR
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground mt-2">
              Posiciona el código QR dentro del marco
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
            {/* Camera View */}
            <div className="relative bg-muted rounded-xl overflow-hidden shadow-lg">
              <div className="aspect-square relative">
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/50">
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Cámara no disponible
                      </p>
                    </div>
                  </div>
                )}

                {/* Camera Indicator */}
                <div className="absolute top-3 left-3">
                  <div className="bg-background/80 backdrop-blur-sm text-foreground text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg border">
                    <Camera className="h-3 w-3" />
                    Cámara frontal
                  </div>
                </div>

                {/* Error Message */}
                {cameraError && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-destructive/90 backdrop-blur-sm text-destructive-foreground text-xs px-3 py-1.5 rounded-full shadow-lg">
                      Error: {cameraError}
                    </div>
                  </div>
                )}

                {/* Scanning Frame */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-background rounded-xl relative shadow-2xl">
                    {/* Corner brackets with animation */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-background rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-background rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-background rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-background rounded-br-lg"></div>

                    {/* Scanning line animation */}
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 animate-pulse"></div>

                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <QrCode className="h-10 w-10 text-background opacity-60" />
                    </div>
                  </div>
                </div>

                {/* Scanning overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-background/20 pointer-events-none"></div>
              </div>
            </div>

            {/* Simulation Buttons */}
            <div className="space-y-4">
              <Button
                onClick={handleSimulatePharmacyDispatch}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
              >
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowRight className="h-4 w-4" />
                </div>
                Simular Salida de Farmacia
              </Button>

              <Button
                onClick={handleSimulateFloorArrival}
                className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
              >
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowRight className="h-4 w-4" />
                </div>
                Simular Llegada a Piso
              </Button>
            </div>

            {/* Info text */}
            <div className="text-center text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <p>
                En un entorno real, el sistema detectará automáticamente el tipo
                de QR y abrirá la página correspondiente.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Line Selection Modal */}
      <Dialog
        open={showLineSelectionModal}
        onOpenChange={setShowLineSelectionModal}
      >
        <DialogContent className="sm:max-w-md bg-background border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-foreground">
              Selecciona la línea de llegada
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                Línea de destino
              </Label>
              <Select value={selectedLine} onValueChange={setSelectedLine}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una línea" />
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </SelectTrigger>
                <SelectContent>
                  {lines.map((line) => (
                    <SelectItem key={line} value={line}>
                      {line}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLineSelectionModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleLineSelection}
                disabled={!selectedLine}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
