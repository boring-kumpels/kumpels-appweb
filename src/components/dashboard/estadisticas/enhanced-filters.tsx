"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Filter, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface EnhancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApply: () => void;
  onClear: () => void;
  onExport: () => void;
}

const lineas = [
  {
    value: "línea 1",
    label: "Línea 1",
    description: "UCI Pediátrica y Cardiovascular",
  },
  { value: "línea 2", label: "Línea 2", description: "Adultos y Trasplantes" },
  { value: "línea 3", label: "Línea 3", description: "Adultos y Pediatría" },
  { value: "línea 4", label: "Línea 4", description: "Pediatría y Neonatos" },
  {
    value: "ucis",
    label: "UCIs",
    description: "Unidades de Cuidado Intensivo",
  },
];

const servicios = {
  "línea 1": [
    {
      value: "uci pediátrica cardiovascular",
      label: "UCI Pediátrica Cardiovascular",
    },
    { value: "uci quirúrgica", label: "UCI Quirúrgica" },
    { value: "uci pediátrica general", label: "UCI Pediátrica General" },
  ],
  "línea 2": [
    { value: "segundo adultos", label: "Segundo Adultos" },
    { value: "pebellón benefactores", label: "Pabellón Benefactores" },
    { value: "unidad de trasplantes", label: "Unidad de Trasplantes" },
  ],
  "línea 3": [
    { value: "tercero adultos", label: "Tercero Adultos" },
    { value: "cuarto adultos", label: "Cuarto Adultos" },
    { value: "segundo pediatría", label: "Segundo Pediatría" },
  ],
  "línea 4": [
    { value: "tercero pediatría", label: "Tercero Pediatría" },
    { value: "suite pediátrica", label: "Suite Pediátrica" },
    { value: "neonatos", label: "Neonatos" },
    { value: "tercero renaldo", label: "Tercero Renal" },
    { value: "quinto renaldo", label: "Quinto Renal" },
    { value: "sexto renaldo", label: "Sexto Renal" },
  ],
  ucis: [
    { value: "uci medica 1", label: "UCI Médica 1" },
    { value: "uci medica 2", label: "UCI Médica 2" },
    { value: "uci medica 3", label: "UCI Médica 3" },
    { value: "uci cardiovascular", label: "UCI Cardiovascular" },
    { value: "urgencias", label: "Urgencias" },
  ],
};

const personalOptions = [
  {
    value: "PharmacyRegents",
    label: "Farmacéuticos Regentes",
    description: "Personal farmacéutico",
  },
  {
    value: "Nurse",
    label: "Enfermeros",
    description: "Personal de enfermería",
  },
  {
    value: "SUPERUSER",
    label: "Superusuarios",
    description: "Administradores del sistema",
  },
];

const groupByOptions = [
  { value: "Día", label: "Por Día", description: "Agrupar datos diariamente" },
  {
    value: "Semana",
    label: "Por Semana",
    description: "Agrupar datos semanalmente",
  },
  { value: "Mes", label: "Por Mes", description: "Agrupar datos mensualmente" },
];

export function EnhancedFilters({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  onExport,
}: EnhancedFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleLineaChange = (linea: string) => {
    onFiltersChange({
      ...filters,
      linea,
      servicio: "", // Reset servicio when linea changes
    });
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

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.linea) count++;
    if (filters.servicio) count++;
    if (filters.personal) count++;
    return count;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">Filtros de Estadísticas</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {getActiveFiltersCount()} filtro
                {getActiveFiltersCount() !== 1 ? "s" : ""} activo
                {getActiveFiltersCount() !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Línea Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Línea
              <span className="text-xs text-gray-500">(Requerido)</span>
            </label>
            <Select
              value={filters.linea}
              onValueChange={handleLineaChange}
              onOpenChange={(open) => setActiveFilter(open ? "linea" : null)}
            >
              <SelectTrigger
                className={cn(
                  "transition-all duration-200",
                  activeFilter === "linea" &&
                    "ring-2 ring-blue-500 ring-offset-2"
                )}
              >
                <SelectValue placeholder="Selecciona una línea" />
              </SelectTrigger>
              <SelectContent>
                {lineas.map((linea) => (
                  <SelectItem key={linea.value} value={linea.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{linea.label}</span>
                      <span className="text-xs text-gray-500">
                        {linea.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Servicio Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Servicio
              {filters.linea && (
                <span className="text-xs text-gray-500 ml-2">(Opcional)</span>
              )}
            </label>
            <Select
              value={filters.servicio}
              onValueChange={(value) => handleFilterChange("servicio", value)}
              disabled={!filters.linea}
              onOpenChange={(open) => setActiveFilter(open ? "servicio" : null)}
            >
              <SelectTrigger
                className={cn(
                  "transition-all duration-200",
                  activeFilter === "servicio" &&
                    "ring-2 ring-blue-500 ring-offset-2",
                  !filters.linea && "opacity-50 cursor-not-allowed"
                )}
              >
                <SelectValue
                  placeholder={
                    filters.linea
                      ? "Selecciona un servicio"
                      : "Selecciona línea primero"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {getAvailableServicios().map((servicio) => (
                  <SelectItem key={servicio.value} value={servicio.value}>
                    {servicio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Personal Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Personal
              <span className="text-xs text-gray-500 ml-2">(Opcional)</span>
            </label>
            <Select
              value={filters.personal}
              onValueChange={(value) => handleFilterChange("personal", value)}
              onOpenChange={(open) => setActiveFilter(open ? "personal" : null)}
            >
              <SelectTrigger
                className={cn(
                  "transition-all duration-200",
                  activeFilter === "personal" &&
                    "ring-2 ring-blue-500 ring-offset-2"
                )}
              >
                <SelectValue placeholder="Selecciona personal" />
              </SelectTrigger>
              <SelectContent>
                {personalOptions.map((personal) => (
                  <SelectItem key={personal.value} value={personal.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{personal.label}</span>
                      <span className="text-xs text-gray-500">
                        {personal.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group By Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Agrupar por
              <span className="text-xs text-gray-500 ml-2">(Opcional)</span>
            </label>
            <Select
              value={filters.groupBy}
              onValueChange={(value) => handleFilterChange("groupBy", value)}
              onOpenChange={(open) => setActiveFilter(open ? "groupBy" : null)}
            >
              <SelectTrigger
                className={cn(
                  "transition-all duration-200",
                  activeFilter === "groupBy" &&
                    "ring-2 ring-blue-500 ring-offset-2"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupByOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-500">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Rango de fechas
            <span className="text-xs text-gray-500">(Requerido)</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formatDateRange()}
                readOnly
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Selecciona rango de fechas"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveFilter("dateRange")}
              className={cn(
                "transition-all duration-200",
                activeFilter === "dateRange" &&
                  "ring-2 ring-blue-500 ring-offset-2"
              )}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClear}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Limpiar
            </Button>
            <span className="text-sm text-gray-500">Todos los filtros</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button
              onClick={onApply}
              disabled={!filters.linea}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
