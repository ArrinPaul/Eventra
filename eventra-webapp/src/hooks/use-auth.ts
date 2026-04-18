'use client';

import { User } from '@/types';

const GUEST_USER: User = {
  id: 'guest-user',
  name: 'Guest User',
  email: 'guest@eventra.local',
  role: 'attendee',
  points: 0,
  level: 1,
  xp: 0,
  onboardingCompleted: true,
};

export function useAuth() {
  const loading = false;
  const isAuthenticated = false;
  const user = GUEST_USER;

  const signIn = async () => ({ ok: false, error: 'Authentication is disabled.' });

  const logout = async () => {};

  const updateUser = async (updatedUser: Partial<User>) => {
    return { ...user, ...updatedUser };
  };

  /**
   * Award points to the current user and persist to DB
   */
  const awardPoints = async (points: number) => {
    if (!user) return;
    
    const nextXp = (user.xp || 0) + points;
    const nextLevel = Math.floor(nextXp / 500) + 1;
    const nextPoints = (user.points || 0) + points;
    
    await updateUser({ xp: nextXp, level: nextLevel, points: nextPoints });
  };

  const checkInUser = async (eventId: string) => {
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
    authErrorMessage: (error: unknown) => String(error),
  };
}
