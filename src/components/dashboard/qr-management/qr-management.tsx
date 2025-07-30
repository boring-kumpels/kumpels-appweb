"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  QrCode, 
  Download, 
  Printer, 
  RefreshCw, 
  CheckCircle,
  Clock
} from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";

interface QRCodeData {
  id: string;
  qrId: string;
  type: 'PHARMACY_DISPATCH' | 'SERVICE_ARRIVAL';
  isActive: boolean;
  qrDataURL: string;
  serviceId?: string;
  service?: {
    id: string;
    name: string;
    line: {
      id: string;
      name: string;
      displayName: string;
    };
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function QRManagement() {
  const [pharmacyDispatchQR, setPharmacyDispatchQR] = useState<QRCodeData | null>(null);
  const [serviceArrivalQRs, setServiceArrivalQRs] = useState<QRCodeData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadActiveQRs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/qr-codes');
      if (response.ok) {
        const data = await response.json();
        setPharmacyDispatchQR(data.pharmacyDispatchQR || null);
        setServiceArrivalQRs(data.serviceArrivalQRs || []);
      } else {
        console.error('Failed to load QR codes');
      }
    } catch (error) {
      console.error('Error loading QR codes:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar los códigos QR",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveQRs();
  }, [loadActiveQRs]);

  const generatePharmacyDispatchQR = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/qr-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'generate',
          type: 'PHARMACY_DISPATCH'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPharmacyDispatchQR(data.qrCode);
        toast({
          title: "Éxito",
          description: "Código QR de Salida de Farmacia generado correctamente",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo generar el código QR",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating pharmacy dispatch QR:', error);
      toast({
        title: "Error",
        description: "Error al generar el código QR de farmacia",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllServiceArrivalQRs = async () => {
    setIsGeneratingAll(true);
    try {
      const response = await fetch('/api/qr-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'generate_all_service_arrival'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setServiceArrivalQRs(data.qrCodes || []);
        toast({
          title: "Éxito",
          description: `${data.qrCodes?.length || 0} códigos QR de Llegada a Servicio generados correctamente`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "No se pudieron generar los códigos QR",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating service arrival QRs:', error);
      toast({
        title: "Error",
        description: "Error al generar los códigos QR de llegada a servicio",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleDownloadQR = (qrData: QRCodeData, customName?: string) => {
    const fileName = customName || 
      (qrData.type === 'PHARMACY_DISPATCH' 
        ? `Salida_Farmacia_QR_${new Date().toISOString().split('T')[0]}.png`
        : `Llegada_Servicio_${qrData.service?.name}_QR_${new Date().toISOString().split('T')[0]}.png`);
    
    const link = document.createElement("a");
    link.download = fileName;
    link.href = qrData.qrDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = (qrData: QRCodeData) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const title = qrData.type === 'PHARMACY_DISPATCH' 
        ? 'Código QR - Salida de Farmacia'
        : `Código QR - Llegada a Servicio - ${qrData.service?.name}`;
      
      const description = qrData.type === 'PHARMACY_DISPATCH'
        ? 'Código QR general para registrar la salida de medicamentos desde farmacia.<br>Válido para todos los pacientes con proceso ENTREGA completado.'
        : `Código QR para registrar la llegada de medicamentos al servicio.<br>Específico para el servicio: ${qrData.service?.name} (${qrData.service?.line.displayName}).`;

      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
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
                border: 3px solid #000;
                padding: 30px;
                margin: 20px;
                max-width: 400px;
              }
              .qr-title { 
                font-size: 24px; 
                font-weight: bold; 
                margin-bottom: 15px; 
                color: #000;
              }
              .qr-description { 
                font-size: 16px; 
                color: #444; 
                margin-bottom: 15px; 
                line-height: 1.4;
              }
              .qr-date { 
                font-size: 14px; 
                color: #666; 
                margin-bottom: 25px; 
              }
              .qr-image { 
                max-width: 300px; 
                height: auto; 
                border: 1px solid #ddd;
              }
              .qr-id {
                font-size: 12px;
                color: #888;
                margin-top: 15px;
                font-family: monospace;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="qr-title">${title}</div>
              <div class="qr-description">
                ${description}
              </div>
              <div class="qr-date">
                Generado: ${new Date(qrData.createdAt).toLocaleString('es-ES')}
              </div>
              <img src="${qrData.qrDataURL}" alt="Código QR" class="qr-image" />
              <div class="qr-id">ID: ${qrData.qrId}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-muted-foreground">Cargando código QR...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Códigos QR</h1>
          <p className="text-muted-foreground mt-2">
            Gestión de códigos QR para salida de farmacia y llegada a piso - Solo usuarios SUPERADMIN
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={generatePharmacyDispatchQR}
            disabled={isGenerating}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generando...' : pharmacyDispatchQR ? 'Regenerar Farmacia' : 'Generar Salida Farmacia'}
          </Button>
          <Button
            onClick={generateAllServiceArrivalQRs}
            disabled={isGeneratingAll}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingAll ? 'animate-spin' : ''}`} />
            {isGeneratingAll ? 'Generando...' : 'Generar Llegada a Servicio'}
          </Button>
        </div>
      </div>

      {/* Pharmacy Dispatch QR Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Salida de Farmacia</h2>
        {pharmacyDispatchQR ? (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-600" />
                Código QR - Salida de Farmacia
                {pharmacyDispatchQR.isActive && (
                  <span className="flex items-center gap-1 text-sm text-green-600 font-normal">
                    <CheckCircle className="h-3 w-3" />
                    Activo
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* QR Code Image */}
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex justify-center">
                  <Image
                    src={pharmacyDispatchQR.qrDataURL}
                    alt="Código QR - Salida de Farmacia"
                    width={250}
                    height={250}
                    className="w-auto h-auto max-w-[250px]"
                  />
                </div>

                {/* Information */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID del QR:</label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded border break-all">
                      {pharmacyDispatchQR.qrId}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fecha de creación:</label>
                    <p className="text-sm">
                      {new Date(pharmacyDispatchQR.createdAt).toLocaleString('es-ES')}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Funcionamiento:</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• QR general para toda la salida de farmacia</li>
                      <li>• Procesa todos los pacientes con ENTREGA completada</li>
                      <li>• Solo hay un QR activo a la vez</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownloadQR(pharmacyDispatchQR)}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button
                  onClick={() => handlePrintQR(pharmacyDispatchQR)}
                  variant="outline"
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No hay código QR de Salida de Farmacia
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Genera un código QR para registrar salidas de farmacia
                </p>
                <Button onClick={generatePharmacyDispatchQR} disabled={isGenerating}>
                  <QrCode className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generando...' : 'Generar Código QR'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Service Arrival QRs Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Llegada a Servicio</h2>
        {serviceArrivalQRs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceArrivalQRs.map((qr) => (
              <Card key={qr.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <QrCode className="h-4 w-4 text-green-600" />
                    {qr.service?.name || 'Servicio'}
                    <span className="text-xs text-muted-foreground">
                      ({qr.service?.line.displayName})
                    </span>
                    {qr.isActive && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-normal">
                        <CheckCircle className="h-3 w-3" />
                        Activo
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* QR Code Image */}
                  <div className="bg-white p-3 rounded-lg border-2 border-gray-200 flex justify-center">
                    <Image
                      src={qr.qrDataURL}
                      alt={`Código QR - ${qr.service?.name}`}
                      width={180}
                      height={180}
                      className="w-auto h-auto max-w-[180px]"
                    />
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">ID:</label>
                      <p className="text-xs font-mono bg-gray-100 p-1 rounded break-all">
                        {qr.qrId}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Creado:</label>
                      <p className="text-xs">
                        {new Date(qr.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownloadQR(qr)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Descargar
                    </Button>
                    <Button
                      onClick={() => handlePrintQR(qr)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      Imprimir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No hay códigos QR de Llegada a Servicio
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Genera códigos QR para cada servicio
                </p>
                <Button onClick={generateAllServiceArrivalQRs} disabled={isGeneratingAll}>
                  <QrCode className="h-4 w-4 mr-2" />
                  {isGeneratingAll ? 'Generando...' : 'Generar Códigos QR por Servicio'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            Instrucciones de Uso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">Para usar el código QR:</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Asegúrate de que todos los pacientes tengan el proceso ENTREGA completado</li>
                <li>Escanea el código QR desde la aplicación móvil o escáner</li>
                <li>El sistema procesará automáticamente todos los pacientes elegibles</li>
                <li>Se marcará la salida de farmacia para todos los pacientes procesados</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-1">Regeneración del QR:</h4>
              <p className="text-muted-foreground">
                Si necesitas invalidar el QR actual (por seguridad o problemas), puedes regenerar uno nuevo. 
                El QR anterior se desactivará automáticamente y solo el nuevo será válido.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}