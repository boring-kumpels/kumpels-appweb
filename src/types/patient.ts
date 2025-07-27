export enum PatientStatus {
  ACTIVE = "ACTIVE",
  DISCHARGED = "DISCHARGED",
  TRANSFERRED = "TRANSFERRED",
  DECEASED = "DECEASED",
}

export enum LineName {
  LINE_1 = "LINE_1",
  LINE_2 = "LINE_2",
  LINE_3 = "LINE_3",
  LINE_4 = "LINE_4",
  LINE_5 = "LINE_5",
}

export enum MedicationProcessStep {
  PREDESPACHO = "PREDESPACHO",
  ALISTAMIENTO = "ALISTAMIENTO",
  VALIDACION = "VALIDACION",
  ENTREGA = "ENTREGA",
  DEVOLUCION = "DEVOLUCION",
}

export enum ProcessStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
}

export enum LogType {
  ERROR = "ERROR",
  WARNING = "WARNING",
  INFO = "INFO",
}

export enum ManualReturnStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum DailyProcessStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface Bed {
  id: string;
  number: string;
  lineName: LineName;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  patients?: Patient[];
}

export interface DailyProcess {
  id: string;
  date: Date;
  startedBy: string;
  startedAt: Date;
  completedAt?: Date;
  status: DailyProcessStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  medicationProcesses?: MedicationProcess[];
}

export interface MedicationProcess {
  id: string;
  patientId: string;
  dailyProcessId?: string;
  step: MedicationProcessStep;
  status: ProcessStatus;
  startedAt?: Date;
  completedAt?: Date;
  startedBy?: string;
  completedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  dailyProcess?: DailyProcess;
}

export interface Patient {
  id: string;
  externalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  admissionDate: Date;
  bedId: string;
  status: PatientStatus;
  medicalRecord?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  bed?: Bed;
  medicationProcesses?: MedicationProcess[];
  errorLogs?: ProcessErrorLog[];
  manualReturns?: ManualReturn[];
}

export interface ProcessErrorLog {
  id: string;
  patientId: string;
  medicationProcessId?: string;
  step?: MedicationProcessStep;
  logType: LogType;
  message: string;
  reportedBy: string;
  reportedByRole: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  patient?: Patient;
  medicationProcess?: MedicationProcess;
}

export interface ManualReturn {
  id: string;
  patientId: string;
  generatedBy: string;
  reviewedBy?: string;
  status: ManualReturnStatus;
  approvalDate?: Date;
  cause: string;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
  patient?: Patient;
  supplies?: ManualReturnSupply[];
}

export interface ManualReturnSupply {
  id: string;
  manualReturnId: string;
  supplyCode: string;
  supplyName: string;
  quantityReturned: number;
  createdAt: Date;
  manualReturn?: ManualReturn;
}

export interface PatientWithRelations extends Patient {
  bed: Bed;
  medicationProcesses: MedicationProcess[];
}

export interface CreatePatientData {
  externalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  admissionDate: Date;
  bedId: string;
  medicalRecord?: string;
  notes?: string;
}

export interface UpdatePatientData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  admissionDate?: Date;
  bedId?: string;
  status?: PatientStatus;
  medicalRecord?: string;
  notes?: string;
}

export interface PatientFilters {
  lineName?: LineName;
  bedId?: string;
  status?: PatientStatus;
  search?: string;
}

export interface PatientImportData {
  externalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  admissionDate: string;
  lineName: LineName;
  bedNumber: string;
  medicalRecord?: string;
  notes?: string;
}

// Medication Process Types
export interface CreateMedicationProcessData {
  patientId: string;
  step: MedicationProcessStep;
  dailyProcessId?: string;
  notes?: string;
}

export interface UpdateMedicationProcessData {
  status?: ProcessStatus;
  startedAt?: Date;
  completedAt?: Date;
  startedBy?: string;
  completedBy?: string;
  notes?: string;
}

export interface MedicationProcessFilters {
  patientId?: string;
  step?: MedicationProcessStep;
  status?: ProcessStatus;
  dailyProcessId?: string;
}

// Daily Process Types
export interface CreateDailyProcessData {
  date: Date;
  notes?: string;
}

export interface UpdateDailyProcessData {
  status?: DailyProcessStatus;
  completedAt?: Date;
  notes?: string;
}

export interface DailyProcessFilters {
  date?: Date;
  status?: DailyProcessStatus;
  startedBy?: string;
}

// Process Step Permissions
export interface ProcessStepPermissions {
  canStart: boolean;
  canComplete: boolean;
  canView: boolean;
  requiredRole?: string;
}

export type ProcessStepPermissionMap = Record<
  MedicationProcessStep,
  ProcessStepPermissions
>;

// Error Log Types
export interface CreateProcessErrorLogData {
  patientId: string;
  medicationProcessId?: string;
  step?: MedicationProcessStep;
  logType: LogType;
  message: string;
  reportedByRole: string;
}

export interface UpdateProcessErrorLogData {
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ProcessErrorLogFilters {
  patientId?: string;
  medicationProcessId?: string;
  step?: MedicationProcessStep;
  logType?: LogType;
  resolvedAt?: Date;
}

// Manual Return Types
export interface CreateManualReturnData {
  patientId: string;
  cause: string;
  comments?: string;
  supplies: {
    supplyCode: string;
    supplyName: string;
    quantityReturned: number;
  }[];
}

export interface UpdateManualReturnData {
  status?: ManualReturnStatus;
  reviewedBy?: string;
  approvalDate?: Date;
  comments?: string;
}

export interface ManualReturnFilters {
  patientId?: string;
  status?: ManualReturnStatus;
  generatedBy?: string;
  reviewedBy?: string;
}

// Extended Patient with new relations
export interface PatientWithFullRelations extends Patient {
  bed: Bed;
  medicationProcesses: MedicationProcess[];
  errorLogs: ProcessErrorLog[];
  manualReturns: ManualReturn[];
}
