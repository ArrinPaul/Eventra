'use client';
import { createContext, ReactNode, useContext } from 'react';
import { useAuth as useConvexAuthHook } from '@/hooks/use-auth';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => Promise<any>;
  awardPoints: (points: number) => Promise<void>;
  checkInUser: () => Promise<void>;
  isAuthenticated: boolean;
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
