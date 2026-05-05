import { ref, push, get, set, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import { database, cleanObject } from './firebaseConfig';
import { DocumentRecord } from '../../types/database';

/**
 * Firebase Document Service
 * Handles CRUD operations for medical documents/EHR via Firebase Realtime Database.
 * File payloads are expected to be stored in Firebase Storage with paths referenced here.
 */
export const firebaseDocumentService = {
  async getByPatient(patientId: string): Promise<DocumentRecord[]> {
    try {
      const docsRef = ref(database, 'documents');
      const q = query(docsRef, orderByChild('patient_id'), equalTo(patientId));
      const snapshot = await get(q);

      if (!snapshot.exists()) return [];

      const results: DocumentRecord[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });
      return results;
    } catch (error) {
      console.error('[Firebase Documents] getByPatient error:', error);
      return [];
    }
  },

  async create(document: Omit<DocumentRecord, 'id' | 'created_at'>): Promise<DocumentRecord> {
    try {
      const docsRef = ref(database, 'documents');
      const newRef = push(docsRef);

      const newDoc: Omit<DocumentRecord, 'id'> = {
        ...document,
        created_at: new Date().toISOString(),
      };

      await set(newRef, cleanObject(newDoc));

      return { id: newRef.key!, ...newDoc };
    } catch (error) {
      console.error('[Firebase Documents] create error:', error);
      throw error;
    }
  },
  onByPatient(patientId: string, callback: (documents: DocumentRecord[]) => void): () => void {
    const docsRef = ref(database, 'documents');
    const q = query(docsRef, orderByChild('patient_id'), equalTo(patientId));

    const listener = onValue(q, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const results: DocumentRecord[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });
      callback(results);
    });

    return () => off(q, 'value', listener);
  },
};
