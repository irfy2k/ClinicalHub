/**
 * Service Hub — Firebase Only
 * All UI components import services from this file.
 * Mock services have been fully removed; Firebase is the sole backend.
 */

import { firebaseAuthService } from './firebase/firebaseAuthService';
import { firebaseAppointmentService } from './firebase/firebaseAppointmentService';
import { firebasePrescriptionService } from './firebase/firebasePrescriptionService';
import { firebaseExpenseService } from './firebase/firebaseExpenseService';
import { firebaseDocumentService } from './firebase/firebaseDocumentService';
import { firebaseChatService } from './firebase/firebaseChatService';

export const Services = {
  auth: firebaseAuthService,
  appointment: firebaseAppointmentService,
  prescription: firebasePrescriptionService,
  expense: firebaseExpenseService,
  document: firebaseDocumentService,
  chat: firebaseChatService,
};

// Direct re-export for components that need Firebase-specific features
export { firebaseAuthService } from './firebase/firebaseAuthService';
