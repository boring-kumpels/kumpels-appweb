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

export interface Bed {
  id: string;
  number: string;
  lineName: LineName;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  patients?: Patient[];
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
}

export interface PatientWithRelations extends Patient {
  bed: Bed;
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
