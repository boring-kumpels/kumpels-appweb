"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FilterState } from "./pacientes-on-time-management";

interface FiltersDialogProps {
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
}

// Mock data based on the screenshots
const filterOptions = {
  lineas: ["línea 1"],
  servicios: {
    "línea 1": [
      "uci pediátrica cardiovascular",
      "uci quirúrgica",
      "uci pediátrica general",
    ],
  },
  camas: {
    "uci pediátrica cardiovascular": [
      "PC01",
      "PC02",
      "PC03",
      "PC04",
      "PC05",
      "PC06",
      "PC07",
      "PC08",
      "PC09",
      "PC10",
      "PC11",
      "PC12",
      "PC13",
      "PC14",
      "PC15",
      "PC16",
      "PC17",
      "PC18",
      "PC19",
      "PC20",
      "PC21",
      "PC22",
    ],
    "uci quirúrgica": [
      "UQ1",
      "UQ2",
      "UQ3",
      "UQ4",
      "UQ5",
      "UQ6",
      "UQ7",
      "UQ8",
      "UQ9",
      "UQ10",
    ],
    "uci pediátrica general": [
      "UP01",
      "UP02",
      "UP03",
      "UP04",
      "UP05",
      "UP06",
      "UP07",
      "UP08",
      "UP09",
      "UP10",
      "UP11",
      "UP12",
      "UP13",
      "UP14",
      "UP15",
      "UP16",
      "UP17",
      "UP18",
      "UP19",
      "UP20",
      "UP21",
      "UP22",
      "UP23",
    ],
  },
};

export function FiltersDialog({
  filters,
  onApply,
  onClear,
}: FiltersDialogProps) {
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  const [selectedTab, setSelectedTab] = useState<
    "lineas" | "servicios" | "camas"
  >("lineas");

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const handleLineaToggle = (linea: string) => {
    const newLineas = tempFilters.lineas.includes(linea)
      ? tempFilters.lineas.filter((l) => l !== linea)
      : [...tempFilters.lineas, linea];

    setTempFilters((prev) => ({
      ...prev,
      lineas: newLineas,
      // Clear servicios and camas when linea changes
      servicios: [],
      camas: [],
    }));
  };

  const handleServicioToggle = (servicio: string) => {
    const newServicios = tempFilters.servicios.includes(servicio)
      ? tempFilters.servicios.filter((s) => s !== servicio)
      : [...tempFilters.servicios, servicio];

    setTempFilters((prev) => ({
      ...prev,
      servicios: newServicios,
      // Clear camas when servicio changes
      camas: [],
    }));
  };

  const handleCamaToggle = (cama: string) => {
    const newCamas = tempFilters.camas.includes(cama)
      ? tempFilters.camas.filter((c) => c !== cama)
      : [...tempFilters.camas, cama];

    setTempFilters((prev) => ({
      ...prev,
      camas: newCamas,
    }));
  };

  const handleApply = () => {
    onApply(tempFilters);
  };

  const handleClear = () => {
    setTempFilters({ lineas: [], servicios: [], camas: [] });
    onClear();
  };

  const getAvailableServicios = () => {
    if (tempFilters.lineas.length === 0) return [];

    return tempFilters.lineas.flatMap(
      (linea) =>
        filterOptions.servicios[
          linea as keyof typeof filterOptions.servicios
        ] || []
    );
  };

  const getAvailableCamas = () => {
    if (tempFilters.servicios.length === 0) return [];

    return tempFilters.servicios.flatMap(
      (servicio) =>
        filterOptions.camas[servicio as keyof typeof filterOptions.camas] || []
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            selectedTab === "lineas"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setSelectedTab("lineas")}
        >
          Líneas
        </button>
        <button
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            selectedTab === "servicios"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setSelectedTab("servicios")}
        >
          Servicios
        </button>
        <button
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
            selectedTab === "camas"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setSelectedTab("camas")}
        >
          Camas
        </button>
      </div>

      {/* Filter Content */}
      <div className="min-h-[300px]">
        {selectedTab === "lineas" && (
          <div className="space-y-3">
            {filterOptions.lineas.map((linea) => (
              <Button
                key={linea}
                variant={
                  tempFilters.lineas.includes(linea) ? "default" : "outline"
                }
                className="w-full justify-start"
                onClick={() => handleLineaToggle(linea)}
              >
                {linea}
              </Button>
            ))}
          </div>
        )}

        {selectedTab === "servicios" && (
          <div className="space-y-3">
            {tempFilters.lineas.length === 0 ? (
              <p className="text-muted-foreground text-center">
                Selecciona una línea primero
              </p>
            ) : (
              getAvailableServicios().map((servicio) => (
                <Button
                  key={servicio}
                  variant={
                    tempFilters.servicios.includes(servicio)
                      ? "default"
                      : "outline"
                  }
                  className="w-full justify-start"
                  onClick={() => handleServicioToggle(servicio)}
                >
                  {servicio}
                </Button>
              ))
            )}
          </div>
        )}

        {selectedTab === "camas" && (
          <div className="space-y-3">
            {tempFilters.servicios.length === 0 ? (
              <p className="text-muted-foreground text-center">
                Selecciona un servicio primero
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {getAvailableCamas().map((cama) => (
                  <Button
                    key={cama}
                    variant={
                      tempFilters.camas.includes(cama) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleCamaToggle(cama)}
                  >
                    {cama}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <div className="space-x-2">
          <Button variant="outline" onClick={handleClear}>
            Borrar
          </Button>
          <span className="text-sm text-muted-foreground">Todos</span>
        </div>
        <Button onClick={handleApply}>Aplicar</Button>
      </div>
    </div>
  );
}
