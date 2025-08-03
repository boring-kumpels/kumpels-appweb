import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Check } from "lucide-react";
import { useDevolutionCauses } from "@/hooks/use-devolution-causes";
import { useUpdateManualReturn } from "@/hooks/use-manual-returns";
import { ManualReturn, ManualReturnStatus } from "@/types/patient";

interface EditDevolutionFormProps {
  manualReturn: ManualReturn;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditDevolutionForm({
  manualReturn,
  onSuccess,
  onCancel,
}: EditDevolutionFormProps) {
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  const { data: devolutionCauses = [], isLoading: causesLoading } =
    useDevolutionCauses();
  const updateManualReturn = useUpdateManualReturn();

  // Initialize form with existing data
  useEffect(() => {
    if (manualReturn.devolutionCauseId) {
      setSelectedCauses([manualReturn.devolutionCauseId]);
    }

    if (manualReturn.comments) {
      setComment(manualReturn.comments);
    }
  }, [manualReturn]);

  const handleSubmit = async () => {
    if (selectedCauses.length === 0) {
      return;
    }

    try {
      const selectedCauseObjects = devolutionCauses.filter((cause) =>
        selectedCauses.includes(cause.id)
      );

      await updateManualReturn.mutateAsync({
        id: manualReturn.id,
        data: {
          status: ManualReturnStatus.APPROVED,
          devolutionCauseId: selectedCauseObjects[0]?.id,
          cause: selectedCauseObjects.map((c) => c.description).join(", "),
          comments: comment,
          // Note: We can't update supplies through the current API structure
          // This would require additional API changes to update supplies
        },
      });

      onSuccess();
    } catch (error) {
      console.error("Error updating devolution return:", error);
    }
  };

  const handleCauseToggle = (causeId: string) => {
    setSelectedCauses((prev) =>
      prev.includes(causeId)
        ? prev.filter((id) => id !== causeId)
        : [...prev, causeId]
    );
  };

  const isFormValid = selectedCauses.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-blue-600">
        <Edit className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Editar y Aprobar Devolución Manual
        </h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Al guardar los cambios, esta devolución será
          automáticamente aprobada. Los medicamentos no se pueden modificar en
          esta vista, solo la causa y comentarios.
        </p>
      </div>

      <div className="space-y-4">
        {/* Display current medication (read-only) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Medicamento (no editable)
          </label>
          {manualReturn.supplies && manualReturn.supplies.length > 0 && (
            <div className="p-3 bg-muted rounded-md border">
              <div className="text-sm font-medium">
                {manualReturn.supplies[0].medication?.nombrePreciso ||
                  manualReturn.supplies[0].medication
                    ?.nuevaEstructuraEstandarSemantico ||
                  manualReturn.supplies[0].supplyName}
              </div>
              <div className="text-xs text-muted-foreground">
                {manualReturn.supplies[0].medication
                  ?.concentracionEstandarizada &&
                  `${manualReturn.supplies[0].medication.concentracionEstandarizada} • `}
                {manualReturn.supplies[0].medication?.formaFarmaceutica &&
                  `${manualReturn.supplies[0].medication.formaFarmaceutica} • `}
                Cantidad: {manualReturn.supplies[0].quantityReturned}
                {manualReturn.supplies[0].medication?.cumSinCeros &&
                  ` • CUM: ${manualReturn.supplies[0].medication.cumSinCeros}`}
              </div>
            </div>
          )}
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
          disabled={updateManualReturn.isPending}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || updateManualReturn.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          {updateManualReturn.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Guardando y Aprobando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Guardar y Aprobar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
