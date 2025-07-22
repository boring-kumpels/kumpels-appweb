"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatisticsData {
  onTimeDelivery: number;
  onTimeReturns: number;
  medicationCartAdherence: number;
  patientsWithErrors: number;
}

interface FilterState {
  linea: string;
  servicio: string;
  personal: string;
  groupBy: string;
  dateRange: {
    from: Date;
    to: Date;
  };
}

const lineas = ["línea 1", "línea 2", "línea 3", "línea 4", "ucis"];

const servicios = {
  "línea 1": [
    "uci pediátrica cardiovascular",
    "uci quirúrgica",
    "uci pediátrica general",
  ],
  "línea 2": [
    "segundo adultos",
    "pebellón benefactores",
    "unidad de trasplantes",
  ],
  "línea 3": ["tercero adultos", "cuarto adultos", "segundo pediatría"],
  "línea 4": [
    "tercero pediatría",
    "suite pediátrica",
    "neonatos",
    "tercero renaldo",
    "quinto renaldo",
    "sexto renaldo",
  ],
  ucis: [
    "uci medica 1",
    "uci medica 2",
    "uci medica 3",
    "uci cardiovascular",
    "urgencias",
  ],
};

const personalOptions = ["PharmacyRegents", "Nurse", "SUPERUSER"];

const groupByOptions = ["Día", "Semana", "Mes"];

export function EstadisticasManagement() {
  const [activeTab, setActiveTab] = useState<"general" | "comparativo">(
    "general"
  );
  const [filters, setFilters] = useState<FilterState>({
    linea: "",
    servicio: "",
    personal: "",
    groupBy: "Día",
    dateRange: {
      from: new Date(2025, 5, 22), // June 22, 2025
      to: new Date(2025, 6, 22), // July 22, 2025
    },
  });

  const [statistics, setStatistics] = useState<StatisticsData>({
    onTimeDelivery: 0,
    onTimeReturns: 0,
    medicationCartAdherence: 0,
    patientsWithErrors: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Mock data - in real app this would come from API
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setStatistics({
        onTimeDelivery: 85,
        onTimeReturns: 92,
        medicationCartAdherence: 78,
        patientsWithErrors: 5,
      });
      setIsLoading(false);
    }, 1000);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleLineaChange = (linea: string) => {
    setFilters((prev) => ({
      ...prev,
      linea,
      servicio: "", // Reset servicio when linea changes
    }));
  };

  const getAvailableServicios = () => {
    if (!filters.linea) return [];
    return servicios[filters.linea as keyof typeof servicios] || [];
  };

  const formatDateRange = () => {
    const from = filters.dateRange.from;
    const to = filters.dateRange.to;
    return `${from.getDate()} de ${from.toLocaleDateString("es-ES", { month: "long" })} de ${from.getFullYear()} - ${to.getDate()} de ${to.toLocaleDateString("es-ES", { month: "long" })} de ${to.getFullYear()}`;
  };

  const hasData =
    statistics.onTimeDelivery > 0 ||
    statistics.onTimeReturns > 0 ||
    statistics.medicationCartAdherence > 0 ||
    statistics.patientsWithErrors > 0;

  const handleExport = (format: "PDF" | "CSV") => {
    console.log(`Exporting data as ${format} with filters:`, filters);
    console.log("Statistics data:", statistics);

    // Simulate export process
    setTimeout(() => {
      console.log(
        `Export completed: estadisticas_${activeTab}_${new Date().toISOString().split("T")[0]}.${format.toLowerCase()}`
      );
      setShowExportDialog(false);
    }, 1000);
  };

  const MetricCard = ({
    title,
    value,
    isLoading,
  }: {
    title: string;
    value: number;
    isLoading: boolean;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? "..." : `${value}%`}
            </div>
            <Progress value={value} className="mt-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Enhanced Filters Component for Comparativo tab
  const EnhancedFilters = () => (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Línea Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Línea</label>
            <Select value={filters.linea} onValueChange={handleLineaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona línea" />
              </SelectTrigger>
              <SelectContent>
                {lineas.map((linea) => (
                  <SelectItem key={linea} value={linea}>
                    {linea}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Servicio Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Servicio
            </label>
            <Select
              value={filters.servicio}
              onValueChange={(value) => handleFilterChange("servicio", value)}
              disabled={!filters.linea}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona servicio" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableServicios().map((servicio) => (
                  <SelectItem key={servicio} value={servicio}>
                    {servicio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Personal Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Personal
            </label>
            <Select
              value={filters.personal}
              onValueChange={(value) => handleFilterChange("personal", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona personal" />
              </SelectTrigger>
              <SelectContent>
                {personalOptions.map((personal) => (
                  <SelectItem key={personal} value={personal}>
                    {personal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group By Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Agrupar por
            </label>
            <Select
              value={filters.groupBy}
              onValueChange={(value) => handleFilterChange("groupBy", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupByOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Rango de fechas
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={formatDateRange()}
                readOnly
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm text-foreground"
                placeholder="Selecciona rango de fechas"
              />
            </div>
            <Button variant="outline" size="sm">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                />
              </svg>
            </Button>
            <Button variant="outline" size="sm">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => {
              console.log("Applying filters:", filters);
            }}
            className="flex-1"
          >
            Aplicar Filtros
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                linea: "",
                servicio: "",
                personal: "",
                groupBy: "Día",
                dateRange: {
                  from: new Date(2025, 5, 22),
                  to: new Date(2025, 6, 22),
                },
              });
            }}
          >
            Limpiar
          </Button>
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            Exportar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Estadísticas</h1>
      </div>

      {/* Conditional Filters based on active tab */}
      {activeTab === "general" ? (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Línea Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Línea
                </label>
                <Select value={filters.linea} onValueChange={handleLineaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona línea" />
                  </SelectTrigger>
                  <SelectContent>
                    {lineas.map((linea) => (
                      <SelectItem key={linea} value={linea}>
                        {linea}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Rango de fechas
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={formatDateRange()}
                      readOnly
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm text-foreground"
                      placeholder="Selecciona rango de fechas"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                      />
                    </svg>
                  </Button>
                  <Button variant="outline" size="sm">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EnhancedFilters />
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg max-w-xs">
        <button
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            activeTab === "general"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("general")}
        >
          General
        </button>
        <button
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            activeTab === "comparativo"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("comparativo")}
        >
          Comparativo
        </button>
      </div>

      {/* Content - Same for both tabs */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-muted-foreground">
              Cargando estadísticas...
            </div>
          </div>
        ) : hasData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* On-Time Delivery */}
            <MetricCard
              title="Cumplimiento horario entrega"
              value={statistics.onTimeDelivery}
              isLoading={isLoading}
            />

            {/* On-Time Returns */}
            <MetricCard
              title="Cumplimiento horario devoluciones"
              value={statistics.onTimeReturns}
              isLoading={isLoading}
            />

            {/* Medication Cart Adherence */}
            <MetricCard
              title="Adherencia verificación carro medicamentos"
              value={statistics.medicationCartAdherence}
              isLoading={isLoading}
            />

            {/* Patients with Errors */}
            <MetricCard
              title="Pacientes con errores en entrega de medicamentos"
              value={statistics.patientsWithErrors}
              isLoading={isLoading}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center text-muted-foreground">
                No hay datos disponibles para los filtros seleccionados.
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Datos</DialogTitle>
            <DialogDescription>
              Selecciona el formato en el que deseas exportar los datos de
              estadísticas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              onClick={() => handleExport("PDF")}
              className="flex flex-col items-center justify-center p-6 h-24 border-2 border-dashed border-border hover:border-muted-foreground hover:bg-muted transition-colors"
            >
              <svg
                className="h-8 w-8 text-red-500 mb-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              <span className="text-sm font-medium">PDF</span>
            </Button>
            <Button
              onClick={() => handleExport("CSV")}
              className="flex flex-col items-center justify-center p-6 h-24 border-2 border-dashed border-border hover:border-muted-foreground hover:bg-muted transition-colors"
            >
              <svg
                className="h-8 w-8 text-green-500 mb-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              <span className="text-sm font-medium">CSV</span>
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
