'use client';
import { createContext, ReactNode, useContext } from 'react';
import { useAuth as useConvexAuthHook } from '@/hooks/use-auth';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  // Add other methods as placeholders to prevent breaking components
  login: (email: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  updateUser: (updatedUser: any) => Promise<any>;
  addEventToUser: (sessionId: string, force?: boolean) => Promise<void>;
  removeEventFromUser: (sessionId: string) => Promise<void>;
  awardPoints: (points: number, message?: string) => Promise<void>;
  checkInUser: (registrationId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useConvexAuthHook();

  const value: AuthContextType = {
    user: user as unknown as User,
    loading,
    logout: logout as any,
    login: async () => {},
    register: async () => ({}) as any,
    updateUser: async () => {},
    addEventToUser: async () => {},
    removeEventFromUser: async () => {},
    awardPoints: async () => {},
    checkInUser: async () => {},
    refreshUser: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};