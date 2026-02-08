'use client';
import { createContext, ReactNode, useContext } from 'react';
import { useAuth as useConvexAuthHook } from '@/hooks/use-auth';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUser: (updatedUser: any) => Promise<any>;
  awardPoints: (points: number) => Promise<void>;
  checkInUser: () => Promise<void>;
  isAuthenticated: boolean;
  // Legacy placeholders to prevent build errors in un-migrated components
  login?: (email: string) => Promise<any>;
  register?: (userData: any) => Promise<any>;
  addEventToUser?: (sessionId: string, force?: boolean) => Promise<void>;
  removeEventFromUser?: (sessionId: string) => Promise<void>;
  refreshUser?: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useConvexAuthHook();

  const value: AuthContextType = {
    user: auth.user as unknown as User,
    loading: auth.loading,
    logout: auth.logout as any,
    isAuthenticated: auth.isAuthenticated,
    updateUser: auth.updateUser,
    awardPoints: auth.awardPoints,
    checkInUser: auth.checkInUser,
    // Placeholders
    login: async () => {},
    register: auth.updateUser,
    addEventToUser: async () => {},
    removeEventFromUser: async () => {},
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
