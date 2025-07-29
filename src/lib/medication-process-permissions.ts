import { MedicationProcessStep, ProcessStatus } from "@/types/patient";

/**
 * Get the display name for a medication process step
 */
export function getStepDisplayName(step: MedicationProcessStep): string {
  switch (step) {
    case MedicationProcessStep.PREDESPACHO:
      return "Predespacho";
    case MedicationProcessStep.ALISTAMIENTO:
      return "Alistamiento";
    case MedicationProcessStep.VALIDACION:
      return "Validación";
    case MedicationProcessStep.ENTREGA:
      return "Entrega";
    case MedicationProcessStep.DEVOLUCION:
      return "Devolución";
    default:
      return "Desconocido";
  }
}

/**
 * Get the display name for a process status
 */
export function getStatusDisplayName(status: ProcessStatus): string {
  switch (status) {
    case ProcessStatus.PENDING:
      return "Pendiente";
    case ProcessStatus.IN_PROGRESS:
      return "En Progreso";
    case ProcessStatus.COMPLETED:
      return "Completado";
    case ProcessStatus.ERROR:
      return "Error";
    case ProcessStatus.DISPATCHED_FROM_PHARMACY:
      return "Salió de Farmacia";
    case ProcessStatus.DELIVERED_TO_SERVICE:
      return "Entregado en Servicio";
    default:
      return "Desconocido";
  }
}

/**
 * Get the CSS color class for a process status
 */
export function getStatusColorClass(status: ProcessStatus, isEnabled: boolean = true): string {
  if (!isEnabled) {
    return "bg-transparent text-gray-900 border-2 border-black hover:bg-gray-50";
  }
  
  switch (status) {
    case ProcessStatus.PENDING:
      return "bg-orange-500 text-white border-0 hover:bg-orange-600";
    case ProcessStatus.IN_PROGRESS:
      return "bg-transparent text-orange-500 border-2 border-dashed border-orange-500 hover:bg-orange-50";
    case ProcessStatus.COMPLETED:
      return "bg-green-500 text-white border-0 hover:bg-green-600";
    case ProcessStatus.DISPATCHED_FROM_PHARMACY:
      return "bg-transparent text-blue-500 border-2 border-dashed border-blue-500 hover:bg-blue-50";
    case ProcessStatus.DELIVERED_TO_SERVICE:
      return "bg-blue-500 text-white border-0 hover:bg-blue-600";
    case ProcessStatus.ERROR:
      return "bg-red-500 text-white border-0 hover:bg-red-600";
    default:
      return "bg-transparent text-gray-900 border-2 border-black hover:bg-gray-50";
  }
}

/**
 * Check if a user can perform a specific action on a medication process step
 */
export function canPerformAction(
  step: MedicationProcessStep,
  userRole: string,
  action: "start" | "complete" | "view"
): boolean {
  // SUPERADMIN can do everything
  if (userRole === "SUPERADMIN") {
    return true;
  }

  // Everyone can view
  if (action === "view") {
    return true;
  }

  // Define permissions for each step and role
  const permissions = {
    [MedicationProcessStep.PREDESPACHO]: {
      canStart: ["PHARMACY_REGENT"],
      canComplete: ["PHARMACY_REGENT"],
    },
    [MedicationProcessStep.ALISTAMIENTO]: {
      canStart: ["PHARMACY_REGENT"],
      canComplete: ["PHARMACY_REGENT"],
    },
    [MedicationProcessStep.VALIDACION]: {
      canStart: ["PHARMACY_VALIDATOR"],
      canComplete: ["PHARMACY_VALIDATOR"],
    },
    [MedicationProcessStep.ENTREGA]: {
      canStart: ["NURSE"],
      canComplete: ["NURSE"],
    },
    [MedicationProcessStep.DEVOLUCION]: {
      canStart: ["NURSE"],
      canComplete: ["NURSE"],
    },
  };

  const stepPermissions = permissions[step];
  if (!stepPermissions) {
    return false;
  }

  if (action === "start") {
    return stepPermissions.canStart.includes(userRole);
  }

  if (action === "complete") {
    return stepPermissions.canComplete.includes(userRole);
  }

  return false;
}

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  from: ProcessStatus,
  to: ProcessStatus
): boolean {
  const validTransitions: Record<ProcessStatus, ProcessStatus[]> = {
    [ProcessStatus.PENDING]: [ProcessStatus.IN_PROGRESS, ProcessStatus.ERROR],
    [ProcessStatus.IN_PROGRESS]: [ProcessStatus.COMPLETED, ProcessStatus.ERROR],
    [ProcessStatus.COMPLETED]: [ProcessStatus.DISPATCHED_FROM_PHARMACY], // For ENTREGA step: completed -> dispatched
    [ProcessStatus.DISPATCHED_FROM_PHARMACY]: [ProcessStatus.DELIVERED_TO_SERVICE], // dispatched -> delivered
    [ProcessStatus.DELIVERED_TO_SERVICE]: [], // Final state for delivery tracking
    [ProcessStatus.ERROR]: [ProcessStatus.IN_PROGRESS], // Can retry from error
  };

  return validTransitions[from]?.includes(to) || false;
}

/**
 * Get valid status transitions from a current status
 */
export function getValidStatusTransitions(
  from: ProcessStatus
): ProcessStatus[] {
  const validTransitions: Record<ProcessStatus, ProcessStatus[]> = {
    [ProcessStatus.PENDING]: [ProcessStatus.IN_PROGRESS, ProcessStatus.ERROR],
    [ProcessStatus.IN_PROGRESS]: [ProcessStatus.COMPLETED, ProcessStatus.ERROR],
    [ProcessStatus.COMPLETED]: [ProcessStatus.DISPATCHED_FROM_PHARMACY],
    [ProcessStatus.DISPATCHED_FROM_PHARMACY]: [ProcessStatus.DELIVERED_TO_SERVICE],
    [ProcessStatus.DELIVERED_TO_SERVICE]: [],
    [ProcessStatus.ERROR]: [ProcessStatus.IN_PROGRESS],
  };

  return validTransitions[from] || [];
}
