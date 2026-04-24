import { HealthExpense } from '../../types/database';
import { mockExpenses } from './mockData';

export const expenseService = {
  async getByPatient(patientId: string): Promise<HealthExpense[]> {
    return mockExpenses.filter(e => e.patient_id === patientId);
  },

  async create(expense: Omit<HealthExpense, 'id' | 'created_at'>): Promise<HealthExpense> {
    const newExpense: HealthExpense = {
      ...expense,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockExpenses.push(newExpense);
    return newExpense;
  }
};
