
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  NUTRITIONIST = 'NUTRITIONIST',
  ADMIN = 'ADMIN'
}

export enum VerificationStatus {
  NONE = 'none',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface MetricTrend {
  value: number;
  change: string;
  history: number[];
}

export interface PatientMetrics {
  imc: number;
  icc: number;
  visceralFat: number;
  muscleMass: number;
  bodyFat: number;
  water: number;
  metabolism: number;
}

export interface Appointment {
  id: string;
  time: string;
  type: string;
  provider: string;
  providerImage?: string;
  status: 'confirmed' | 'pending' | 'in_progress';
  patientName?: string;
  patientId?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
