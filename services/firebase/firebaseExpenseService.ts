import { ref, push, get, set, query, orderByChild, equalTo } from 'firebase/database';
import { database } from './firebaseConfig';
import { HealthExpense } from '../../types/database';

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
};
