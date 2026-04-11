'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { getErrorMessage } from '@/core/utils/utils';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrapSession = async () => {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) {
          if (active) setUser(null);
          return;
        }

        const data = (await res.json()) as { authenticated: boolean; user: User | null };
        if (active) {
          setUser(data.authenticated ? data.user : null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrapSession();

    return () => {
      active = false;
    };
  }, []);

  const isAuthenticated = !!user;

  const signIn = async (options?: { role?: User['role']; callbackUrl?: string }) => {
    const preferredRole =
      options?.role ||
      (typeof window !== 'undefined' ? (sessionStorage.getItem('preferred_role') as User['role'] | null) : null) ||
      'professional';

    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: preferredRole, callbackUrl: options?.callbackUrl }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to sign in');
    }

    const data = (await res.json()) as { success: boolean; user: User; callbackUrl?: string | null };
    setUser(data.user);

    const destination = data.callbackUrl || options?.callbackUrl || (data.user.role === 'organizer' || data.user.role === 'admin' ? '/organizer' : '/explore');
    if (typeof window !== 'undefined') {
      window.location.href = destination;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include',
      });
    } finally {
      setLoading(false);
      setUser(null);
    }
  };

  const updateUser = async (updatedUser: Partial<User>) => {
    if (!user) return null;
    const merged = { ...user, ...updatedUser };
    setUser(merged);
    return merged;
  };

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


