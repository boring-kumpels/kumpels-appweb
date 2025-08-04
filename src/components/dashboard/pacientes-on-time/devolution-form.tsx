import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
import { MedicationSearch } from "./medication-search";
import { useDevolutionCauses } from "@/hooks/use-devolution-causes";
import { useCreateManualReturn } from "@/hooks/use-manual-returns";
import { ManualReturnType } from "@/types/patient";

interface DevolutionFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DevolutionForm({
  patientId,
  onSuccess,
  onCancel,
}: DevolutionFormProps) {
  const [selectedMedication, setSelectedMedication] = useState<{
    id: string;
    nombrePreciso?: string | null;
    nuevaEstructuraEstandarSemantico?: string | null;
    principioActivo?: string | null;
    concentracionEstandarizada?: string | null;
    formaFarmaceutica?: string | null;
    cumSinCeros?: string | null;
    codigoServinte?: string | null;
  } | null>(null);
  const [quantity, setQuantity] = useState("");
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  const { data: devolutionCauses = [], isLoading: causesLoading } =
    useDevolutionCauses();
  const createManualReturn = useCreateManualReturn();

  const handleSubmit = async () => {
    if (!selectedMedication || !quantity || selectedCauses.length === 0) {
      return;
    }

    try {
      const selectedCauseObjects = devolutionCauses.filter((cause) =>
        selectedCauses.includes(cause.id)
      );

      await createManualReturn.mutateAsync({
        patientId,
        // Always create standalone devolutions - no medication process dependency
        type: ManualReturnType.STANDALONE,
        devolutionCauseId: selectedCauseObjects[0]?.id, // Use first selected cause for structured data
        cause: selectedCauseObjects.map((c) => c.description).join(", "),
        comments: comment,
        supplies: [
          {
            medicationId: selectedMedication.id,
            supplyCode:
              selectedMedication.cumSinCeros ||
              selectedMedication.codigoServinte ||
              "SUPPLY_" + Date.now(),
            supplyName:
              selectedMedication.nombrePreciso ||
              selectedMedication.nuevaEstructuraEstandarSemantico ||
              selectedMedication.principioActivo ||
              "Medicamento",
            quantityReturned: parseInt(quantity) || 1,
          },
        ],
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating devolution return:", error);
    }
  };

  const handleCauseToggle = (causeId: string) => {
    setSelectedCauses((prev) =>
      prev.includes(causeId)
        ? prev.filter((id) => id !== causeId)
        : [...prev, causeId]
    );
  };

  const isFormValid =
    selectedMedication && quantity && selectedCauses.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-blue-600">
        <AlertCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Nueva Devolución Independiente
        </h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Esta es una devolución independiente que no requiere un proceso de
          entrega previo. Requerirá aprobación del regente de farmacia antes de
          proceder.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Medicamento *
          </label>
          <MedicationSearch
            onSelect={setSelectedMedication}
            placeholder="Buscar medicamento a devolver..."
          />
          {selectedMedication && (
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm font-medium">
                {selectedMedication.nombrePreciso ||
                  selectedMedication.nuevaEstructuraEstandarSemantico ||
                  selectedMedication.principioActivo}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedMedication.concentracionEstandarizada &&
                  `${selectedMedication.concentracionEstandarizada} • `}
                {selectedMedication.formaFarmaceutica &&
                  `${selectedMedication.formaFarmaceutica} • `}
                {selectedMedication.cumSinCeros &&
                  `CUM: ${selectedMedication.cumSinCeros}`}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Cantidad *
          </label>
          <Input
            type="number"
            min="1"
            placeholder="Cantidad a devolver"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Causa de devolución * (selección múltiple)
          </label>
          {causesLoading ? (
            <div className="flex items-center space-x-2 p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Cargando causas...
              </span>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {devolutionCauses.map((cause) => (
                <div key={cause.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={cause.id}
                    checked={selectedCauses.includes(cause.id)}
                    onCheckedChange={() => handleCauseToggle(cause.id)}
                  />
                  <label
                    htmlFor={cause.id}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    <Badge variant="outline" className="mr-2">
                      {cause.causeId}
                    </Badge>
                    {cause.description}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Comentario adicional
          </label>
          <Textarea
            placeholder="Comentario o información adicional sobre la devolución..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={createManualReturn.isPending}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || createManualReturn.isPending}
          className="bg-sidebar hover:bg-sidebar-accent"
        >
          {createManualReturn.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creando...
            </>
          ) : (
            "Crear Devolución Independiente"
          )}
        </Button>
      </div>
    </div>
  );
}
