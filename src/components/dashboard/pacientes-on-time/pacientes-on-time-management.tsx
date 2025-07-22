"use client";

import { useState, useEffect, useCallback } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PatientsTable } from "./patients-table";
import { FiltersDialog } from "./filters-dialog";

export interface Patient {
  id: string;
  cama: string;
  identificacion: string;
  paciente: string;
  detalle: string;
  distribución: {
    status: "pending" | "in_progress" | "completed" | "error";
    time?: string;
  };
  devoluciones: {
    status: "pending" | "completed" | "error";
    time?: string;
  };
}

export interface FilterState {
  lineas: string[];
  servicios: string[];
  camas: string[];
}

// Mock data based on the screenshots
const mockPatients: Patient[] = [
  {
    id: "1",
    cama: "PC01",
    identificacion: "123123123",
    paciente: "JESUS PEREZ",
    detalle: "PC01",
    distribución: { status: "error" },
    devoluciones: { status: "pending" },
  },
  {
    id: "2",
    cama: "PC02",
    identificacion: "1762732730",
    paciente: "FRANCISCO JOSE DORN SANDOVAL",
    detalle: "PC02",
    distribución: { status: "completed" },
    devoluciones: { status: "pending" },
  },
  {
    id: "3",
    cama: "PC03",
    identificacion: "2507511051336",
    paciente: "HIJO DE YENNY COLORADO CUEVAS",
    detalle: "PC03",
    distribución: { status: "completed" },
    devoluciones: { status: "pending" },
  },
  {
    id: "4",
    cama: "PC04",
    identificacion: "123123315",
    paciente: "Jorge Martinez",
    detalle: "PC04",
    distribución: { status: "error" },
    devoluciones: { status: "pending" },
  },
  {
    id: "5",
    cama: "PC05",
    identificacion: "2507531024032",
    paciente: "HIJO DE ANDREA VANESSA ACOSTA MARTINEZ",
    detalle: "PC05",
    distribución: { status: "completed" },
    devoluciones: { status: "pending" },
  },
];

const initialFilters: FilterState = {
  lineas: ["línea 1"],
  servicios: [],
  camas: [],
};

export default function PacientesOnTimeManagement() {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const activeFiltersCount = [
    ...filters.lineas,
    ...filters.servicios,
    ...filters.camas,
  ].length;

  const handleFiltersApply = (newFilters: FilterState) => {
    setFilters(newFilters);
    setIsFiltersOpen(false);
    // Here you would typically filter the patients based on the selected filters
    console.log("Applying filters:", newFilters);
  };

  const handleFiltersClear = () => {
    setFilters({ lineas: [], servicios: [], camas: [] });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              línea 1
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Status indicators */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Vacío</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">
                    Pendiente
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">
                    En curso
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">
                    Completado
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Error</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-2 py-4">
            <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Filtros</DialogTitle>
                </DialogHeader>
                <FiltersDialog
                  filters={filters}
                  onApply={handleFiltersApply}
                  onClear={handleFiltersClear}
                />
              </DialogContent>
            </Dialog>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFiltersClear}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-2" />
                Borrar filtros
              </Button>
            )}
          </div>

          {/* Patients Table */}
          <div className="border rounded-lg">
            <div className="bg-muted/50 px-4 py-2 border-b">
              <h3 className="font-medium">Lista de pacientes</h3>
            </div>
            <PatientsTable patients={patients} isLoading={isLoading} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
