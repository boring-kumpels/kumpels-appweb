"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterState {
  lineas: string[];
  servicios: string[];
  camas: string[];
}

interface FiltersDialogProps {
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
}

// Mock data based on the screenshots
const filterOptions = {
  lineas: [
    "Todas las líneas",
    "Línea 1",
    "Línea 2",
    "Línea 3",
    "Línea 4",
    "Línea 5",
  ],
  servicios: {
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
  },
  camas: {
    // Línea 1
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

    // Línea 2
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

    // Línea 3
    "Tercero Adultos": [
      "321",
      "322",
      "323",
      "324",
      "325",
      "326",
      "327",
      "328",
      "329A",
      "329B",
      "329C",
      "329D",
      "330",
      "331A",
      "331B",
      "331C",
      "331D",
      "332",
      "333",
      "334",
      "335",
      "336",
      "337",
      "338",
      "339",
      "340",
      "341A",
      "341B",
      "342A",
      "342B",
    ],
    "Cuarto Adultos": [
      "401",
      "402",
      "403",
      "404",
      "405",
      "406",
      "407",
      "408",
      "409",
      "410",
      "411",
      "412",
      "413A",
      "413B",
      "413C",
      "413D",
      "414A",
      "414B",
      "414C",
      "414D",
      "415A",
      "415B",
      "415C",
      "415D",
      "416A",
      "416B",
      "416C",
      "416D",
      "417",
      "418",
    ],
    "Segundo Pediatría": [
      "ST16A",
      "ST16B",
      "ST17",
      "ST18A",
      "ST18B",
      "ST19A",
      "ST19B",
      "ST20A",
      "ST20B",
      "ST21A",
      "ST21B",
      "ST22A",
      "ST22B",
    ],

    // Línea 4
    "Tercero Pediatría": [
      "308",
      "309A",
      "309B",
      "309C",
      "309D",
      "310",
      "311A",
      "311B",
      "311C",
      "311D",
      "313A",
      "313B",
      "313C",
      "313D",
      "314A",
      "314B",
      "314C",
      "315A",
      "315B",
      "316",
    ],
    "Suite Pediátrica": [
      "STP1",
      "STP2",
      "STP3",
      "STP4",
      "STP5",
      "STP6",
      "STP7",
      "302",
      "304",
      "306",
      "307A",
      "307B",
      "307C",
      "307D",
    ],
    Neonatos: [
      "NE01",
      "NE02",
      "NE03",
      "NE04",
      "NE05",
      "NE06",
      "NE07",
      "NE08",
      "NE09",
      "NE10",
      "NE11",
      "NE12",
      "NE13",
      "NE14",
      "NE15",
      "NE16",
      "NE17",
      "NE18",
      "NE19",
    ],
    "Tercero Renal": [
      "351",
      "352",
      "353",
      "354",
      "355",
      "356",
      "357",
      "358",
      "359",
      "360",
      "361",
      "362",
      "363",
      "364",
      "365",
      "366",
    ],
    "Quinto Renal": [
      "501",
      "502",
      "503",
      "504",
      "505",
      "506",
      "507",
      "508",
      "509",
      "510",
      "511",
      "512",
      "513",
      "514",
      "515",
      "516",
    ],
    "Sexto Renal": [
      "601",
      "602",
      "603",
      "604",
      "605",
      "606",
      "607",
      "608",
      "609",
      "610",
      "611",
      "612",
      "613",
      "614",
      "615",
      "616",
    ],

    // Línea 5
    "UCI Médica 1": [
      "UM1-01",
      "UM1-02",
      "UM1-03",
      "UM1-04",
      "UM1-05",
      "UM1-06",
      "UM1-07",
      "UM1-08",
      "UM1-09",
      "UM1-10",
      "UM1-11",
      "UM1-12",
    ],
    "UCI Médica 2": [
      "UM2-01",
      "UM2-02",
      "UM2-03",
      "UM2-04",
      "UM2-05",
      "UM2-06",
      "UM2-07",
      "UM2-08",
      "UM2-09",
      "UM2-10",
      "UM2-11",
      "UM2-12",
      "UM2-13",
      "UM2-14",
      "UM2-15",
      "UM2-16",
    ],
    "UCI Médica 3": [
      "UM3-01",
      "UM3-02",
      "UM3-03",
      "UM3-04",
      "UM3-05",
      "UM3-06",
      "UM3-07",
      "UM3-08",
      "UM3-09",
      "UM3-10",
      "UM3-11",
      "UM3-12",
      "UM3-13",
      "UM3-14",
      "UM3-15",
    ],
    "UCI Cardiovascular": [
      "UQ11",
      "UQ12",
      "UQ13",
      "UQ14",
      "UQ15",
      "UQ16",
      "UQ17",
      "UQ18",
      "UQ19",
      "UQ20",
      "UQ21",
      "UQ22",
      "UQ23",
      "UQ24",
    ],
    Urgencias: [
      "URG01",
      "URG02",
      "URG03",
      "URG04",
      "URG05",
      "URG06",
      "URG07",
      "URG08",
      "URG09",
      "URG10",
      "URG11",
      "URG12",
      "URG13",
      "URG14",
      "URG15",
      "URG16",
      "URG17",
      "URG18",
      "URG19",
      "URG20",
      "URG21",
      "URG22",
      "URG23",
      "URG24",
      "URG25",
      "URG26",
      "URG27",
      "URG28",
      "URG29",
      "URG30",
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
    const newLineas = [linea]; // Only allow one line selection

    setTempFilters((prev) => ({
      ...prev,
      lineas: newLineas,
      // Clear servicios and camas when linea changes
      servicios: [],
      camas: [],
    }));

    // Auto-advance to services tab
    setTimeout(() => setSelectedTab("servicios"), 100);
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

    // Auto-advance to camas tab when a service is selected
    if (!tempFilters.servicios.includes(servicio)) {
      setTimeout(() => setSelectedTab("camas"), 100);
    }
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

  const handleSelectAllServices = () => {
    if (tempFilters.lineas.length > 0) {
      const allServices = getAvailableServicios();
      setTempFilters((prev) => ({
        ...prev,
        servicios: allServices,
        camas: [], // Clear beds when selecting all services
      }));
      setTimeout(() => setSelectedTab("camas"), 100);
    }
  };

  const handleNext = () => {
    if (selectedTab === "lineas" && tempFilters.lineas.length > 0) {
      setSelectedTab("servicios");
    } else if (
      selectedTab === "servicios" &&
      tempFilters.servicios.length > 0
    ) {
      setSelectedTab("camas");
    }
  };

  const handleApply = () => {
    onApply(tempFilters);
  };

  const handleClear = () => {
    setTempFilters({ lineas: [], servicios: [], camas: [] });
    onClear();
    onApply({ lineas: [], servicios: [], camas: [] }); // Apply empty filters to show all data
  };

  const canGoNext = () => {
    if (selectedTab === "lineas") {
      return tempFilters.lineas.length > 0;
    } else if (selectedTab === "servicios") {
      return tempFilters.servicios.length > 0;
    }
    return false;
  };

  const isLastStep = selectedTab === "camas";

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
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
              selectedTab === "lineas"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-600"
            )}
          >
            1
          </div>
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
              selectedTab === "servicios"
                ? "bg-blue-600 text-white"
                : tempFilters.lineas.length > 0
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-200 text-gray-600"
            )}
          >
            2
          </div>
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
              selectedTab === "camas"
                ? "bg-blue-600 text-white"
                : tempFilters.servicios.length > 0
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-200 text-gray-600"
            )}
          >
            3
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {selectedTab === "lineas" && "Selecciona una línea"}
          {selectedTab === "servicios" && "Selecciona servicios"}
          {selectedTab === "camas" && "Selecciona camas"}
        </div>
      </div>

      {/* Filter Content */}
      <div className="min-h-[300px]">
        {selectedTab === "lineas" && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium mb-4">Líneas Hospitalarias</h3>
            <div className="grid grid-cols-2 gap-3">
              {filterOptions.lineas.map((linea) => (
                <Button
                  key={linea}
                  variant={
                    tempFilters.lineas.includes(linea) ? "default" : "outline"
                  }
                  className="w-full justify-start h-12 text-left"
                  onClick={() => handleLineaToggle(linea)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{linea}</span>
                    {linea !== "Todas las líneas" && (
                      <span className="text-xs text-muted-foreground">
                        {filterOptions.servicios[
                          linea as keyof typeof filterOptions.servicios
                        ]?.length || 0}{" "}
                        servicios
                      </span>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {selectedTab === "servicios" && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium mb-4">
              Servicios de {tempFilters.lineas[0]}
            </h3>
            {tempFilters.lineas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Selecciona una línea primero
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* All Services Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 text-left border-2 border-blue-200 hover:border-blue-300"
                  onClick={handleSelectAllServices}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-blue-600">
                      Todos los Servicios
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Seleccionar todos los servicios disponibles
                    </span>
                  </div>
                </Button>

                {/* Individual Services */}
                <div className="grid grid-cols-1 gap-3">
                  {getAvailableServicios().map((servicio) => (
                    <Button
                      key={servicio}
                      variant={
                        tempFilters.servicios.includes(servicio)
                          ? "default"
                          : "outline"
                      }
                      className="w-full justify-start h-12 text-left"
                      onClick={() => handleServicioToggle(servicio)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{servicio}</span>
                        <span className="text-xs text-muted-foreground">
                          {filterOptions.camas[
                            servicio as keyof typeof filterOptions.camas
                          ]?.length || 0}{" "}
                          camas disponibles
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === "camas" && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium mb-4">Camas Disponibles</h3>
            {tempFilters.servicios.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Selecciona un servicio primero
                </p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                <div className="grid grid-cols-6 gap-2">
                  {getAvailableCamas().map((cama) => (
                    <Button
                      key={cama}
                      variant={
                        tempFilters.camas.includes(cama) ? "default" : "outline"
                      }
                      size="sm"
                      className="h-10 text-xs"
                      onClick={() => handleCamaToggle(cama)}
                    >
                      {cama}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <div className="space-x-2">
          <Button variant="outline" onClick={handleClear}>
            Borrar Todo
          </Button>
        </div>
        {isLastStep ? (
          <Button
            onClick={handleApply}
            disabled={tempFilters.camas.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Aplicar Filtros ({tempFilters.camas.length} camas)
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}
