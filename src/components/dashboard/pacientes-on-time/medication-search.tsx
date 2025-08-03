import React, { useState, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useMedications } from "@/hooks/use-medications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Medication {
  id: string;
  codigoServinte: string | null;
  codigoNuevoEstandar: string | null;
  cumSinCeros: string | null;
  cumConCeros: string | null;
  nombrePreciso: string | null;
  principioActivo: string | null;
  concentracionEstandarizada: string | null;
  formaFarmaceutica: string | null;
  marcaComercial: string | null;
  nuevaEstructuraEstandarSemantico: string | null;
  clasificacionArticulo: string | null;
  viaAdministracion: string | null;
  descripcionCum: string | null;
  active: boolean;
}

interface MedicationSearchProps {
  onSelect: (medication: Medication) => void;
  placeholder?: string;
  className?: string;
}

export function MedicationSearch({
  onSelect,
  placeholder = "Buscar medicamento...",
  className = "",
}: MedicationSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, error } = useMedications({
    query: debouncedQuery,
    limit: 10,
    enabled: isOpen && debouncedQuery.length >= 2,
  });

  const handleSelect = (medication: Medication) => {
    onSelect(medication);
    setQuery("");
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for clicks on dropdown items
    setTimeout(() => setIsOpen(false), 200);
  };

  const clearInput = () => {
    setQuery("");
    setIsOpen(false);
  };

  const getDisplayName = (medication: Medication) => {
    if (medication.nombrePreciso) {
      return medication.nombrePreciso;
    }
    if (medication.nuevaEstructuraEstandarSemantico) {
      return medication.nuevaEstructuraEstandarSemantico;
    }
    if (medication.principioActivo) {
      return medication.principioActivo;
    }
    return "Medicamento sin nombre";
  };

  const getSecondaryInfo = (medication: Medication) => {
    const parts = [];

    if (medication.concentracionEstandarizada) {
      parts.push(medication.concentracionEstandarizada);
    }

    if (medication.formaFarmaceutica) {
      parts.push(medication.formaFarmaceutica);
    }

    if (medication.marcaComercial) {
      parts.push(medication.marcaComercial);
    }

    if (medication.cumSinCeros) {
      parts.push(`CUM: ${medication.cumSinCeros}`);
    }

    return parts.join(" • ");
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={clearInput}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-80 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Buscando...</span>
            </div>
          )}

          {error && (
            <div className="p-4 text-center">
              <span className="text-sm text-destructive">
                Error al buscar medicamentos
              </span>
            </div>
          )}

          {!isLoading && !error && debouncedQuery.length < 2 && (
            <div className="p-4 text-center">
              <span className="text-sm text-muted-foreground">
                Escribe al menos 2 caracteres para buscar
              </span>
            </div>
          )}

          {!isLoading &&
            !error &&
            debouncedQuery.length >= 2 &&
            data?.medications.length === 0 && (
              <div className="p-4 text-center">
                <span className="text-sm text-muted-foreground">
                  No se encontraron medicamentos
                </span>
              </div>
            )}

          {!isLoading &&
            !error &&
            data?.medications &&
            data.medications.length > 0 && (
              <ScrollArea className="max-h-80">
                <div className="p-1">
                  {data.medications.map((medication) => (
                    <button
                      key={medication.id}
                      className="w-full text-left p-3 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                      onClick={() => handleSelect(medication)}
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {getDisplayName(medication)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getSecondaryInfo(medication)}
                        </div>
                        {medication.clasificacionArticulo && (
                          <div className="flex gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {medication.clasificacionArticulo}
                            </Badge>
                            {medication.viaAdministracion && (
                              <Badge variant="outline" className="text-xs">
                                {medication.viaAdministracion}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
        </div>
      )}
    </div>
  );
}
