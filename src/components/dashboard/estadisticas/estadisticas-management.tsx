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
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatisticsData {
  onTimeDelivery: number;
  onTimeReturns: number;
  medicationCartAdherence: number;
  patientsWithErrors: number;
}

interface ComparativeData {
  averageTimePerStage: {
    total: number;
    change: number;
    lines: {
      name: string;
      predespacho: number;
      alistamiento: number;
      verificacion: number;
      total: number;
    }[];
  };
  manualReturns: {
    total: number;
    change: number;
    percentage: number;
    distribution: {
      type: string;
      percentage: number;
      color: string;
    }[];
  };
  supplyReturnsByPatient: {
    current: number;
    change: number;
    totalReturns: number;
    distribution: {
      total: number;
      manual: number;
    };
    historical: {
      month: string;
      total: number;
      manual: number;
    }[];
  };
  averageMinutesVsAgreed: {
    deliveries: {
      value: string;
      change: number;
    };
    returns: {
      value: string;
      change: number;
    };
    historical: {
      date: string;
      deliveries: number;
      returns: number;
    }[];
  };
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

  const [comparativeData] = useState<ComparativeData>({
    averageTimePerStage: {
      total: 400,
      change: 10,
      lines: [
        {
          name: "Línea 1",
          predespacho: 30,
          alistamiento: 16,
          verificacion: 30,
          total: 76,
        },
        {
          name: "Línea 2",
          predespacho: 14,
          alistamiento: 60,
          verificacion: 30,
          total: 104,
        },
        {
          name: "Línea 3",
          predespacho: 14,
          alistamiento: 35,
          verificacion: 40,
          total: 89,
        },
      ],
    },
    manualReturns: {
      total: 80,
      change: 10,
      percentage: 40,
      distribution: [
        {
          type: "Cambio de vía de admon",
          percentage: 50,
          color: "bg-blue-600",
        },
        { type: "Cambio de forma", percentage: 35, color: "bg-blue-400" },
        { type: "Cambio de dosis", percentage: 15, color: "bg-blue-300" },
      ],
    },
    supplyReturnsByPatient: {
      current: 30,
      change: 1,
      totalReturns: 1000,
      distribution: { total: 60, manual: 40 },
      historical: [
        { month: "Jan", total: 12, manual: 2.4 },
        { month: "Feb", total: 15, manual: 3 },
        { month: "Mar", total: 8, manual: 1.6 },
        { month: "Apr", total: 16, manual: 3.2 },
        { month: "Mai", total: 12, manual: 2.4 },
        { month: "Jun", total: 6, manual: 1.2 },
        { month: "Jul", total: 15, manual: 3 },
      ],
    },
    averageMinutesVsAgreed: {
      deliveries: { value: "-5:00", change: 2 },
      returns: { value: "+10:00", change: -5 },
      historical: [
        { date: "01/06/2024", deliveries: 0.5, returns: 0.5 },
        { date: "02/06/2024", deliveries: 2, returns: 1.5 },
        { date: "03/06/2024", deliveries: -2, returns: -2.5 },
        { date: "04/06/2024", deliveries: -0.5, returns: -0.5 },
      ],
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showReturnsExportDialog, setShowReturnsExportDialog] = useState(false);

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

  // Average Time Per Stage Card
  const AverageTimePerStageCard = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Tiempo promedio por etapa por línea
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">
              {comparativeData.averageTimePerStage.total} horas
            </span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-500">
                {comparativeData.averageTimePerStage.change}%
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {comparativeData.averageTimePerStage.lines.map((line) => (
              <div key={line.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{line.name}</span>
                  <span className="text-sm font-bold">{line.total}</span>
                </div>
                <div className="flex space-x-1 h-4">
                  <div
                    className="bg-blue-800 rounded-l"
                    style={{
                      width: `${(line.predespacho / line.total) * 100}%`,
                    }}
                    title={`Predespacho: ${line.predespacho}`}
                  />
                  <div
                    className="bg-blue-600"
                    style={{
                      width: `${(line.alistamiento / line.total) * 100}%`,
                    }}
                    title={`Alistamiento: ${line.alistamiento}`}
                  />
                  <div
                    className="bg-blue-400 rounded-r"
                    style={{
                      width: `${(line.verificacion / line.total) * 100}%`,
                    }}
                    title={`Verificación: ${line.verificacion}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-800 rounded"></div>
              <span>Predespacho</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span>Alistamiento</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span>Verificación</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Manual Returns Card
  const ManualReturnsCard = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Devoluciones manuales
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">
              #{comparativeData.manualReturns.total}
            </span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-500">
                {comparativeData.manualReturns.change}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${comparativeData.manualReturns.percentage * 2.26} 226`}
                  className="text-blue-600"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">
                  {comparativeData.manualReturns.percentage}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {comparativeData.manualReturns.distribution.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 ${item.color} rounded`}></div>
                  <span className="text-sm">{item.type}</span>
                </div>
                <span className="text-sm font-medium">{item.percentage}%</span>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Distribución del tipo de intervención
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Supply Returns by Patient Card
  const SupplyReturnsByPatientCard = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Devoluciones de insumos por pacientes
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">
              {comparativeData.supplyReturnsByPatient.current}%
            </span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-500">
                {comparativeData.supplyReturnsByPatient.change}%
              </span>
            </div>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-bold text-blue-600">
              {comparativeData.supplyReturnsByPatient.totalReturns} Devoluciones
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Distribución del tipo de devolución</span>
            </div>
            <div className="flex space-x-1 h-4">
              <div
                className="bg-blue-400 rounded-l"
                style={{
                  width: `${comparativeData.supplyReturnsByPatient.distribution.manual}%`,
                }}
              />
              <div
                className="bg-blue-600 rounded-r"
                style={{
                  width: `${comparativeData.supplyReturnsByPatient.distribution.total}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span>
                {comparativeData.supplyReturnsByPatient.distribution.manual}%
              </span>
              <span>
                {comparativeData.supplyReturnsByPatient.distribution.total}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Average Minutes vs Agreed Times Card
  const AverageMinutesVsAgreedCard = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Promedio de minutos vs Acuerdos
          </h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {comparativeData.averageMinutesVsAgreed.deliveries.value}
              </div>
              <div className="flex items-center justify-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">
                  {comparativeData.averageMinutesVsAgreed.deliveries.change}%
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {comparativeData.averageMinutesVsAgreed.returns.value}
              </div>
              <div className="flex items-center justify-center space-x-1">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-500">
                  {comparativeData.averageMinutesVsAgreed.returns.change}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">HISTÓRICO</div>
            <div className="space-y-1">
              {comparativeData.averageMinutesVsAgreed.historical.map((item) => (
                <div
                  key={item.date}
                  className="flex items-center justify-between text-xs"
                >
                  <span>{item.date}</span>
                  <div className="flex space-x-4">
                    <span
                      className={
                        item.deliveries >= 0
                          ? "text-blue-600"
                          : "text-green-600"
                      }
                    >
                      {item.deliveries >= 0 ? "+" : ""}
                      {item.deliveries.toFixed(1)}
                    </span>
                    <span
                      className={
                        item.returns >= 0 ? "text-blue-600" : "text-green-600"
                      }
                    >
                      {item.returns >= 0 ? "+" : ""}
                      {item.returns.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Limpiar
          </Button>
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <svg
              className="h-4 w-4 mr-2"
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
            Exportar
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowReturnsExportDialog(true)}
          >
            <svg
              className="h-4 w-4 mr-2"
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
            Exportar Devoluciones
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

      {/* Content - Different for each tab */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-muted-foreground">
              Cargando estadísticas...
            </div>
          </div>
        ) : activeTab === "general" ? (
          // General tab content
          hasData ? (
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
          )
        ) : (
          // Comparativo tab content
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AverageTimePerStageCard />
            <ManualReturnsCard />
            <SupplyReturnsByPatientCard />
            <AverageMinutesVsAgreedCard />
          </div>
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

      {/* Returns Export Dialog */}
      <Dialog
        open={showReturnsExportDialog}
        onOpenChange={setShowReturnsExportDialog}
      >
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <svg
                className="h-5 w-5"
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
              <span>Exportar Consolidado de Devoluciones Manuales</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Rango de Fechas
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Fecha Inicio
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="mm/dd/yyyy"
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Fecha Fin
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="mm/dd/yyyy"
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Medications */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Medicamentos Devueltos
              </label>
              <div className="space-y-2">
                {[
                  "Paracetamol",
                  "Amoxicilina",
                  "Loratadina",
                  "Ibuprofeno",
                  "Omeprazol",
                ].map((med) => (
                  <div key={med} className="flex items-center space-x-2">
                    <input type="checkbox" id={med} className="rounded" />
                    <label htmlFor={med} className="text-sm text-foreground">
                      {med}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* User */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Usuario que Generó o Aceptó
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los usuarios</SelectItem>
                  <SelectItem value="usuario1">Usuario 1</SelectItem>
                  <SelectItem value="usuario2">Usuario 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Return Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Causa de Devolución
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar causa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las causas</SelectItem>
                  <SelectItem value="causa1">Causa 1</SelectItem>
                  <SelectItem value="causa2">Causa 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Patients */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Pacientes
              </label>
              <div className="space-y-2">
                {[
                  "María García López",
                  "Juan Pérez Morales",
                  "Carmen Rodríguez Silva",
                ].map((patient) => (
                  <div key={patient} className="flex items-center space-x-2">
                    <input type="checkbox" id={patient} className="rounded" />
                    <label
                      htmlFor={patient}
                      className="text-sm text-foreground"
                    >
                      {patient}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Service */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Servicio
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los servicios</SelectItem>
                  <SelectItem value="servicio1">Servicio 1</SelectItem>
                  <SelectItem value="servicio2">Servicio 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                // Clear all filters
                console.log("Clearing filters...");
              }}
              className="flex items-center space-x-2"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>Limpiar Filtros</span>
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowReturnsExportDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  console.log("Exporting returns with filters...");
                  setShowReturnsExportDialog(false);
                }}
                className="flex items-center space-x-2"
              >
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
                <span>Exportar</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
