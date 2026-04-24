import { DocumentRecord } from '../../types/database';
import { mockDocuments } from './mockData';

export const documentService = {
  async getByPatient(patientId: string): Promise<DocumentRecord[]> {
    return mockDocuments.filter(d => d.patient_id === patientId);
  },

  async create(document: Omit<DocumentRecord, 'id' | 'created_at'>): Promise<DocumentRecord> {
    const newDoc: DocumentRecord = {
      ...document,
      id: `doc-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockDocuments.push(newDoc);
    return newDoc;
  }
};
