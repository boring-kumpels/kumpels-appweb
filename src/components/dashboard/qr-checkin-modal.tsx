"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Truck,
  RotateCcw,
  Thermometer,
  MapPin,
  Clock,
  User,
  List,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentDailyProcess } from "@/hooks/use-daily-processes";

interface QRCheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrData: {
    type: string;
    id: string;
    serviceId?: string;
    serviceName?: string;
  } | null;
  onSuccess: () => void;
  currentTab?: string;
}

type TransactionType = "ENTREGA" | "DEVOLUCION";

interface Line {
  id: string;
  name: string;
  displayName: string;
}

export function QRCheckInModal({
  open,
  onOpenChange,
  qrData,
  onSuccess,
  currentTab,
}: QRCheckInModalProps) {
  const [transactionType, setTransactionType] =
    useState<TransactionType>("ENTREGA");
  const [temperature, setTemperature] = useState<string>("");
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [lines, setLines] = useState<Line[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if this is a service arrival (second QR code) or devolution pickup
  const isServiceArrival = qrData?.type === "SERVICE_ARRIVAL" || qrData?.type === "DEVOLUTION_PICKUP";

  const queryClient = useQueryClient();
  const { data: currentDailyProcess } = useCurrentDailyProcess();

  // Get current date and time
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch lines when modal opens (only for pharmacy dispatch)
  useEffect(() => {
    if (open && !isServiceArrival) {
      fetchLines();
    }
  }, [open, isServiceArrival]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      // Set transaction type based on current tab
      if (currentTab === "devoluciones") {
        setTransactionType("DEVOLUCION");
      } else {
        setTransactionType("ENTREGA");
      }
      setTemperature("");
      setSelectedLineId("");
    }
  }, [open, currentTab]);

  const fetchLines = async () => {
    try {
      const response = await fetch("/api/lines");
      if (response.ok) {
        const linesData = await response.json();
        setLines(linesData);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar las líneas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching lines:", error);
      toast({
        title: "Error",
        description: "Error al cargar las líneas",
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    // Only require line selection for pharmacy dispatch
    if (!isServiceArrival && !selectedLineId) {
      toast({
        title: "Error",
        description: "Debes seleccionar una línea de destino",
        variant: "destructive",
      });
      return false;
    }

    if (temperature === "") {
      toast({
        title: "Error",
        description: "Debes ingresar la temperatura",
        variant: "destructive",
      });
      return false;
    }

    const tempValue = parseFloat(temperature);
    if (isNaN(tempValue) || tempValue < -10 || tempValue > 50) {
      toast({
        title: "Error",
        description: "La temperatura debe estar entre -10°C y 50°C",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !qrData) return;

    setIsSubmitting(true);

    try {
      let endpoint = "";
      
      switch (qrData.type) {
        case "PHARMACY_DISPATCH":
          endpoint = "/api/qr-scan/pharmacy-dispatch";
          break;
        case "PHARMACY_DISPATCH_DEVOLUTION":
          endpoint = "/api/qr-scan/pharmacy-dispatch-devolution";
          break;
        case "SERVICE_ARRIVAL":
          endpoint = "/api/qr-scan/service-arrival";
          break;
        case "DEVOLUTION_PICKUP":
          endpoint = "/api/qr-scan/devolution-pickup";
          break;
        case "DEVOLUTION_RETURN":
          endpoint = "/api/qr-scan/devolution-return";
          break;
        default:
          throw new Error(`Unsupported QR type: ${qrData.type}`);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrId: qrData.id,
          temperature: parseFloat(temperature),
          destinationLineId: isServiceArrival ? null : selectedLineId,
          transactionType,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Transacción registrada",
          description: result.message,
        });

        // Invalidate queries to trigger immediate UI updates
        if (currentDailyProcess?.id) {
          queryClient.invalidateQueries({
            queryKey: ["all-medication-processes", currentDailyProcess.id],
          });
          queryClient.invalidateQueries({
            queryKey: ["patients"],
          });
        }

        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al registrar la transacción",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting check-in:", error);
      toast({
        title: "Error",
        description: "Error interno del servidor",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueWithoutRegister = () => {
    onOpenChange(false);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (!qrData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-0 shadow-2xl">
        <DialogHeader className="relative">
          <DialogTitle className="text-center text-2xl font-bold text-foreground">
            PharmacyRegents
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mt-2">
            Sistema de Registro de Farmacia
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Information Bar */}
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formatDateTime(currentDateTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">PharmacyRegents</span>
                </div>
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {qrData.type === "SERVICE_ARRIVAL"
                      ? "Llegada a Piso"
                      : qrData.type === "DEVOLUTION_PICKUP"
                      ? "Recogida de Devolución"
                      : qrData.type === "DEVOLUTION_RETURN"
                      ? "Recepción en Farmacia"
                      : qrData.type === "PHARMACY_DISPATCH_DEVOLUTION"
                      ? "Salida de Farmacia (Devolución)"
                      : "Salida de Farmacia (Entrega)"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Type Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              Selecciona el tipo de transacción
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer transition-all ${
                  transactionType === "ENTREGA"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setTransactionType("ENTREGA")}
              >
                <CardContent className="p-4 text-center">
                  <Truck className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium text-sm">Entrega</p>
                  <p className="text-xs text-muted-foreground">
                    Registrar entrega de medicamentos
                  </p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all ${
                  transactionType === "DEVOLUCION"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setTransactionType("DEVOLUCION")}
              >
                <CardContent className="p-4 text-center">
                  <RotateCcw className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium text-sm">Devolución</p>
                  <p className="text-xs text-muted-foreground">
                    Registrar devolución de medicamentos
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Temperature Control */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-foreground" />
              <h3 className="text-lg font-semibold text-foreground">
                Control de Temperatura
              </h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature" className="text-sm font-medium">
                Ingresa la temperatura (°C)
              </Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="-10"
                max="50"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="Ej: 25.5"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Rango: -10°C a 50°C
              </p>
            </div>
          </div>

          {/* Destination Line Selection - Only for Pharmacy Dispatch */}
          {!isServiceArrival && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-foreground" />
                <h3 className="text-lg font-semibold text-foreground">
                  Selecciona la línea de destino
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {lines.map((line) => (
                  <Card
                    key={line.id}
                    className={`cursor-pointer transition-all ${
                      selectedLineId === line.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedLineId(line.id)}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="w-6 h-6 mx-auto mb-1 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs font-medium">🏥</span>
                      </div>
                      <p className="text-xs font-medium">{line.displayName}</p>
                    </CardContent>
                  </Card>
                ))}
                {lines.length === 0 && (
                  <div className="col-span-3 text-center py-4 text-muted-foreground">
                    <Loader2 className="h-4 w-4 mx-auto mb-2 animate-spin" />
                    <p className="text-xs">Cargando líneas...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Information - Only for Service Arrival and Devolution Pickup */}
          {(qrData.type === "SERVICE_ARRIVAL" || qrData.type === "DEVOLUTION_PICKUP") && qrData.serviceName && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-foreground" />
                <h3 className="text-lg font-semibold text-foreground">
                  Información del Servicio
                </h3>
              </div>
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${
                      qrData.type === "DEVOLUTION_PICKUP" ? "bg-red-200" : "bg-blue-200"
                    }`}>
                      <span className="text-xs font-medium">
                        {qrData.type === "DEVOLUTION_PICKUP" ? "↩️" : "🏥"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {qrData.serviceName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {qrData.type === "DEVOLUTION_PICKUP" 
                          ? "Servicio de origen (devolución)" 
                          : "Servicio de destino"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Registrar Transacción
                </>
              )}
            </Button>
            <Button
              onClick={handleContinueWithoutRegister}
              disabled={isSubmitting}
              variant="outline"
              className="w-full h-12 text-purple-700 border-purple-300 hover:bg-purple-50"
            >
              Continuar sin registrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
