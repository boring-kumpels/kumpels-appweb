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
