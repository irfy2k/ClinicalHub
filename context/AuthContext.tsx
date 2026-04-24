import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { User } from '../types/database';
import { Services } from '../services';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  register: (data: Omit<User, 'id' | 'created_at'>) => Promise<void>;
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
      // Redirect to the sign-in page.
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect away from the sign-in page.
      if (user.role === 'patient') {
        router.replace('/(patient)/dashboard');
      } else {
        router.replace('/(doctor)/queue');
      }
    } else if (user && !inAuthGroup) {
      // Prevent patient users from accessing provider routes and vice versa
      const attemptedRoleGroup = segments[0] === '(patient)' ? 'patient' : segments[0] === '(doctor)' ? 'doctor' : null;
      if (attemptedRoleGroup && attemptedRoleGroup !== user.role) {
         if (user.role === 'patient') {
           router.replace('/(patient)/dashboard');
         } else {
           router.replace('/(doctor)/queue');
         }
      }
    }
  }, [user, segments, isLoading]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // In a real app we would check secure storage for session here
  useEffect(() => {
    setIsLoading(false);
  }, []);

  useProtectedRoute(user, isLoading);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const u = await Services.auth.login(email);
      if (u) setUser(u);
      else throw new Error("User not found");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Omit<User, 'id' | 'created_at'>) => {
    setIsLoading(true);
    try {
      const u = await Services.auth.register(data);
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
