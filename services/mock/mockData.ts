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
    medical_history: { allergies: ['Penicillin'], conditions: ['Hypertension'] },
    created_at: new Date().toISOString()
  },
  {
    id: 'patient-2',
    role: 'patient',
    name: 'Jane Wilson',
    email: 'jane@example.com',
    phone_number: '+1234567891',
    avatar_url: 'https://i.pravatar.cc/150?u=patient-2',
    medical_history: { allergies: [], conditions: ['Diabetes Type 2'] },
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
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    notes: 'Regular checkup',
    created_at: new Date().toISOString()
  },
  {
    id: 'appt-2',
    patient_id: 'patient-1',
    doctor_id: 'doctor-1',
    status: 'completed',
    scheduled_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    notes: 'Follow-up visit for blood pressure monitoring',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'appt-3',
    patient_id: 'patient-2',
    doctor_id: 'doctor-1',
    status: 'pending',
    scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    notes: 'Symptoms: Persistent cough | Pain: 4/10 | Duration: 5 days',
    created_at: new Date().toISOString()
  }
];

export let mockPrescriptions: Prescription[] = [
  {
    id: 'presc-1',
    patient_id: 'patient-1',
    doctor_id: 'doctor-1',
    appointment_id: 'appt-2',
    medication_name: 'Amoxicillin',
    dosage: '500mg',
    schedule_times: ['08:00', '20:00'],
    start_date: '2026-04-20',
    end_date: '2026-05-04',
    is_active: true,
    cost_estimate: 15.50,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'presc-2',
    patient_id: 'patient-1',
    doctor_id: 'doctor-1',
    medication_name: 'Lisinopril',
    dosage: '10mg',
    schedule_times: ['09:00'],
    start_date: '2026-04-01',
    is_active: true,
    cost_estimate: 8.00,
    created_at: new Date(Date.now() - 24 * 86400000).toISOString()
  },
  {
    id: 'presc-3',
    patient_id: 'patient-1',
    doctor_id: 'doctor-1',
    medication_name: 'Atorvastatin',
    dosage: '20mg',
    schedule_times: ['21:00'],
    start_date: '2026-04-01',
    is_active: true,
    cost_estimate: 12.00,
    created_at: new Date(Date.now() - 24 * 86400000).toISOString()
  }
];

export let mockMedicationLogs: MedicationLog[] = [
  {
    id: 'log-1',
    prescription_id: 'presc-1',
    status: 'taken',
    logged_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'log-2',
    prescription_id: 'presc-2',
    status: 'taken',
    logged_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'log-3',
    prescription_id: 'presc-3',
    status: 'skipped',
    logged_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export let mockExpenses: HealthExpense[] = [
  {
    id: 'exp-1',
    patient_id: 'patient-1',
    expense_type: 'consultation',
    amount: 150.00,
    description: 'Annual Wellness Visit',
    date_incurred: new Date(Date.now() - 5 * 86400000).toISOString(),
    related_appointment_id: 'appt-2',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'exp-2',
    patient_id: 'patient-1',
    expense_type: 'lab',
    amount: 85.50,
    description: 'Comprehensive Blood Panel (CBC + Metabolic)',
    date_incurred: new Date(Date.now() - 12 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 12 * 86400000).toISOString()
  },
  {
    id: 'exp-3',
    patient_id: 'patient-1',
    expense_type: 'medication',
    amount: 15.50,
    description: 'Amoxicillin 500mg — 14 day supply',
    date_incurred: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'exp-4',
    patient_id: 'patient-1',
    expense_type: 'medication',
    amount: 8.00,
    description: 'Lisinopril 10mg — 30 day supply',
    date_incurred: new Date(Date.now() - 24 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 24 * 86400000).toISOString()
  },
  {
    id: 'exp-5',
    patient_id: 'patient-1',
    expense_type: 'consultation',
    amount: 75.00,
    description: 'Telehealth follow-up consultation',
    date_incurred: new Date(Date.now() - 20 * 86400000).toISOString(),
    related_appointment_id: 'appt-1',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'exp-6',
    patient_id: 'patient-1',
    expense_type: 'other',
    amount: 25.00,
    description: 'Home blood pressure monitor',
    date_incurred: new Date(Date.now() - 30 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'exp-7',
    patient_id: 'patient-1',
    expense_type: 'lab',
    amount: 42.00,
    description: 'Urinalysis panel',
    date_incurred: new Date(Date.now() - 15 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString()
  }
];

export let mockDocuments: DocumentRecord[] = [
  {
    id: 'doc-1',
    patient_id: 'patient-1',
    uploaded_by: 'doctor-1',
    file_name: 'CBC_Report_Oct2023.pdf',
    file_type: 'lab_result',
    storage_path: '/documents/patient-1/cbc_oct2023.pdf',
    file_size_bytes: 245000,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'doc-2',
    patient_id: 'patient-1',
    uploaded_by: 'doctor-1',
    file_name: 'Chest_XRay_Sep2023.pdf',
    file_type: 'report',
    storage_path: '/documents/patient-1/chest_xray_sep2023.pdf',
    file_size_bytes: 1200000,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString()
  },
  {
    id: 'doc-3',
    patient_id: 'patient-1',
    uploaded_by: 'doctor-1',
    file_name: 'Annual_Physical_Summary.pdf',
    file_type: 'report',
    storage_path: '/documents/patient-1/annual_physical_aug2023.pdf',
    file_size_bytes: 89000,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString()
  },
  {
    id: 'doc-4',
    patient_id: 'patient-1',
    uploaded_by: 'patient-1',
    file_name: 'Lisinopril_Prescription.pdf',
    file_type: 'prescription',
    storage_path: '/documents/patient-1/lisinopril_rx.pdf',
    file_size_bytes: 52000,
    created_at: new Date(Date.now() - 24 * 86400000).toISOString()
  }
];

export let mockChats: ChatMessage[] = [];
