import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Clock, AlertCircle, Calendar, Package } from "lucide-react";
import { ManualReturn, ManualReturnStatus } from "@/types/patient";
import {
  useApproveManualReturn,
  useRejectManualReturn,
} from "@/hooks/use-manual-returns";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { UserRole } from "@prisma/client";

interface DevolutionApprovalProps {
  manualReturns: ManualReturn[];
  onApprovalChange?: () => void;
  userRole?: UserRole;
}

export function DevolutionApproval({
  manualReturns,
  onApprovalChange,
  userRole,
}: DevolutionApprovalProps) {
  const [rejectionComments, setRejectionComments] = useState<
    Record<string, string>
  >({});

  const approveManualReturn = useApproveManualReturn();
  const rejectManualReturn = useRejectManualReturn();

  // Check if user can approve/reject (only PHARMACY_REGENT and SUPERADMIN)
  const canApproveReject = userRole === "PHARMACY_REGENT" || userRole === "SUPERADMIN";

  // Filter devolution process manual returns that are pending
  const pendingDevolutionReturns = manualReturns.filter(
    (mr) =>
      mr.type === "DEVOLUTION_PROCESS" &&
      mr.status === ManualReturnStatus.PENDING
  );

  const handleApprove = async (manualReturn: ManualReturn) => {
    try {
      await approveManualReturn.mutateAsync(manualReturn.id);
      onApprovalChange?.();
    } catch (error) {
      console.error("Error approving manual return:", error);
    }
  };

  const handleReject = async (manualReturn: ManualReturn) => {
    try {
      const comment = rejectionComments[manualReturn.id];
      await rejectManualReturn.mutateAsync({
        id: manualReturn.id,
        comments: comment,
      });
      setRejectionComments((prev) => {
        const newComments = { ...prev };
        delete newComments[manualReturn.id];
        return newComments;
      });
      onApprovalChange?.();
    } catch (error) {
      console.error("Error rejecting manual return:", error);
    }
  };

  const getStatusBadge = (status: ManualReturnStatus) => {
    switch (status) {
      case ManualReturnStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-600"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case ManualReturnStatus.APPROVED:
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="h-3 w-3 mr-1" />
            Aprobada
          </Badge>
        );
      case ManualReturnStatus.REJECTED:
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <X className="h-3 w-3 mr-1" />
            Rechazada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (pendingDevolutionReturns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-600" />
            <span>Devoluciones Manuales</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay devoluciones manuales pendientes de aprobación.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <span>Devoluciones Manuales Pendientes</span>
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-600"
          >
            {pendingDevolutionReturns.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-sm text-orange-800">
            <strong>Aprobación requerida:</strong> Las siguientes devoluciones
            manuales necesitan su aprobación antes de continuar con el proceso
            de devolución.
          </p>
        </div>

        {pendingDevolutionReturns.map((manualReturn) => (
          <div
            key={manualReturn.id}
            className="border rounded-lg p-4 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getStatusBadge(manualReturn.status)}
                  <span className="text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDistanceToNow(new Date(manualReturn.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>

                <div className="text-sm">
                  <strong>Causa:</strong>{" "}
                  {manualReturn.devolutionCause?.description ||
                    manualReturn.cause}
                </div>

                {manualReturn.comments && (
                  <div className="text-sm">
                    <strong>Comentarios:</strong> {manualReturn.comments}
                  </div>
                )}
              </div>
            </div>

            {/* Supplies */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Medicamentos a devolver:
              </h4>
              {manualReturn.supplies?.map((supply) => (
                <div key={supply.id} className="bg-muted rounded-md p-3">
                  <div className="text-sm font-medium">
                    {supply.medication?.nombrePreciso ||
                      supply.medication?.nuevaEstructuraEstandarSemantico ||
                      supply.supplyName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {supply.medication?.concentracionEstandarizada &&
                      `${supply.medication.concentracionEstandarizada} • `}
                    {supply.medication?.formaFarmaceutica &&
                      `${supply.medication.formaFarmaceutica} • `}
                    Cantidad: {supply.quantityReturned}
                    {supply.medication?.cumSinCeros &&
                      ` • CUM: ${supply.medication.cumSinCeros}`}
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons - Only show for authorized roles */}
            {canApproveReject && (
              <div className="flex flex-col space-y-3 pt-3 border-t">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(manualReturn)}
                    disabled={approveManualReturn.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {approveManualReturn.isPending ? "Aprobando..." : "Aprobar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(manualReturn)}
                    disabled={rejectManualReturn.isPending}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {rejectManualReturn.isPending ? "Rechazando..." : "Rechazar"}
                  </Button>
                </div>

                {/* Rejection comment field */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Comentario de rechazo (opcional)..."
                    value={rejectionComments[manualReturn.id] || ""}
                    onChange={(e) =>
                      setRejectionComments((prev) => ({
                        ...prev,
                        [manualReturn.id]: e.target.value,
                      }))
                    }
                    className="text-sm"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Message for non-authorized users */}
            {!canApproveReject && (
              <div className="pt-3 border-t">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Información:</strong> Esta devolución manual está pendiente de aprobación por parte del regente de farmacia.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
