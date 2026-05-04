import { ref, push, get, set, query, orderByChild, equalTo, update, remove } from 'firebase/database';
import { database, cleanObject } from './firebaseConfig';
import { Prescription, MedicationLog } from '../../types/database';

/**
 * Firebase Prescription Service
 * Handles CRUD operations for prescriptions and medication logs via Firebase Realtime Database.
 */
export const firebasePrescriptionService = {
  async getAll(): Promise<Prescription[]> {
    try {
      const prescRef = ref(database, 'prescriptions');
      const snapshot = await get(prescRef);

      if (!snapshot.exists()) return [];

      const results: Prescription[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });
      return results;
    } catch (error) {
      console.error('[Firebase Prescriptions] getAll error:', error);
      return [];
    }
  },
  async getByPatient(patientId: string): Promise<Prescription[]> {
    try {
      const prescRef = ref(database, 'prescriptions');
      const q = query(prescRef, orderByChild('patient_id'), equalTo(patientId));
      const snapshot = await get(q);

      if (!snapshot.exists()) return [];

      const results: Prescription[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });
      return results;
    } catch (error) {
      console.error('[Firebase Prescriptions] getByPatient error:', error);
      return [];
    }
  },

  async getByDoctor(doctorId: string): Promise<Prescription[]> {
    try {
      const prescRef = ref(database, 'prescriptions');
      const q = query(prescRef, orderByChild('doctor_id'), equalTo(doctorId));
      const snapshot = await get(q);

      if (!snapshot.exists()) return [];

      const results: Prescription[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });
      return results;
    } catch (error) {
      console.error('[Firebase Prescriptions] getByDoctor error:', error);
      return [];
    }
  },

  async create(prescription: Omit<Prescription, 'id' | 'created_at'>): Promise<Prescription> {
    try {
      const prescRef = ref(database, 'prescriptions');
      const newRef = push(prescRef);
      const prescId = newRef.key!;

      const newPresc: Omit<Prescription, 'id'> = {
        ...prescription,
        created_at: new Date().toISOString(),
      };

      await set(newRef, cleanObject(newPresc));

      // Create finance record if cost exists
      if (prescription.cost_estimate && prescription.cost_estimate > 0) {
        const expensesRef = ref(database, 'health_expenses');
        const expenseRef = push(expensesRef);
        await set(expenseRef, {
          patient_id: prescription.patient_id,
          expense_type: 'medication',
          amount: prescription.cost_estimate,
          description: `Prescription: ${prescription.medication_name}`,
          date_incurred: new Date().toISOString().split('T')[0],
          related_prescription_id: prescId,
          created_at: new Date().toISOString(),
        });
      }

      return { id: prescId, ...newPresc };
    } catch (error) {
      console.error('[Firebase Prescriptions] create error:', error);
      throw error;
    }
  },

  async updateStatus(id: string, is_active: boolean): Promise<void> {
    try {
      const prescRef = ref(database, `prescriptions/${id}/is_active`);
      await set(prescRef, is_active);

      // If medication is deactivated, remove it from finances as requested
      if (!is_active) {
        const expensesRef = ref(database, 'health_expenses');
        const q = query(expensesRef, orderByChild('related_prescription_id'), equalTo(id));
        const snapshot = await get(q);
        
        if (snapshot.exists()) {
          const removals: Promise<void>[] = [];
          snapshot.forEach((child) => {
            removals.push(remove(ref(database, `health_expenses/${child.key}`)));
          });
          await Promise.all(removals);
        }
      }
    } catch (error) {
      console.error('[Firebase Prescriptions] updateStatus error:', error);
      throw error;
    }
  },
  async logMedication(log: Omit<MedicationLog, 'id'>): Promise<MedicationLog> {
    try {
      // Check for existing log with same prescription_id and logged_at
      const logsRef = ref(database, 'medication_logs');
      const q = query(logsRef, orderByChild('prescription_id'), equalTo(log.prescription_id));
      const snapshot = await get(q);

      if (snapshot.exists()) {
        // Check if there's already a log for the same time
        let existingKey: string | null = null;
        snapshot.forEach((child) => {
          if (child.val().logged_at === log.logged_at) {
            existingKey = child.key;
          }
        });

        if (existingKey) {
          // Update existing log
          const existingRef = ref(database, `medication_logs/${existingKey}/status`);
          await set(existingRef, log.status);
          return { id: existingKey, ...log };
        }
      }

      // Create new log
      const newRef = push(logsRef);
      await set(newRef, log);

      return { id: newRef.key!, ...log };
    } catch (error) {
      console.error('[Firebase Prescriptions] logMedication error:', error);
      throw error;
    }
  },

  async getLogsByPrescription(prescriptionId: string): Promise<MedicationLog[]> {
    try {
      const logsRef = ref(database, 'medication_logs');
      const q = query(logsRef, orderByChild('prescription_id'), equalTo(prescriptionId));
      const snapshot = await get(q);

      if (!snapshot.exists()) return [];

      const results: MedicationLog[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });
      return results;
    } catch (error) {
      console.error('[Firebase Prescriptions] getLogsByPrescription error:', error);
      return [];
    }
  },
  async updatePrescription(id: string, updates: Partial<Prescription>): Promise<void> {
    try {
      const prescRef = ref(database, `prescriptions/${id}`);
      await update(prescRef, cleanObject(updates));
    } catch (error) {
      console.error('[Firebase Prescriptions] updatePrescription error:', error);
      throw error;
    }
  },
  async deletePrescription(id: string): Promise<void> {
    try {
      await remove(ref(database, `prescriptions/${id}`));

      const expensesRef = ref(database, 'health_expenses');
      const q = query(expensesRef, orderByChild('related_prescription_id'), equalTo(id));
      const snapshot = await get(q);
      if (snapshot.exists()) {
        const removals: Promise<void>[] = [];
        snapshot.forEach((child) => {
          removals.push(remove(ref(database, `health_expenses/${child.key}`)));
        });
        await Promise.all(removals);
      }
    } catch (error) {
      console.error('[Firebase Prescriptions] deletePrescription error:', error);
      throw error;
    }
  },
};
