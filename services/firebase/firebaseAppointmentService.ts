import { ref, push, get, set, query, orderByChild, equalTo, update, remove, runTransaction } from 'firebase/database';
import { database, cleanObject } from './firebaseConfig';
import { Appointment } from '../../types/database';

const ACTIVE_APPOINTMENT_STATUSES: Appointment['status'][] = ['pending', 'confirmed'];

function buildSlotKey(doctorId: string, scheduledAt: string): string {
  const safeDate = scheduledAt.replace(/[:.]/g, '-');
  return `${doctorId}__${safeDate}`;
}

export class SlotAlreadyBookedError extends Error {
  constructor() {
    super('The selected appointment slot is no longer available.');
    this.name = 'SlotAlreadyBookedError';
  }
}

/**
 * Firebase Appointment Service
 * Handles CRUD operations for appointments via Firebase Realtime Database.
 */
export const firebaseAppointmentService = {
  async getAll(): Promise<Appointment[]> {
    try {
      const appointmentsRef = ref(database, 'appointments');
      const snapshot = await get(appointmentsRef);

      if (!snapshot.exists()) return [];

      const results: Appointment[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });
      return results;
    } catch (error) {
      console.error('[Firebase Appointments] getAll error:', error);
      return [];
    }
  },
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

  async createWithSlotLock(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
    const slotKey = buildSlotKey(appointment.doctor_id, appointment.scheduled_at);
    const slotRef = ref(database, `appointment_slots/${slotKey}`);
    const appointmentsRef = ref(database, 'appointments');
    const newRef = push(appointmentsRef);
    const appointmentId = newRef.key!;

    const lockResult = await runTransaction(slotRef, (currentValue) => {
      if (currentValue) return;
      return {
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        scheduled_at: appointment.scheduled_at,
        status: appointment.status,
        created_at: new Date().toISOString(),
      };
    });

    if (!lockResult.committed) {
      throw new SlotAlreadyBookedError();
    }

    try {
      const newAppt: Omit<Appointment, 'id'> = {
        ...appointment,
        created_at: new Date().toISOString(),
      };
      await set(newRef, cleanObject(newAppt));
      return { id: appointmentId, ...newAppt };
    } catch (error) {
      await remove(slotRef);
      console.error('[Firebase Appointments] createWithSlotLock error:', error);
      throw error;
    }
  },

  async updateStatus(id: string, status: Appointment['status']): Promise<void> {
    try {
      const appointmentRef = ref(database, `appointments/${id}`);
      const appointmentSnapshot = await get(appointmentRef);
      if (!appointmentSnapshot.exists()) {
        throw new Error('Appointment not found');
      }

      const appointment = appointmentSnapshot.val() as Omit<Appointment, 'id'>;
      await set(ref(database, `appointments/${id}/status`), status);

      const wasActive = ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status);
      const isNowActive = ACTIVE_APPOINTMENT_STATUSES.includes(status);
      if (wasActive && !isNowActive) {
        const slotKey = buildSlotKey(appointment.doctor_id, appointment.scheduled_at);
        await remove(ref(database, `appointment_slots/${slotKey}`));
      }
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
  async deleteAppointment(id: string): Promise<void> {
    try {
      const apptRef = ref(database, `appointments/${id}`);
      const snapshot = await get(apptRef);
      if (!snapshot.exists()) return;

      const appointment = snapshot.val() as Omit<Appointment, 'id'>;
      await remove(apptRef);

      const wasActive = ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status);
      if (wasActive) {
        const slotKey = buildSlotKey(appointment.doctor_id, appointment.scheduled_at);
        await remove(ref(database, `appointment_slots/${slotKey}`));
      }
    } catch (error) {
      console.error('[Firebase Appointments] deleteAppointment error:', error);
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
  async checkForMissedAppointments(appointments: Appointment[]): Promise<void> {
    const nowMs = Date.now();
    for (const appt of appointments) {
      const scheduledMs = new Date(appt.scheduled_at).getTime();
      if (
        (appt.status === 'pending' || appt.status === 'confirmed') &&
        scheduledMs <= nowMs
      ) {
        try {
          await this.updateStatus(appt.id, 'missed');
          // Send notification
          const { notificationService } = require('../notificationService');
          await notificationService.sendInstantNotification(
            'Missed Appointment',
            `You missed your appointment with ${appt.doctor_name || 'your doctor'}.`
          );
        } catch (error) {
          console.error('[Firebase Appointments] Error updating missed appointment:', error);
        }
      }
    }
  },
};
