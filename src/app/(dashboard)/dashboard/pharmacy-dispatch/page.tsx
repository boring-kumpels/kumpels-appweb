"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock,
  User,
  List,
  Truck,
  RotateCcw,
  Thermometer,
  MapPin,
  Building,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface QRData {
  type: string;
  line: string;
}

export default function PharmacyDispatchPage() {
  const router = useRouter();
  const [transactionType, setTransactionType] = useState<"delivery" | "return">(
    "delivery"
  );
  const [temperature, setTemperature] = useState("");
  const [selectedLine, setSelectedLine] = useState("");
  const [qrData] = useState<QRData>({
    type: "Salida de Farmacia",
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

  const lines = ["linea 1", "linea 2", "linea 3", "linea 4", "ucis"];

  const handleRegisterTransaction = () => {
    console.log("Registering transaction:", {
      type: transactionType,
      temperature,
      selectedLine,
      qrData,
    });
    // Here you would send the data to your API
    alert("Transacción registrada exitosamente");
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
                    {qrData.type}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Línea:
                  </Label>
                  <div className="text-sm text-foreground bg-muted px-3 py-2 rounded-md">
                    {qrData.line}
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
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3">
                    <List className="h-5 w-5" />
                    <span className="text-sm">Salida de Farmacia</span>
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
                      transactionType === "delivery" ? "default" : "outline"
                    }
                    className={`h-24 flex flex-col items-center justify-center gap-2 ${
                      transactionType === "delivery"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-card hover:bg-muted border"
                    }`}
                    onClick={() => setTransactionType("delivery")}
                  >
                    <Truck className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-semibold">Entrega</div>
                      <div className="text-xs opacity-80">
                        Registrar entrega de medicamentos
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant={
                      transactionType === "return" ? "default" : "outline"
                    }
                    className={`h-24 flex flex-col items-center justify-center gap-2 ${
                      transactionType === "return"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-card hover:bg-muted border"
                    }`}
                    onClick={() => setTransactionType("return")}
                  >
                    <RotateCcw className="h-8 w-8" />
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

            {/* Destination Line Selection */}
            <Card className="bg-card border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Selecciona la línea de destino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {lines.map((line) => (
                    <Button
                      key={line}
                      variant={selectedLine === line ? "default" : "outline"}
                      className={`h-16 flex flex-col items-center justify-center gap-1 ${
                        selectedLine === line
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-card hover:bg-muted border"
                      }`}
                      onClick={() => setSelectedLine(line)}
                    >
                      <Building className="h-5 w-5" />
                      <span className="text-xs font-medium">{line}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="bg-card border shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handleRegisterTransaction}
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
    </div>
  );
}
