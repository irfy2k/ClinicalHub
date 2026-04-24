import { Appointment } from '../../types/database';
import { mockAppointments } from './mockData';

export const appointmentService = {
  async getByPatient(patientId: string): Promise<Appointment[]> {
    return mockAppointments.filter(a => a.patient_id === patientId);
  },
  
  async getByDoctor(doctorId: string): Promise<Appointment[]> {
    return mockAppointments.filter(a => a.doctor_id === doctorId);
  },
  
  async create(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
    const newAppt: Appointment = {
      ...appointment,
      id: `appt-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockAppointments.push(newAppt);
    return newAppt;
  },

  async updateStatus(id: string, status: Appointment['status']): Promise<void> {
    const index = mockAppointments.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAppointments[index].status = status;
    }
  }
};
