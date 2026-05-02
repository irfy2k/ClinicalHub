import { authService } from './mock/mockAuthService';
import { appointmentService } from './mock/mockAppointmentService';
import { prescriptionService } from './mock/mockPrescriptionService';
import { expenseService } from './mock/mockExpenseService';
import { documentService } from './mock/mockDocumentService';
import { chatService } from './mock/mockChatService';

// This file exports the active services. 
// Right now they map to the mock services. 
// In the final phase, we will swap these to export Firebase implementations instead.

export const Services = {
  auth: authService,
  appointment: appointmentService,
  prescription: prescriptionService,
  expense: expenseService,
  document: documentService,
  chat: chatService,
};
