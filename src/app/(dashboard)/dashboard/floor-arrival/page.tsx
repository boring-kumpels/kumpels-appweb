"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock,
  User,
  List,
  CheckCircle,
  AlertTriangle,
  Thermometer,
  Building,
  ArrowRight,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface QRData {
  type: string;
  line: string;
  lineId?: string;
}

export default function FloorArrivalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [arrivalStatus, setArrivalStatus] = useState<"delivery" | "return">(
    "delivery"
  );
  const [temperature, setTemperature] = useState("");
  const [selectedLine, setSelectedLine] = useState("");
  const [qrData, setQrData] = useState<QRData>({
    type: "Llegada a Piso",
    line: "Selecciona una línea",
  });

  const currentDateTime = new Date().toLocaleString("es-ES", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  useEffect(() => {
    const lineParam = searchParams.get("line");
    if (lineParam) {
      setSelectedLine(lineParam);
      setQrData({
        type: "Llegada a Piso",
        line: lineParam,
        lineId: "1", // Mock ID for demonstration
      });
    }
  }, [searchParams]);

  const handleRegisterArrival = () => {
    console.log("Registering arrival:", {
      status: arrivalStatus,
      temperature,
      selectedLine,
      qrData,
    });
    // Here you would send the data to your API
    alert("Llegada registrada exitosamente");
  };

  const handleContinueWithoutRegister = () => {
    console.log("Continuing without registration");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Left Sidebar - QR Data */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - QR Data */}
          <div className="lg:col-span-1">
            <Card className="bg-card border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Datos del QR:
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Tipo:
                  </Label>
                  <div className="text-sm text-foreground bg-muted px-3 py-2 rounded-md">
                    {qrData.type} - {qrData.line}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Línea:
                  </Label>
                  <div className="text-sm text-foreground bg-muted px-3 py-2 rounded-md">
                    {qrData.line} {qrData.lineId && `(ID: ${qrData.lineId})`}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header Card */}
            <Card className="bg-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold mb-2">K PharmacyRegents</h1>
                  <p className="text-blue-100">
                    Sistema de Registro de Farmacia
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm">{currentDateTime}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3">
                    <User className="h-5 w-5" />
                    <span className="text-sm">SUPERUSER</span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-500 rounded-lg p-3">
                    <List className="h-5 w-5" />
                    <ArrowRight className="h-4 w-4" />
                    <span className="text-sm">
                      Llegada a Piso - {qrData.line}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Type Selection */}
            <Card className="bg-card border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Selecciona el tipo de transacción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={
                      arrivalStatus === "delivery" ? "default" : "outline"
                    }
                    className={`h-24 flex flex-col items-center justify-center gap-2 ${
                      arrivalStatus === "delivery"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-card hover:bg-muted border"
                    }`}
                    onClick={() => setArrivalStatus("delivery")}
                  >
                    <CheckCircle className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-semibold">Entrega</div>
                      <div className="text-xs opacity-80">
                        Registrar entrega de medicamentos
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant={arrivalStatus === "return" ? "default" : "outline"}
                    className={`h-24 flex flex-col items-center justify-center gap-2 ${
                      arrivalStatus === "return"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-card hover:bg-muted border"
                    }`}
                    onClick={() => setArrivalStatus("return")}
                  >
                    <AlertTriangle className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-semibold">Devolución</div>
                      <div className="text-xs opacity-80">
                        Registrar devolución de medicamentos
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Temperature Control */}
            <Card className="bg-card border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Control de Temperatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label
                    htmlFor="temperature"
                    className="text-sm font-medium text-foreground"
                  >
                    Ingresa la temperatura (°C)
                  </Label>
                  <Input
                    id="temperature"
                    type="number"
                    placeholder="Ej: 25"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Rango: -10°C a 50°C
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Selected Line Display */}
            {selectedLine && (
              <Card className="bg-card border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-foreground">
                      Línea Seleccionada
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {selectedLine}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card className="bg-card border shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handleRegisterArrival}
                    className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Registrar Transacción
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleContinueWithoutRegister}
                    className="h-12 bg-card border hover:bg-muted text-foreground font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Continuar sin registrar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-xs text-muted-foreground">
          © 2025 Kumpels - Sistema de Gestión Farmacéutica
        </p>
      </div>
    </div>
  );
}
