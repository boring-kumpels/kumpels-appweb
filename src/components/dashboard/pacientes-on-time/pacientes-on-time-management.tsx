"use client";

import { useState, useMemo } from "react";
import { Search, Bed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { PatientsTable } from "./patients-table";
import { usePatients } from "@/hooks/use-patients";
import { useLines } from "@/hooks/use-lines-beds";
import { PatientWithRelations, PatientStatus, LineName } from "@/types/patient";

export default function PacientesOnTimeManagement() {
  const [isBedSelectionOpen, setIsBedSelectionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLineName, setSelectedLineName] = useState<LineName | "">("");
  const [selectedBeds, setSelectedBeds] = useState<string[]>([]);

  // Fetch data from API
  const { data: patients = [], isLoading, error } = usePatients({
    filters: {
      status: PatientStatus.ACTIVE,
      ...(searchQuery && { search: searchQuery }),
      ...(selectedLineName && { lineName: selectedLineName }),
    },
  });

  const { data: lines = [], isLoading: linesLoading } = useLines();

  const handleOpenPatientDetail = (patient: PatientWithRelations) => {
    console.log("Opening patient detail for:", `${patient.firstName} ${patient.lastName}`);
  };

  // Get available beds for the selected line
  const availableBeds = useMemo(() => {
    if (!selectedLineName) return [];
    const selectedLine = lines.find(line => line.name === selectedLineName);
    return selectedLine?.beds || [];
  }, [selectedLineName, lines]);

  const handleBedSelection = (bedId: string) => {
    setSelectedBeds((prev) =>
      prev.includes(bedId) ? prev.filter((b) => b !== bedId) : [...prev, bedId]
    );
  };

  const handleBedSelectionApply = () => {
    setIsBedSelectionOpen(false);
    console.log("Selected beds:", selectedBeds);
  };

  const handleBedSelectionClear = () => {
    setSelectedBeds([]);
  };

  // Show loading state
  if (isLoading || linesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando pacientes...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500">Error al cargar los pacientes</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Combined Filters Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            {/* Search Section */}
            <div className="flex-1 max-w-md ml-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, cama o identificación..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Line Filter */}
          <div>
            <h4 className="text-sm font-medium mb-2">Filtro por Línea</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedLineName === "" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedLineName("");
                  setSelectedBeds([]);
                }}
                className="rounded-full"
              >
                Todas las líneas
              </Button>
              {lines.map((line) => (
                <Button
                  key={line.name}
                  variant={selectedLineName === line.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedLineName(line.name as LineName);
                    setSelectedBeds([]);
                  }}
                  className="rounded-full"
                >
                  {line.displayName}
                </Button>
              ))}
            </div>
          </div>

          {/* Bed Filter */}
          <div>
            <h4 className="text-sm font-medium mb-2">Filtro por Cama</h4>
            <Dialog
              open={isBedSelectionOpen}
              onOpenChange={setIsBedSelectionOpen}
            >
              <DialogTrigger asChild>
                                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={!selectedLineName}
                  >
                    <Bed className="h-4 w-4 mr-2" />
                    {selectedBeds.length > 0
                      ? `${selectedBeds.length} cama${selectedBeds.length > 1 ? "s" : ""} seleccionada${selectedBeds.length > 1 ? "s" : ""}`
                      : "Seleccionar camas"}
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>
                    Camas Disponibles - {lines.find(l => l.name === selectedLineName)?.displayName || 'Línea'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Selecciona una o múltiples camas
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBedSelectionClear}
                      >
                        Limpiar
                      </Button>
                      <Button size="sm" onClick={handleBedSelectionApply}>
                        Aplicar ({selectedBeds.length})
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-2 max-h-[60vh] overflow-y-auto">
                    {availableBeds.map((bed) => (
                      <Button
                        key={bed.id}
                        variant={
                          selectedBeds.includes(bed.id) ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleBedSelection(bed.id)}
                        className="h-10"
                      >
                        {bed.number}
                      </Button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Pacientes Activos ({patients.length} pacientes)
            </CardTitle>
            <div className="flex items-center gap-2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <PatientsTable
            patients={patients}
            isLoading={isLoading}
            onOpenPatientDetail={handleOpenPatientDetail}
          />
        </CardContent>
      </Card>
    </div>
  );
}
