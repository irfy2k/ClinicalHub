import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from './firebaseConfig';
import { User } from '../../types/database';

/**
 * Firebase Auth Service
 * Handles authentication and user profile management via Firebase Auth + Realtime Database.
 */
export const firebaseAuthService = {
  /**
   * Login with email and password.
   * Returns the user profile from the Realtime Database.
   */
  async login(email: string, password: string): Promise<User | null> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;

      // Fetch user profile from Realtime Database
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        return { id: uid, ...snapshot.val() } as User;
      }

      return null;
    } catch (error) {
      console.error('[Firebase Auth] Login error:', error);
      throw error;
    }
  },

  /**
   * Register a new user with email and password.
   * Creates both a Firebase Auth account and a Realtime Database profile.
   */
  async register(data: Omit<User, 'id' | 'created_at'>, password: string): Promise<User> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, data.email, password);
      const uid = credential.user.uid;

      const newUser: User = {
        ...data,
        id: uid,
        created_at: new Date().toISOString(),
      };

      // Save user profile to Realtime Database
      const userRef = ref(database, `users/${uid}`);
      await set(userRef, {
        role: newUser.role,
        name: newUser.name,
        email: newUser.email,
        phone_number: newUser.phone_number || null,
        avatar_url: newUser.avatar_url || null,
        medical_history: newUser.medical_history || null,
        available_times: newUser.available_times || null,
        created_at: newUser.created_at,
      });

      return newUser;
    } catch (error) {
      console.error('[Firebase Auth] Register error:', error);
      throw error;
    }
  },

  /**
   * Get user profile by ID from Realtime Database.
   */
  async getUser(id: string): Promise<User | null> {
    try {
      const userRef = ref(database, `users/${id}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        return { id, ...snapshot.val() } as User;
      }

      return null;
    } catch (error) {
      console.error('[Firebase Auth] getUser error:', error);
      return null;
    }
  },

  /**
   * Update user profile in Realtime Database.
   */
  async updateProfile(uid: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const currentData = snapshot.val();
        await set(userRef, { ...currentData, ...updates });
      }
    } catch (error) {
      console.error('[Firebase Auth] updateProfile error:', error);
      throw error;
    }
  },

  /**
   * Sign out the current user.
   */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /**
   * Subscribe to auth state changes.
   * Returns an unsubscribe function.
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Get the currently authenticated Firebase user.
   */
  getCurrentFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  },
};
