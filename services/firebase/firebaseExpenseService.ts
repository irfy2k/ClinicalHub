import { ref, push, get, set, query, orderByChild, equalTo, remove } from 'firebase/database';
import { database } from './firebaseConfig';
import { HealthExpense } from '../../types/database';
import { firebasePrescriptionService } from './firebasePrescriptionService';

/**
 * Firebase Expense Service
 * Handles CRUD operations for health expenses via Firebase Realtime Database.
 */
export const firebaseExpenseService = {
  async getByPatient(patientId: string): Promise<HealthExpense[]> {
    try {
      const expensesRef = ref(database, 'health_expenses');
      const q = query(expensesRef, orderByChild('patient_id'), equalTo(patientId));
      const snapshot = await get(q);

      if (!snapshot.exists()) return [];

      const results: HealthExpense[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });
      return results;
    } catch (error) {
      console.error('[Firebase Expenses] getByPatient error:', error);
      return [];
    }
  },

  async create(expense: Omit<HealthExpense, 'id' | 'created_at'>): Promise<HealthExpense> {
    try {
      const expensesRef = ref(database, 'health_expenses');
      const newRef = push(expensesRef);

      const newExpense: Omit<HealthExpense, 'id'> = {
        ...expense,
        created_at: new Date().toISOString(),
      };

      await set(newRef, newExpense);

      return { id: newRef.key!, ...newExpense };
    } catch (error) {
      console.error('[Firebase Expenses] create error:', error);
      throw error;
    }
  },

  async rebuildMedicationExpensesForPatient(patientId: string): Promise<number> {
    try {
      const existing = await this.getByPatient(patientId);
      const medicationExpenses = existing.filter((e) => e.expense_type === 'medication');
      await Promise.all(
        medicationExpenses.map((e) => remove(ref(database, `health_expenses/${e.id}`)))
      );

      const prescriptions = await firebasePrescriptionService.getByPatient(patientId);
      const active = prescriptions.filter((p) => p.is_active && p.cost_estimate && p.cost_estimate > 0);

      for (const presc of active) {
        await this.create({
          patient_id: presc.patient_id,
          expense_type: 'medication',
          amount: presc.cost_estimate || 0,
          description: `Prescription: ${presc.medication_name}`,
          date_incurred: new Date().toISOString().split('T')[0],
          related_prescription_id: presc.id,
        });
      }

      return active.length;
    } catch (error) {
      console.error('[Firebase Expenses] rebuildMedicationExpensesForPatient error:', error);
      throw error;
    }
  },
};
