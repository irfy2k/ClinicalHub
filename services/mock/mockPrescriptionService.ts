import { Prescription, MedicationLog } from '../../types/database';
import { mockPrescriptions, mockMedicationLogs } from './mockData';

export const prescriptionService = {
  async getByPatient(patientId: string): Promise<Prescription[]> {
    return mockPrescriptions.filter(p => p.patient_id === patientId);
  },

  async getByDoctor(doctorId: string): Promise<Prescription[]> {
    return mockPrescriptions.filter(p => p.doctor_id === doctorId);
  },

  async create(prescription: Omit<Prescription, 'id' | 'created_at'>): Promise<Prescription> {
    const newPresc: Prescription = {
      ...prescription,
      id: `presc-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockPrescriptions.push(newPresc);
    return newPresc;
  },

  async logMedication(log: Omit<MedicationLog, 'id'>): Promise<MedicationLog> {
    const newLog: MedicationLog = {
      ...log,
      id: `log-${Date.now()}`
    };
    mockMedicationLogs.push(newLog);
    return newLog;
  },
  
  async getLogsByPrescription(prescriptionId: string): Promise<MedicationLog[]> {
    return mockMedicationLogs.filter(l => l.prescription_id === prescriptionId);
  }
};
