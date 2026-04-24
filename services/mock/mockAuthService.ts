import { User } from '../../types/database';
import { mockUsers } from './mockData';

export const authService = {
  async login(email: string): Promise<User | null> {
    const user = mockUsers.find(u => u.email === email);
    return user || null;
  },

  async register(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: `${user.role}-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockUsers.push(newUser);
    return newUser;
  },
  
  async getUser(id: string): Promise<User | null> {
    const user = mockUsers.find(u => u.id === id);
    return user || null;
  }
};
