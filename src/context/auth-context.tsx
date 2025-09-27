'use client';
import { createContext, ReactNode, useState, useEffect } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import { User } from '@/types';
import { ORGANIZERS } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  users: User[];
  loading: boolean;
  login: (email: string) => User | null;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'registrationId' | 'checkedIn' | 'myEvents' | 'points'>) => User;
  updateUser: (updatedUser: User) => void;
  addEventToUser: (sessionId: string, force?: boolean) => void;
  removeEventFromUser: (sessionId: string) => void;
  awardPoints: (points: number, message?: string) => void;
  checkInUser: (registrationId: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser, userLoaded] = useLocalStorage<User | null>('ipx-user', null);
  const [users, setUsers, usersLoaded] = useLocalStorage<User[]>('ipx-users', ORGANIZERS);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userLoaded && usersLoaded) {
      setLoading(false);
    }
  }, [userLoaded, usersLoaded]);

  const login = (email: string): User | null => {
    const foundUser = users.find((u) => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      return foundUser;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
  };

  const register = (userData: Omit<User, 'id' | 'registrationId' | 'checkedIn' | 'myEvents' | 'points'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      registrationId: `${userData.role.slice(0, 3).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      checkedIn: false,
      myEvents: [],
      points: 0,
    };
    
    setUsers((prevUsers) => [...prevUsers, newUser]);
    setUser(newUser);
    
    console.log(`
      --- Mock Email Sent ---
      To: ${newUser.email}
      Subject: Thank you for registering - IPX Hub
      
      Welcome, ${newUser.name}!
      
      Your Registration ID: ${newUser.registrationId}
      
      We're excited to have you at IPX Hub.
      ---
    `);

    return newUser;
  };

  const updateUser = (updatedUser: User) => {
    if (user && user.id === updatedUser.id) {
      setUser(updatedUser);
    }
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  
  const awardPoints = (points: number, message?: string, targetUser? : User) => {
    const userToAward = targetUser || user;
    if (userToAward) {
      const updatedUser = { ...userToAward, points: (userToAward.points || 0) + points };
      updateUser(updatedUser);
      if (message && (!targetUser || (user && user.id === targetUser.id))) {
        toast({
          title: 'Points Awarded!',
          description: `You earned ${points} points ${message}.`,
        });
      }
    }
  };

  const checkInUser = (registrationId: string) => {
    const userToCheckIn = users.find(u => u.registrationId === registrationId);
    if (userToCheckIn) {
      if (!userToCheckIn.checkedIn) {
        const updatedUser = { ...userToCheckIn, checkedIn: true };
        updateUser(updatedUser);
        awardPoints(25, 'for checking in', updatedUser);
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Check-in Failed',
        description: 'No user found with that registration ID.',
      });
    }
  }

  const addEventToUser = (sessionId: string, force = false) => {
    if (user && !user.myEvents.includes(sessionId)) {
      const updatedUser = { ...user, myEvents: [...user.myEvents, sessionId] };
      updateUser(updatedUser);
      if (!force) {
        awardPoints(10, 'for adding a session');
      }
    }
  };

  const removeEventFromUser = (sessionId: string) => {
    if (user) {
      const updatedUser = { ...user, myEvents: user.myEvents.filter(id => id !== sessionId) };
      updateUser(updatedUser);
    }
  };


  const value = { user, users, loading, login, logout, register, updateUser, addEventToUser, removeEventFromUser, awardPoints, checkInUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
