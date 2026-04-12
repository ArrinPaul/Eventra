'use client';

import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { User } from '@/types';
import { getErrorMessage } from '@/core/utils/utils';

export function useAuth() {
  const { data: session, status, update } = useSession();
  
  const loading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user as User | null;

  const signIn = async (options?: { role?: User['role']; callbackUrl?: string }) => {
    try {
      const preferredRole =
        options?.role ||
        (typeof window !== 'undefined' ? (sessionStorage.getItem('preferred_role') as User['role'] | null) : null) ||
        'professional';

      if (typeof window !== 'undefined' && preferredRole) {
          sessionStorage.setItem('preferred_role', preferredRole);
      }

      await nextAuthSignIn('google', { 
        callbackUrl: options?.callbackUrl || '/explore'
      });
    } catch (error) {
      console.error('Failed to sign in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await nextAuthSignOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const updateUser = async (updatedUser: Partial<User>) => {
    if (!user) return null;
    const merged = { ...user, ...updatedUser };
    await update(merged);
    return merged;
  };

  // Mocked points functionality until DB is wired
  const awardPoints = async (points: number) => {
    if (!user) return;
    const nextXp = (user.xp || 0) + points;
    const nextLevel = Math.floor(nextXp / 500) + 1;
    await updateUser({ xp: nextXp, level: nextLevel });
  };

  const checkInUser = async () => {
    if (!user) return;
    await updateUser({ checkedIn: true });
  };

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    updateUser,
    awardPoints,
    checkInUser,
    signIn,
    authErrorMessage: (error: unknown) => getErrorMessage(error),
  };
}
