import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { User } from '../types/database';
import { Services } from '../services';
import { firebaseAuthService } from '../services/firebase/firebaseAuthService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Omit<User, 'id' | 'created_at'>, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: () => {}
});

export const useAuth = () => useContext(AuthContext);

// Hook to protect routes
function useProtectedRoute(user: User | null, isLoading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to the welcome screen instead of login directly.
      router.replace('/(auth)/welcome');
    } else if (user && inAuthGroup) {
      // Redirect away from the sign-in page.
      if (user.role === 'patient') {
        router.replace('/(patient)/dashboard');
      } else if (user.role === 'doctor') {
        router.replace('/(doctor)/queue');
      } else if (user.role === 'admin') {
        router.replace('/(admin)/dashboard');
      }
    } else if (user && !inAuthGroup) {
      // Prevent users from accessing routes not meant for their role
      const attemptedRoleGroup = segments[0] === '(patient)' ? 'patient' : 
                               segments[0] === '(doctor)' ? 'doctor' : 
                               segments[0] === '(admin)' ? 'admin' : null;
                               
      if (attemptedRoleGroup && attemptedRoleGroup !== user.role) {
         if (user.role === 'patient') {
           router.replace('/(patient)/dashboard');
         } else if (user.role === 'doctor') {
           router.replace('/(doctor)/queue');
         } else if (user.role === 'admin') {
           router.replace('/(admin)/dashboard');
         }
      }
    }
  }, [user, segments, isLoading]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from Firebase Auth on app launch
  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Realtime Database
        const profile = await firebaseAuthService.getUser(firebaseUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  useProtectedRoute(user, isLoading);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const u = await Services.auth.login(email, password);
      if (u) setUser(u);
      else throw new Error("User not found");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Omit<User, 'id' | 'created_at'>, password: string) => {
    setIsLoading(true);
    try {
      const u = await Services.auth.register(data, password);
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseAuthService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      // Persist to Firebase
      firebaseAuthService.updateProfile(user.id, updates).catch(console.error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
