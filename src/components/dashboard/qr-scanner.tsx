"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera,
  ArrowRight,
  QrCode,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import {
  parseQRData,
  QRCodeType,
  ServiceArrivalQRData,
  DevolutionPickupQRData,
} from "@/lib/qr-generator";
import { useQRScanner } from "@/hooks/use-qr-scanner";
import { toast } from "@/components/ui/use-toast";

import { QRCheckInModal } from "./qr-checkin-modal";

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTab?: string; // Add current tab prop
}

export function QRScanner({ open, onOpenChange, currentTab }: QRScannerProps) {
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    data?: {
      patientsCount: number;
    };
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enableCamera, setEnableCamera] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState<boolean | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [scannedQRData, setScannedQRData] = useState<{
    type: string;
    id: string;
    serviceId?: string;
    serviceName?: string;
  } | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // QR Scanner hook
  const {
    videoRef,
    isScanning,
    error: cameraError,
    hasPermission,
    stopScanning,
    resetPermissions,
  } = useQRScanner({
    enabled: enableCamera && open,
    onScan: (qrText: string) => {
      // Prevent processing the same QR code multiple times
      if (lastScannedRef.current === qrText) {
        console.log("Skipping duplicate QR code:", qrText);
        return;
      }

      // Clear any existing timeout
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      // Set a timeout to allow the same QR code to be scanned again after 3 seconds
      scanTimeoutRef.current = setTimeout(() => {
        lastScannedRef.current = null;
      }, 3000);

      lastScannedRef.current = qrText;

      // Process the scanned QR code
      processQRData(qrText);
    },
    onError: (error: string) => {
      toast({
        title: "Error de cámara",
        description: error,
        variant: "destructive",
      });
    },
  });

  // Check secure context on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSecureContext(window.isSecureContext);
    }
  }, []);

  // Debug logging
  useEffect(() => {
    console.log(
      "QRScanner: Camera state - enableCamera:",
      enableCamera,
      "open:",
      open,
      "enabled:",
      enableCamera && open
    );

    // Check if we're in a secure context
    if (isSecureContext === false) {
      console.warn(
        "Camera access requires HTTPS. Current context is not secure."
      );
    }
  }, [enableCamera, open, isSecureContext]);

  useEffect(() => {
    console.log("QRScanner: Dialog open changed to", open);
    if (open) {
      setScanResult(null);
      // Automatically enable camera when dialog opens
      console.log("QRScanner: Enabling camera...");
      setEnableCamera(true);
    } else {
      // Disable camera when dialog closes
      console.log("QRScanner: Disabling camera...");
      setEnableCamera(false);
    }
  }, [open]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Ensure camera is stopped when component unmounts
      stopScanning();

      // Clear any pending timeouts
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [stopScanning]);

  // Handle check-in modal success
  const handleCheckInSuccess = () => {
    setScanResult({
      success: true,
      message: "Transacción registrada exitosamente",
    });
    setScannedQRData(null);
    setShowCheckInModal(false);
  };

  const processQRData = async (qrString: string) => {
    setIsProcessing(true);
    setScanResult(null);

    try {
      const qrData = parseQRData(qrString);

      if (!qrData) {
        setScanResult({
          success: false,
          message: "Código QR no válido o formato incorrecto",
        });
        return;
      }

      // Validate that the QR is active
      if (!qrData.isActive) {
        setScanResult({
          success: false,
          message: "Este código QR no está activo",
        });
        return;
      }

      // Set the scanned QR data and open check-in modal
      setScannedQRData({
        type: qrData.type,
        id: qrData.id,
        serviceId:
          qrData.type === QRCodeType.SERVICE_ARRIVAL
            ? (qrData as ServiceArrivalQRData).serviceId
            : qrData.type === QRCodeType.DEVOLUTION_PICKUP
            ? (qrData as DevolutionPickupQRData).serviceId
            : undefined,
        serviceName:
          qrData.type === QRCodeType.SERVICE_ARRIVAL
            ? (qrData as ServiceArrivalQRData).serviceName
            : qrData.type === QRCodeType.DEVOLUTION_PICKUP
            ? (qrData as DevolutionPickupQRData).serviceName
            : undefined,
      });
      setShowCheckInModal(true);
    } catch (error) {
      console.error("Error processing QR:", error);
      setScanResult({
        success: false,
        message: "Error procesando el código QR",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulatePharmacyDispatch = () => {
    // Simulate scanning a general pharmacy dispatch QR
    const simulatedQRData = JSON.stringify({
      type: QRCodeType.PHARMACY_DISPATCH,
      id: `simulated_qr_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isActive: true,
    });

    processQRData(simulatedQRData);
  };

  const handleSimulatePharmacyDispatchDevolution = () => {
    // Simulate scanning a pharmacy dispatch devolution QR
    const simulatedQRData = JSON.stringify({
      type: QRCodeType.PHARMACY_DISPATCH_DEVOLUTION,
      id: `simulated_devolution_qr_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isActive: true,
    });

    processQRData(simulatedQRData);
  };

  const handleSimulateServiceArrival = async () => {
    try {
      // Fetch a real service from the database for simulation
      const response = await fetch("/api/services");
      if (response.ok) {
        const services = await response.json();
        if (services.length > 0) {
          const firstService = services[0];
          const simulatedQRData = JSON.stringify({
            type: QRCodeType.SERVICE_ARRIVAL,
            id: `simulated_service_qr_${Date.now()}`,
            serviceId: firstService.id,
            serviceName: firstService.name,
            timestamp: new Date().toISOString(),
            isActive: true,
          });

          processQRData(simulatedQRData);
        } else {
          toast({
            title: "Error",
            description: "No hay servicios disponibles para simular",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los servicios",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching services for simulation:", error);
      toast({
        title: "Error",
        description: "Error al obtener servicios para simulación",
        variant: "destructive",
      });
    }
  };

  const handleSimulateDevolutionPickup = async () => {
    try {
      // Fetch a real service from the database for simulation
      const response = await fetch("/api/services");
      if (response.ok) {
        const services = await response.json();
        if (services.length > 0) {
          const firstService = services[0];
          const simulatedQRData = JSON.stringify({
            type: QRCodeType.DEVOLUTION_PICKUP,
            id: `simulated_devolution_pickup_qr_${Date.now()}`,
            serviceId: firstService.id,
            serviceName: firstService.name,
            timestamp: new Date().toISOString(),
            isActive: true,
          });

          processQRData(simulatedQRData);
        } else {
          toast({
            title: "Error",
            description: "No hay servicios disponibles para simular",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los servicios",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching services for devolution pickup simulation:", error);
      toast({
        title: "Error",
        description: "Error al obtener servicios para simulación",
        variant: "destructive",
      });
    }
  };

  const handleSimulateDevolutionReturn = () => {
    // Simulate scanning a devolution return QR
    const simulatedQRData = JSON.stringify({
      type: QRCodeType.DEVOLUTION_RETURN,
      id: `simulated_devolution_return_qr_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isActive: true,
    });

    processQRData(simulatedQRData);
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
                {/* Always render video element for the hook to work */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isScanning ? "block" : "hidden"}`}
                  style={{ display: isScanning ? "block" : "none" }}
                />

                {/* Show placeholder when not scanning */}
                {!isScanning && (
                  <div className="w-full h-full flex items-center justify-center bg-muted/50">
                    <div className="text-center">
                      {hasPermission === false ? (
                        <>
                          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-2" />
                          <p className="text-sm text-destructive font-medium mb-2">
                            Acceso a cámara denegado
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Permite el acceso en la configuración del navegador
                          </p>
                        </>
                      ) : (
                        <>
                          <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {hasPermission === null
                              ? "Iniciando cámara..."
                              : "Cámara no disponible"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Camera Status Indicator */}
                <div className="absolute top-3 left-3">
                  <div
                    className={`bg-background/80 backdrop-blur-sm text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg border ${
                      isScanning
                        ? "text-green-700 border-green-200"
                        : "text-foreground"
                    }`}
                  >
                    {isScanning ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Escaneando
                      </>
                    ) : (
                      <>
                        <Camera className="h-3 w-3" />
                        {hasPermission === null
                          ? "Iniciando..."
                          : hasPermission
                            ? "Listo"
                            : "Sin acceso"}
                      </>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {cameraError && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-destructive-foreground text-xs px-3 py-1.5 rounded-full shadow-lg">
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

            {/* Scan Result Display */}
            {scanResult && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  scanResult.success
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {scanResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-semibold">
                    {scanResult.success
                      ? "Escaneado exitosamente"
                      : "Error en el escaneo"}
                  </span>
                </div>
                <p className="text-sm">{scanResult.message}</p>
                {scanResult.success && scanResult.data && (
                  <div className="mt-2 text-xs">
                    Pacientes procesados: {scanResult.data.patientsCount}
                  </div>
                )}
              </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">
                  Procesando código QR...
                </span>
              </div>
            )}

            {/* Camera Status */}
            <div className="space-y-4">
              {isScanning && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">
                      Cámara activa - Apunta al código QR
                    </span>
                  </div>
                </div>
              )}

              {!isScanning && hasPermission === false && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-red-700 mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Acceso a cámara denegado
                    </span>
                  </div>
                  <p className="text-xs text-red-600 mb-3 text-center">
                    Haz clic en el ícono de la cámara en la barra de direcciones
                    para permitir el acceso
                  </p>
                  <Button
                    onClick={resetPermissions}
                    variant="outline"
                    size="sm"
                    className="w-full h-10 text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Reintentar acceso a cámara
                  </Button>
                </div>
              )}

              {!isScanning && hasPermission === null && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-yellow-700 mb-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">
                      Iniciando cámara...
                    </span>
                  </div>
                  <Button
                    onClick={resetPermissions}
                    variant="outline"
                    size="sm"
                    className="w-full h-10 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Activar cámara manualmente
                  </Button>
                </div>
              )}

              {isSecureContext === false && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-orange-700 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Acceso a cámara limitado
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 text-center">
                    La cámara requiere HTTPS. Si estás en desarrollo local, usa
                    http://localhost
                  </p>
                </div>
              )}

              {/* Development Simulation Buttons */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs text-muted-foreground text-center mb-3">
                  Botones de simulación para desarrollo:
                </p>
                
                {/* Delivery QR buttons */}
                {(!currentTab || currentTab === "entrega") && (
                  <>
                    <Button
                      onClick={handleSimulatePharmacyDispatch}
                      disabled={isProcessing}
                      variant="outline"
                      className="w-full h-12 flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Simular Salida de Farmacia
                    </Button>
                    <Button
                      onClick={handleSimulateServiceArrival}
                      disabled={isProcessing}
                      variant="outline"
                      className="w-full h-12 flex items-center justify-center gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      Simular Llegada a Servicio
                    </Button>
                  </>
                )}
                
                {/* Devolution QR buttons */}
                {currentTab === "devoluciones" && (
                  <>
                    <Button
                      onClick={handleSimulatePharmacyDispatchDevolution}
                      disabled={isProcessing}
                      variant="outline"
                      className="w-full h-12 flex items-center justify-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Simular Salida Farmacia (Devolución)
                    </Button>
                    <Button
                      onClick={handleSimulatePharmacyDispatch}
                      disabled={isProcessing}
                      variant="outline"
                      className="w-full h-12 flex items-center justify-center gap-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Simular Salida Farmacia (Entrega)
                    </Button>
                  </>
                )}
                
                {/* Show all buttons if no specific tab */}
                {!currentTab && (
                  <>
                    <Button
                      onClick={handleSimulateDevolutionPickup}
                      disabled={isProcessing}
                      variant="outline"
                      className="w-full h-12 flex items-center justify-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Simular Recogida de Devolución
                    </Button>
                    <Button
                      onClick={handleSimulateDevolutionReturn}
                      disabled={isProcessing}
                      variant="outline"
                      className="w-full h-12 flex items-center justify-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <QrCode className="h-4 w-4" />
                      Simular Recepción en Farmacia
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Info text */}
            <div className="text-center text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Smartphone className="h-4 w-4" />
                <span className="font-medium">Instrucciones de uso</span>
              </div>
              <p>
                {currentTab === "devoluciones" 
                  ? "Posiciona el código QR dentro del marco de escaneo. El sistema procesará automáticamente todos los pacientes elegibles para el proceso de devolución."
                  : "Posiciona el código QR dentro del marco de escaneo. El sistema procesará automáticamente todos los pacientes elegibles para salida de farmacia."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Check-in Modal */}
      <QRCheckInModal
        open={showCheckInModal}
        onOpenChange={setShowCheckInModal}
        qrData={scannedQRData}
        onSuccess={handleCheckInSuccess}
        currentTab={currentTab}
      />
    </>
  );
}
