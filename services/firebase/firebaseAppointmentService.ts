import { ref, push, get, set, query, orderByChild, equalTo, update } from 'firebase/database';
import { database, cleanObject } from './firebaseConfig';
import { Appointment } from '../../types/database';

/**
 * Firebase Appointment Service
 * Handles CRUD operations for appointments via Firebase Realtime Database.
 */
export const firebaseAppointmentService = {
  async getByPatient(patientId: string): Promise<Appointment[]> {
    try {
      const appointmentsRef = ref(database, 'appointments');
      const q = query(appointmentsRef, orderByChild('patient_id'), equalTo(patientId));
      const snapshot = await get(q);

      if (!snapshot.exists()) return [];

      const results: Appointment[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });
      return results;
    } catch (error) {
      console.error('[Firebase Appointments] getByPatient error:', error);
      return [];
    }
  },

  async getByDoctor(doctorId: string): Promise<Appointment[]> {
    try {
      const appointmentsRef = ref(database, 'appointments');
      const q = query(appointmentsRef, orderByChild('doctor_id'), equalTo(doctorId));
      const snapshot = await get(q);

      if (!snapshot.exists()) return [];

      const results: Appointment[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });
      return results;
    } catch (error) {
      console.error('[Firebase Appointments] getByDoctor error:', error);
      return [];
    }
  },

  async create(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
    try {
      const appointmentsRef = ref(database, 'appointments');
      const newRef = push(appointmentsRef);

      const newAppt: Omit<Appointment, 'id'> = {
        ...appointment,
        created_at: new Date().toISOString(),
      };

      await set(newRef, cleanObject(newAppt));

      return { id: newRef.key!, ...newAppt };
    } catch (error) {
      console.error('[Firebase Appointments] create error:', error);
      throw error;
    }
  },

  async updateStatus(id: string, status: Appointment['status']): Promise<void> {
    try {
      const apptRef = ref(database, `appointments/${id}/status`);
      await set(apptRef, status);
    } catch (error) {
      console.error('[Firebase Appointments] updateStatus error:', error);
      throw error;
    }
  },
  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<void> {
    try {
      const apptRef = ref(database, `appointments/${id}`);
      await update(apptRef, cleanObject(updates));
    } catch (error) {
      console.error('[Firebase Appointments] updateAppointment error:', error);
      throw error;
    }
  },
  async getById(id: string): Promise<Appointment | null> {
    try {
      const apptRef = ref(database, `appointments/${id}`);
      const snapshot = await get(apptRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.key!, ...snapshot.val() };
    } catch (error) {
      console.error('[Firebase Appointments] getById error:', error);
      return null;
    }
  },
  async markAsRead(id: string, role: 'patient' | 'doctor'): Promise<void> {
    try {
      const apptRef = ref(database, `appointments/${id}`);
      const field = role === 'patient' ? 'unread_count_patient' : 'unread_count_doctor';
      await update(apptRef, { [field]: 0 });
    } catch (error) {
      console.error('[Firebase Appointments] markAsRead error:', error);
    }
  },
};
