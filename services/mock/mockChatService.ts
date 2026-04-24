import { ChatMessage } from '../../types/database';
import { mockChats } from './mockData';

export const chatService = {
  async getByAppointment(appointmentId: string): Promise<ChatMessage[]> {
    return mockChats.filter(c => c.appointment_id === appointmentId);
  },

  async sendMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    const newMsg: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockChats.push(newMsg);
    return newMsg;
  }
};
