'use client';

import { User } from '@/types';

/**
 * AUTH BYPASS MODE (Development)
 * This hook returns a mock admin user to allow full access to the frontend.
 */
const MOCK_NORMAL_USER: User = {
  id: 'dev-user-id',
  name: 'Alex Explorer',
  email: 'alex@example.com',
  role: 'attendee',
  points: 150,
  level: 2,
  xp: 450,
  onboardingCompleted: true,
};

export function useAuth() {
  const loading = false;
  const isAuthenticated = true;
  const user = MOCK_NORMAL_USER;

  const signIn = async () => ({ ok: true });
  const logout = async () => { 
    console.log('Bypass mode: logout called');
    window.location.href = '/'; 
  };

  const updateUser = async (data: Partial<User>) => {
    console.log('Bypass mode: updateUser called with', data);
    return { ...user, ...data };
  };

  const awardPoints = async (points: number, reason: string = "Platform Activity") => {
    console.log(`Bypass mode: awardPoints ${points} for ${reason}`);
  };

  const checkInUser = async (eventId: string) => {
    console.log(`Bypass mode: checkInUser for ${eventId}`);
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

/* --- ORIGINAL USE-AUTH (COMMENTED OUT FOR DEVELOPMENT) ---
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import { updateUserDetails } from "@/app/actions/users";
import { awardXP as awardXPServer } from "@/app/actions/gamification";

export function useAuth() {
  const { data: session, status, update } = useSession();
  const loading = status === "loading";
  const isAuthenticated = status === "authenticated";
  
  const user = session?.user ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    // @ts-ignore
    role: session.user.role || "attendee",
    // @ts-ignore
    onboardingCompleted: session.user.onboardingCompleted,
    // These might be missing from the basic session user but can be added if needed
    points: (session.user as any).points || 0,
    level: (session.user as any).level || 1,
    xp: (session.user as any).xp || 0,
  } as User : null;

  const signIn = async () => {
    try {
      await nextAuthSignIn("google");
      return { ok: true };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  };

  const logout = async () => {
    await nextAuthSignOut({ callbackUrl: "/" });
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user?.id) return null;
    const result = await updateUserDetails(user.id, data);
    if (result.success) {
      await update(); // Refresh session
    }
    return result.user;
  };

  /**
   * Award points to the current user and persist to DB
   *\/
  const awardPoints = async (points: number, reason: string = "Platform Activity") => {
    if (!user?.id) return;
    const result = await awardXPServer(user.id, points, reason);
    if (result?.success) {
      await update(); // Refresh session
    }
  };

  const checkInUser = async (eventId: string) => {
    if (!user?.id) return;
    // This should ideally be handled by a check-in specific action, 
    // but for the hook consistency:
    await updateUser({ checkedIn: true } as any);
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
*/