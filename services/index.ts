import { authService } from './mock/mockAuthService';
import { appointmentService } from './mock/mockAppointmentService';
import { prescriptionService } from './mock/mockPrescriptionService';
import { expenseService } from './mock/mockExpenseService';
import { documentService } from './mock/mockDocumentService';
import { chatService } from './mock/mockChatService';

import { firebaseAuthService } from './firebase/firebaseAuthService';
import { firebaseAppointmentService } from './firebase/firebaseAppointmentService';
import { firebasePrescriptionService } from './firebase/firebasePrescriptionService';
import { firebaseExpenseService } from './firebase/firebaseExpenseService';
import { firebaseDocumentService } from './firebase/firebaseDocumentService';
import { firebaseChatService } from './firebase/firebaseChatService';

// ──────────────────────────────────────────────────────────────────────
// SERVICE BACKEND TOGGLE
// Set to 'firebase' to connect to live Firebase Realtime Database,
// or 'mock' to use the local in-memory mock data layer.
// ──────────────────────────────────────────────────────────────────────
const BACKEND = 'mock' as 'mock' | 'firebase';

// ──────────────────────────────────────────────────────────────────────

const mockServices = {
  auth: authService,
  appointment: appointmentService,
  prescription: prescriptionService,
  expense: expenseService,
  document: documentService,
  chat: chatService,
};

const firebaseServices = {
  auth: {
    // Firebase auth requires password, but mock login only uses email.
    // We wrap firebaseAuthService to match the mock interface where applicable.
    login: (email: string) => firebaseAuthService.login(email, 'password'),
    register: (data: any) => firebaseAuthService.register(data, 'password'),
    getUser: firebaseAuthService.getUser,
  },
  appointment: firebaseAppointmentService,
  prescription: firebasePrescriptionService,
  expense: firebaseExpenseService,
  document: firebaseDocumentService,
  chat: firebaseChatService,
};

export const Services = BACKEND === 'firebase' ? firebaseServices : mockServices;

// Export the Firebase auth service directly for components that need
// Firebase-specific auth features (e.g., onAuthStateChanged, real password login).
export { firebaseAuthService } from './firebase/firebaseAuthService';
