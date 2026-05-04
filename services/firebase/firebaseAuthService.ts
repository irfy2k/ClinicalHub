import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, set, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { auth, database } from './firebaseConfig';
import { User } from '../../types/database';

/**
 * Parses Firebase Auth error codes into human-readable messages.
 */
function parseAuthError(error: any): Error {
  const code = error?.code || '';
  let message = 'An unexpected authentication error occurred. Please try again.';
  
  switch (code) {
    case 'auth/invalid-email':
      message = 'The email address is improperly formatted.';
      break;
    case 'auth/user-disabled':
      message = 'This account has been disabled by an administrator.';
      break;
    case 'auth/user-not-found':
      message = 'No account found with this email address.';
      break;
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      message = 'Invalid email or password. Please try again.';
      break;
    case 'auth/email-already-in-use':
      message = 'An account already exists with this email address.';
      break;
    case 'auth/weak-password':
      message = 'The password is too weak. Please use at least 6 characters.';
      break;
    case 'auth/missing-password':
      message = 'Please enter your password.';
      break;
    case 'auth/network-request-failed':
      message = 'Network error. Please check your internet connection and try again.';
      break;
    case 'auth/too-many-requests':
      message = 'Too many failed attempts. Please try again later or reset your password.';
      break;
    default:
      if (error?.message) {
         message = error.message.replace(/Firebase:\s*(Error\s*)?/, '').replace(/\(auth\/.*\)\.?/, '').trim();
      }
  }
  
  return new Error(message);
}

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
      throw parseAuthError(error);
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
      throw parseAuthError(error);
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
   * Get all users with a specific role (e.g., 'patient' or 'doctor').
   * Used to populate doctor lists for booking and patient lists for prescriptions.
   */
  async getUsersByRole(role: 'patient' | 'doctor'): Promise<User[]> {
    if (!auth.currentUser) return [];
    try {
      const usersRef = ref(database, 'users');
      const q = query(usersRef, orderByChild('role'), equalTo(role));
      const snapshot = await get(q);

      if (!snapshot.exists()) return [];

      const results: User[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });
      return results;
    } catch (error) {
      console.error('[Firebase Auth] getUsersByRole error:', error);
      return [];
    }
  },

  /**
   * Get all users in the system.
   * Admin only usage.
   */
  async getAllUsers(): Promise<User[]> {
    if (!auth.currentUser) return [];
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) return [];

      const results: User[] = [];
      snapshot.forEach((child) => {
        results.push({ id: child.key!, ...child.val() });
      });
      return results;
    } catch (error) {
      console.error('[Firebase Auth] getAllUsers error:', error);
      return [];
    }
  },

  /**
   * Update user profile in Realtime Database.
   */
  async updateProfile(uid: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = ref(database, `users/${uid}`);
      // Use atomic update() to prevent race conditions from concurrent writes
      const { id, ...safeUpdates } = updates as any;
      await update(userRef, safeUpdates);
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
   * Send a password reset email.
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('[Firebase Auth] resetPassword error:', error);
      throw parseAuthError(error);
    }
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
