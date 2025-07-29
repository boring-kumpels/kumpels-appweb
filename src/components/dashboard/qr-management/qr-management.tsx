"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  QrCode, 
  Download, 
  Printer, 
  RefreshCw, 
  Search, 
  Calendar,
  Building2,
  MapPin
} from "lucide-react";
import Image from "next/image";
import { useLines, useServices } from "@/hooks/use-lines-beds";
import { 
  generatePharmacyDispatchQR, 
  generateFloorArrivalQR, 
  QRCodeType 
} from "@/lib/qr-generator";
import {
  saveQRCodes,
  loadQRCodes,
  getQRCodesForDate,
  hasQRCodesForDate,
  getStorageInfo,
  cleanupOldQRCodes,
  StoredQRCode
} from "@/lib/qr-storage";
// Line and Service types are imported by hooks

// Use StoredQRCode interface from storage
type PreGeneratedQR = StoredQRCode;

export function QRManagement() {
  const [qrCodes, setQrCodes] = useState<PreGeneratedQR[]>([]);
  const [filteredQRs, setFilteredQRs] = useState<PreGeneratedQR[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | QRCodeType>("all");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());

  const { data: lines = [], isLoading: linesLoading } = useLines();
  const { data: allServices = [], isLoading: servicesLoading = false } = 
    useServices(undefined, true);

  const generateAllQRCodes = useCallback(async () => {
    setIsGenerating(true);
    const generatedQRs: PreGeneratedQR[] = [];
    const processDate = new Date(selectedDate);

    try {
      // Generate QR codes for pharmacy dispatch (one per line)
      for (const line of lines) {
        const qrDataURL = await generatePharmacyDispatchQR(line.id, processDate);
        generatedQRs.push({
          id: `pharmacy-${line.id}-${selectedDate}`,
          type: QRCodeType.PHARMACY_DISPATCH,
          name: `Salida de Farmacia - ${line.displayName}`,
          description: `QR para registrar salida de farmacia de la ${line.displayName}`,
          qrDataURL,
          lineId: line.id,
          processDate: selectedDate,
          generatedDate: new Date().toISOString(),
        });
      }

      // Generate QR codes for floor arrival (one per service)
      for (const service of allServices) {
        const qrDataURL = await generateFloorArrivalQR(service.name, processDate);
        const line = lines.find(l => l.id === service.lineId);
        generatedQRs.push({
          id: `service-${service.id}-${selectedDate}`,
          type: QRCodeType.FLOOR_ARRIVAL,
          name: `Llegada a ${service.name}`,
          description: `QR para registrar llegada al servicio ${service.name} (${line?.displayName || 'Línea'})`,
          qrDataURL,
          serviceName: service.name,
          processDate: selectedDate,
          generatedDate: new Date().toISOString(),
        });
      }

      // Save generated QR codes to storage
      saveQRCodes([...loadQRCodes().filter(qr => qr.processDate !== selectedDate), ...generatedQRs]);
      setQrCodes(generatedQRs);
      setStorageInfo(getStorageInfo()); // Update storage info
    } catch (error) {
      console.error("Error generating QR codes:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedDate, lines, allServices]);

  const loadQRCodesForDate = useCallback(() => {
    const existingQRs = getQRCodesForDate(selectedDate);
    
    if (existingQRs.length > 0) {
      // Use existing QR codes
      setQrCodes(existingQRs);
    } else {
      // Generate new QR codes for this date
      generateAllQRCodes();
    }
  }, [selectedDate, generateAllQRCodes]);

  // Load existing QR codes or generate new ones when date changes
  useEffect(() => {
    if (!linesLoading && !servicesLoading && lines.length > 0 && allServices.length > 0) {
      loadQRCodesForDate();
    }
  }, [lines, allServices, selectedDate, linesLoading, servicesLoading, loadQRCodesForDate]);

  // Clean up old QR codes on component mount
  useEffect(() => {
    const removedCount = cleanupOldQRCodes(30); // Keep QRs for 30 days
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old QR codes`);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = qrCodes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(qr => 
        qr.name.toLowerCase().includes(query) ||
        qr.description.toLowerCase().includes(query)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(qr => qr.type === filterType);
    }

    setFilteredQRs(filtered);
  }, [qrCodes, searchQuery, filterType]);


  const handleDownloadQR = (qr: PreGeneratedQR) => {
    const link = document.createElement("a");
    link.download = `${qr.name.replace(/\s+/g, '_')}_${selectedDate}.png`;
    link.href = qr.qrDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = (qr: PreGeneratedQR) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${qr.name}</title>
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
                border: 2px solid #000;
                padding: 20px;
                margin: 10px;
              }
              .qr-title { 
                font-size: 20px; 
                font-weight: bold; 
                margin-bottom: 10px; 
              }
              .qr-description { 
                font-size: 14px; 
                color: #666; 
                margin-bottom: 10px; 
              }
              .qr-date { 
                font-size: 12px; 
                color: #888; 
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
              <div class="qr-title">${qr.name}</div>
              <div class="qr-description">${qr.description}</div>
              <div class="qr-date">Fecha: ${new Date(selectedDate).toLocaleDateString('es-ES')} | Generado: ${new Date(qr.generatedDate).toLocaleString('es-ES')}</div>
              <img src="${qr.qrDataURL}" alt="Código QR" class="qr-image" />
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadAll = () => {
    filteredQRs.forEach((qr, index) => {
      setTimeout(() => {
        handleDownloadQR(qr);
      }, index * 100); // Small delay between downloads
    });
  };

  const getTypeIcon = (type: QRCodeType) => {
    switch (type) {
      case QRCodeType.PHARMACY_DISPATCH:
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case QRCodeType.FLOOR_ARRIVAL:
        return <MapPin className="h-4 w-4 text-green-600" />;
      default:
        return <QrCode className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: QRCodeType) => {
    switch (type) {
      case QRCodeType.PHARMACY_DISPATCH:
        return "Salida de Farmacia";
      case QRCodeType.FLOOR_ARRIVAL:
        return "Llegada a Servicio";
      default:
        return "QR Code";
    }
  };

  if (linesLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-muted-foreground">Cargando datos...</p>
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
            Códigos QR pre-generados para el seguimiento de entregas de medicamentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={generateAllQRCodes}
            disabled={isGenerating}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generando...' : 'Regenerar'}
          </Button>
          {filteredQRs.length > 0 && (
            <Button onClick={handleDownloadAll} className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Descargar Todos ({filteredQRs.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha del Proceso</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de QR</label>
              <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | QRCodeType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value={QRCodeType.PHARMACY_DISPATCH}>Salida de Farmacia</SelectItem>
                  <SelectItem value={QRCodeType.FLOOR_ARRIVAL}>Llegada a Servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Total: {qrCodes.length} códigos QR</span>
            <span>Filtrados: {filteredQRs.length}</span>
            <span>Fecha: {new Date(selectedDate).toLocaleDateString('es-ES')}</span>
            {hasQRCodesForDate(selectedDate) && (
              <span className="text-green-600">✓ QRs existentes cargados</span>
            )}
          </div>

          {/* Storage Info */}
          <div className="text-xs text-muted-foreground bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span>Almacenamiento: {storageInfo.count} QRs guardados ({storageInfo.size})</span>
              {storageInfo.lastUpdated && (
                <span>Última actualización: {new Date(storageInfo.lastUpdated).toLocaleString('es-ES')}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Codes Grid */}
      {isGenerating ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-lg font-medium">Generando códigos QR...</p>
            <p className="text-sm text-muted-foreground">
              Generando {lines.length} códigos de salida de farmacia y {allServices.length} códigos de llegada a servicio
            </p>
          </div>
        </div>
      ) : filteredQRs.length === 0 ? (
        <div className="text-center py-12">
          <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            {qrCodes.length === 0 ? 'No hay códigos QR generados' : 'No se encontraron códigos QR con los filtros aplicados'}
          </p>
          {qrCodes.length === 0 && (
            <Button onClick={generateAllQRCodes} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generar Códigos QR
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredQRs.map((qr) => (
            <Card key={qr.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(qr.type)}
                    <span className="text-xs font-medium text-muted-foreground">
                      {getTypeLabel(qr.type)}
                    </span>
                  </div>
                </div>
                <CardTitle className="text-base">{qr.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code Image */}
                <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
                  <Image
                    src={qr.qrDataURL}
                    alt={qr.name}
                    width={200}
                    height={200}
                    className="w-full h-auto mx-auto"
                  />
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">{qr.description}</p>

                {/* Metadata */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Fecha: {new Date(selectedDate).toLocaleDateString('es-ES')}</div>
                  <div>Generado: {new Date(qr.generatedDate).toLocaleString('es-ES')}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownloadQR(qr)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                  <Button
                    onClick={() => handlePrintQR(qr)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}