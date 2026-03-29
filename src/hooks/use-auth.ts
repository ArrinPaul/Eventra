// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';

/**
 * Mock Auth Hook for Project Rework
 * Replaces old logic with a placeholder.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
      // For rework, let's keep it as guest by default
      setUser(null);
      setIsAuthenticated(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (updatedUser: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUser });
    }
    return user;
  };

  const awardPoints = async (points: number) => {
    console.log(`Awarded ${points} points (MOCK)`);
  };

  const checkInUser = async () => {
    console.log('User checked in (MOCK)');
  };

  const signIn = async () => {
    // Placeholder for Google OAuth
    console.log('Sign in requested (MOCK)');
    setUser({
      id: 'mock-user-1',
      name: 'Eventra Professional',
      email: 'pro@eventra.app',
      role: 'professional',
      xp: 1200,
      level: 5,
      badges: [],
      onboardingCompleted: true
    } as any);
    setIsAuthenticated(true);
  };

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    updateUser,
    awardPoints,
    checkInUser,
    signIn
  };
}


