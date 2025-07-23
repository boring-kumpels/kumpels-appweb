"use client";

import { useState } from "react";
import { Filter, X, Search, Bed } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PatientsTable } from "./patients-table";
import { FiltersDialog, FilterState } from "./filters-dialog";

export interface Patient {
  id: string;
  servicio: string;
  cama: string;
  identificacion: string;
  paciente: string;
  predespacho: {
    status: "ok" | "pending" | "in_progress" | "error";
    time?: string;
  };
  alistamiento: {
    status: "ok" | "pending" | "in_progress" | "error";
    time?: string;
  };
  validacion: {
    status: "ok" | "pending" | "in_progress" | "error";
    time?: string;
  };
  entrega: {
    status: "ok" | "pending" | "in_progress" | "error";
    time?: string;
  };
  devolucion: {
    status: "ok" | "pending" | "in_progress" | "error";
    time?: string;
  };
}

// Mock data based on the image
const mockPatients: Patient[] = [
  {
    id: "1",
    servicio: "Cardiología",
    cama: "101-A",
    identificacion: "12345678",
    paciente: "María García López",
    predespacho: { status: "ok" },
    alistamiento: { status: "ok" },
    validacion: { status: "in_progress" },
    entrega: { status: "pending" },
    devolucion: { status: "pending" },
  },
  {
    id: "2",
    servicio: "Neurología",
    cama: "102-B",
    identificacion: "87654321",
    paciente: "Juan Pérez Morales",
    predespacho: { status: "ok" },
    alistamiento: { status: "in_progress" },
    validacion: { status: "pending" },
    entrega: { status: "pending" },
    devolucion: { status: "pending" },
  },
  {
    id: "3",
    servicio: "Oncología",
    cama: "201-A",
    identificacion: "11223344",
    paciente: "Carmen Rodríguez Silva",
    predespacho: { status: "ok" },
    alistamiento: { status: "ok" },
    validacion: { status: "ok" },
    entrega: { status: "error" },
    devolucion: { status: "in_progress" },
  },
];

const initialFilters: FilterState = {
  lineas: ["Todas las líneas"],
  servicios: [],
  camas: [],
};

// Service and bed data based on lines
const serviceData = {
  "Línea 1": [
    "UCI Pediátrica Cardiovascular",
    "UCI Quirúrgica",
    "UCI Pediátrica General",
  ],
  "Línea 2": [
    "Segundo Adultos",
    "Pabellón Benefactores",
    "Unidad de Trasplantes",
  ],
  "Línea 3": ["Tercero Adultos", "Cuarto Adultos", "Segundo Pediatría"],
  "Línea 4": [
    "Tercero Pediatría",
    "Suite Pediátrica",
    "Neonatos",
    "Tercero Renal",
    "Quinto Renal",
    "Sexto Renal",
  ],
  "Línea 5": [
    "UCI Médica 1",
    "UCI Médica 2",
    "UCI Médica 3",
    "UCI Cardiovascular",
    "Urgencias",
  ],
};

const bedData = {
  "UCI Pediátrica Cardiovascular": [
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
  "UCI Quirúrgica": [
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
  "UCI Pediátrica General": [
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
  "Segundo Adultos": [
    "213A",
    "213B",
    "213C",
    "213D",
    "214A",
    "214B",
    "214C",
    "214D",
    "215A",
    "215B",
    "215C",
    "215D",
    "216A",
    "216B",
    "216C",
    "216D",
    "217A",
    "217B",
    "217C",
    "218A",
    "218B",
    "218C",
    "218D",
    "219A",
    "219B",
    "219C",
    "220",
    "221",
    "222A",
    "222B",
    "223A",
    "223B",
    "224A",
    "224B",
    "224C",
    "224D",
    "225A",
    "225B",
    "226A",
    "226B",
    "227A",
    "227B",
    "228A",
    "228B",
    "228C",
    "228D",
  ],
  "Pabellón Benefactores": [
    "ST1A",
    "ST1B",
    "ST2",
    "ST3A",
    "ST3B",
    "ST4",
    "ST5A",
    "ST5B",
    "ST6",
    "ST7A",
    "ST7B",
    "ST8A",
    "ST8B",
    "ST8C",
    "ST9",
    "ST10A",
    "ST10B",
    "ST11",
    "ST12",
    "ST13",
    "ST14",
    "ST15",
  ],
  "Unidad de Trasplantes": ["UT1", "UT2", "UT3", "UT4", "UT5", "UT6", "UT7"],
};

export default function PacientesOnTimeManagement() {
  const [patients] = useState<Patient[]>(mockPatients);
  const [isLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isBedSelectionOpen, setIsBedSelectionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("Todos los servicios");
  const [selectedLine, setSelectedLine] = useState("Todas las líneas");
  const [selectedBeds, setSelectedBeds] = useState<string[]>([]);

  const activeFiltersCount = [
    ...filters.lineas,
    ...filters.servicios,
    ...filters.camas,
  ].length;

  const handleFiltersApply = (newFilters: FilterState) => {
    setFilters(newFilters);
    setIsFiltersOpen(false);
    console.log("Applying filters:", newFilters);
  };

  const handleFiltersClear = () => {
    setFilters({ lineas: [], servicios: [], camas: [] });
  };

  const handleOpenPatientDetail = (patient: Patient) => {
    console.log("Opening patient detail for:", patient.paciente);
  };

  const lineOptions = [
    "Todas las líneas",
    "Línea 1",
    "Línea 2",
    "Línea 3",
    "Línea 4",
    "Línea 5",
  ];

  // Get available services based on selected line
  const getAvailableServices = () => {
    if (selectedLine === "Todas las líneas") {
      return ["Todos los servicios"];
    }
    return [
      "Todos los servicios",
      ...(serviceData[selectedLine as keyof typeof serviceData] || []),
    ];
  };

  // Get available beds based on selected service
  const getAvailableBeds = () => {
    if (selectedService === "Todos los servicios") {
      return [];
    }
    return bedData[selectedService as keyof typeof bedData] || [];
  };

  const handleBedSelection = (bed: string) => {
    setSelectedBeds((prev) =>
      prev.includes(bed) ? prev.filter((b) => b !== bed) : [...prev, bed]
    );
  };

  const handleBedSelectionApply = () => {
    setIsBedSelectionOpen(false);
    console.log("Selected beds:", selectedBeds);
  };

  const handleBedSelectionClear = () => {
    setSelectedBeds([]);
  };

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
              {lineOptions.map((line) => (
                <Button
                  key={line}
                  variant={selectedLine === line ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedLine(line);
                    setSelectedService("Todos los servicios");
                    setSelectedBeds([]);
                  }}
                  className="rounded-full"
                >
                  {line}
                </Button>
              ))}
            </div>
          </div>

          {/* Service and Bed Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Servicios</h4>
              <Select
                value={selectedService}
                onValueChange={(value) => {
                  setSelectedService(value);
                  setSelectedBeds([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableServices().map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Camas</h4>
              <Dialog
                open={isBedSelectionOpen}
                onOpenChange={setIsBedSelectionOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={selectedService === "Todos los servicios"}
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
                      Camas Disponibles - {selectedService}
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
                      {getAvailableBeds().map((bed) => (
                        <Button
                          key={bed}
                          variant={
                            selectedBeds.includes(bed) ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleBedSelection(bed)}
                          className="h-10"
                        >
                          {bed}
                        </Button>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
            <div className="flex items-center gap-2">
          
            </div>
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
