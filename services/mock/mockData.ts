import {
  User,
  Appointment,
  Prescription,
  MedicationLog,
  HealthExpense,
  ChatMessage,
  DocumentRecord
} from '../../types/database';

export const mockUsers: User[] = [
  {
    id: 'patient-1',
    role: 'patient',
    name: 'John Doe',
    email: 'john@example.com',
    phone_number: '+1234567890',
    avatar_url: 'https://i.pravatar.cc/150?u=patient-1',
    medical_history: { allergies: ['Penicillin'] },
    created_at: new Date().toISOString()
  },
  {
    id: 'doctor-1',
    role: 'doctor',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah@medlink.com',
    phone_number: '+1098765432',
    avatar_url: 'https://i.pravatar.cc/150?u=doctor-1',
    available_times: ['09:00', '10:30', '14:00', '15:30'],
    created_at: new Date().toISOString()
  }
];

export let mockAppointments: Appointment[] = [
  {
    id: 'appt-1',
    patient_id: 'patient-1',
    doctor_id: 'doctor-1',
    status: 'confirmed',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    notes: 'Regular checkup',
    created_at: new Date().toISOString()
  }
];

export let mockPrescriptions: Prescription[] = [
  {
    id: 'presc-1',
    patient_id: 'patient-1',
    doctor_id: 'doctor-1',
    medication_name: 'Amoxicillin',
    dosage: '500mg',
    schedule_times: ['08:00', '20:00'],
    start_date: '2026-04-24',
    is_active: true,
    cost_estimate: 15.50,
    created_at: new Date().toISOString()
  }
];

export let mockMedicationLogs: MedicationLog[] = [];

export let mockExpenses: HealthExpense[] = [
  {
    id: 'exp-1',
    patient_id: 'patient-1',
    expense_type: 'consultation',
    amount: 150.00,
    description: 'Initial consultation',
    date_incurred: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
];

export let mockDocuments: DocumentRecord[] = [];

export let mockChats: ChatMessage[] = [];
