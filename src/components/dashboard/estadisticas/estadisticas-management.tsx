"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { EnhancedFilters } from "./enhanced-filters";
import { ComparativeView } from "./comparative-view";

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

  const handleFilterChange = (key: keyof FilterState, value: any) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
      </div>

      {/* Conditional Filters based on active tab */}
      {activeTab === "general" ? (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Línea Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
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
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Rango de fechas
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={formatDateRange()}
                      readOnly
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm"
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
        <EnhancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          onApply={() => {
            // Trigger data refresh
            console.log("Applying filters:", filters);
          }}
          onClear={() => {
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
          onExport={() => {
            console.log("Exporting data with filters:", filters);
          }}
        />
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-xs">
        <button
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            activeTab === "general"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setActiveTab("general")}
        >
          General
        </button>
        <button
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            activeTab === "comparativo"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setActiveTab("comparativo")}
        >
          Comparativo
        </button>
      </div>

      {/* Content */}
      {activeTab === "general" ? (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-gray-500">
                Cargando estadísticas...
              </div>
            </div>
          ) : hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* On-Time Delivery */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">
                      Cumplimiento horario entrega
                    </h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-gray-900">
                        {statistics.onTimeDelivery}%
                      </div>
                      <Progress
                        value={statistics.onTimeDelivery}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* On-Time Returns */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">
                      Cumplimiento horario devoluciones
                    </h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-gray-900">
                        {statistics.onTimeReturns}%
                      </div>
                      <Progress
                        value={statistics.onTimeReturns}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medication Cart Adherence */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">
                      Adherencia verificación carro medicamentos
                    </h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-gray-900">
                        {statistics.medicationCartAdherence}%
                      </div>
                      <Progress
                        value={statistics.medicationCartAdherence}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Patients with Errors */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">
                      Pacientes con errores en entrega de medicamentos
                    </h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-gray-900">
                        {statistics.patientsWithErrors}%
                      </div>
                      <Progress
                        value={statistics.patientsWithErrors}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="text-center text-gray-500">
                  No hay datos disponibles para los filtros seleccionados.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <ComparativeView filters={filters} />
      )}
    </div>
  );
}
