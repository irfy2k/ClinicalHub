/**
 * Database Schema Types
 * These TypeScript interfaces define the shape of data stored in Firebase Realtime Database.
 * Collections: users, appointments, prescriptions, medication_logs, health_expenses, documents, chat_messages
 */

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  specialty?: string;
  phone_number?: string;
  avatar_url?: string;
  medical_history?: Record<string, any>;
  available_times?: string[];
  created_at: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'missed';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  patient_name?: string;
  doctor_name?: string;
  status: AppointmentStatus;
  scheduled_at: string;
  symptom_report?: Record<string, any>;
  notes?: string;
  photo_data?: string;
  unread_count_patient?: number;
  unread_count_doctor?: number;
  last_message_at?: string;
  created_at: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  patient_name?: string;
  doctor_name?: string;
  appointment_id?: string;
  medication_name: string;
  dosage: string;
  schedule_times: string[]; // e.g., ["08:00", "20:00"]
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  cost_estimate?: number;
  is_active: boolean;
  created_at: string;
}

export type MedicationLogStatus = 'taken' | 'skipped';

export interface MedicationLog {
  id: string;
  prescription_id: string;
  status: MedicationLogStatus;
  logged_at: string;
}

export type ExpenseType = 'consultation' | 'medication' | 'lab' | 'other';

export interface HealthExpense {
  id: string;
  patient_id: string;
  expense_type: ExpenseType;
  amount: number;
  description?: string;
  date_incurred: string;
  related_appointment_id?: string;
  related_prescription_id?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  appointment_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export type DocumentType = 'prescription' | 'lab_result' | 'report' | 'visit_summary' | 'other';

export interface VisitSummary {
  diagnosis: string;
  assessment?: string;
  treatment_plan?: string;
  medications?: string;
  follow_up?: string;
  notes?: string;
}

export interface DocumentRecord {
  id: string;
  patient_id: string;
  uploaded_by: string;
  file_name: string;
  file_type: DocumentType;
  storage_path: string;
  file_size_bytes?: number;
  appointment_id?: string;
  doctor_id?: string;
  doctor_name?: string;
  patient_name?: string;
  summary?: VisitSummary;
  created_at: string;
}
