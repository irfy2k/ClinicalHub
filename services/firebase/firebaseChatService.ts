import { ref, push, get, set, query, orderByChild, equalTo, onValue, off, DatabaseReference } from 'firebase/database';
import { database } from './firebaseConfig';
import { ChatMessage } from '../../types/database';

/**
 * Firebase Chat Service
 * Handles CRUD operations for appointment-linked chat messages via Firebase Realtime Database.
 * Supports both one-shot fetching and real-time listeners.
 */
export const firebaseChatService = {
  async getByAppointment(appointmentId: string): Promise<ChatMessage[]> {
    try {
      const chatsRef = ref(database, 'chat_messages');
      const q = query(chatsRef, orderByChild('appointment_id'), equalTo(appointmentId));
      const snapshot = await get(q);

      if (!snapshot.exists()) return [];

      const results: ChatMessage[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });

      // Sort by created_at ascending for timeline order
      results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return results;
    } catch (error) {
      console.error('[Firebase Chat] getByAppointment error:', error);
      return [];
    }
  },

  /**
   * Subscribe to real-time chat updates for a specific appointment.
   * Returns an unsubscribe function to clean up the listener.
   */
  onMessagesChanged(
    appointmentId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const chatsRef = ref(database, 'chat_messages');
    const q = query(chatsRef, orderByChild('appointment_id'), equalTo(appointmentId));

    const listener = onValue(q, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const results: ChatMessage[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });

      // Sort by created_at ascending for timeline order
      results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      callback(results);
    });

    // Return unsubscribe function
    return () => off(q, 'value', listener);
  },

  async sendMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    try {
      const chatsRef = ref(database, 'chat_messages');
      const newRef = push(chatsRef);

      const newMsg: Omit<ChatMessage, 'id'> = {
        ...message,
        created_at: new Date().toISOString(),
      };

      await set(newRef, newMsg);

      return { id: newRef.key!, ...newMsg };
    } catch (error) {
      console.error('[Firebase Chat] sendMessage error:', error);
      throw error;
    }
  },
};
