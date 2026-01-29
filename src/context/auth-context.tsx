'use client';
import { createContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, FIRESTORE_COLLECTIONS } from '@/lib/firebase';
import { subscribeToAuthChanges, signOutUser } from '@/lib/auth-service';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string) => Promise<User | null>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'id' | 'registrationId' | 'checkedIn' | 'myEvents' | 'points'>) => Promise<User>;
  updateUser: (updatedUser: Partial<User>) => Promise<void>;
  addEventToUser: (sessionId: string, force?: boolean) => Promise<void>;
  removeEventFromUser: (sessionId: string) => Promise<void>;
  awardPoints: (points: number, message?: string) => Promise<void>;
  checkInUser: (registrationId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to convert Firebase/Firestore data to User type
function mapFirestoreToUser(uid: string, data: any): User {
  return {
    id: uid,
    name: data.displayName || data.name || '',
    email: data.email || '',
    role: data.role || 'attendee',
    department: data.department || '',
    year: data.year || '',
    avatar: data.photoURL || data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${data.displayName || 'User'}`,
    registrationId: data.registrationId || `REG-${uid.slice(0, 8).toUpperCase()}`,
    checkedIn: data.checkedIn || false,
    myEvents: data.myEvents || [],
    points: data.points || 0,
    interests: data.interests || [],
    bio: data.bio || '',
    phone: data.phone || '',
    organization: data.organization || '',
    onboardingCompleted: data.onboardingCompleted || false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load user profile from Firestore
  const loadUserProfile = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, fbUser.uid));
      
      if (userDoc.exists()) {
        return mapFirestoreToUser(fbUser.uid, userDoc.data());
      }
      
      // Create new user profile if it doesn't exist
      const newUserData = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        role: 'attendee',
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        points: 0,
        myEvents: [],
        interests: [],
        registrationId: `REG-${fbUser.uid.slice(0, 8).toUpperCase()}`,
        checkedIn: false,
      };
      
      await setDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, fbUser.uid), newUserData);
      return mapFirestoreToUser(fbUser.uid, newUserData);
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }, []);

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        const userProfile = await loadUserProfile(fbUser);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  // Refresh user data from Firestore
  const refreshUser = useCallback(async () => {
    if (firebaseUser) {
      const userProfile = await loadUserProfile(firebaseUser);
      setUser(userProfile);
    }
  }, [firebaseUser, loadUserProfile]);

  // Login - kept for backwards compatibility (actual login via auth-service)
  const login = async (email: string): Promise<User | null> => {
    console.warn('login() is deprecated. Use signInWithEmail from auth-service instead.');
    return user;
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await signOutUser();
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log out. Please try again.',
      });
    }
  };

  // Register - creates/updates user in Firestore
  const register = async (
    userData: Omit<User, 'id' | 'registrationId' | 'checkedIn' | 'myEvents' | 'points'>
  ): Promise<User> => {
    if (!firebaseUser) {
      throw new Error('No authenticated user. Please sign up first.');
    }

    const registrationId = `${userData.role.slice(0, 3).toUpperCase()}-${firebaseUser.uid.slice(0, 5).toUpperCase()}`;
    
    const newUserData = {
      ...userData,
      uid: firebaseUser.uid,
      displayName: userData.name,
      photoURL: userData.avatar,
      registrationId,
      checkedIn: false,
      myEvents: [],
      points: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
    };

    await setDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid), newUserData, { merge: true });
    
    const newUser = mapFirestoreToUser(firebaseUser.uid, newUserData);
    setUser(newUser);
    
    return newUser;
  };

  // Update user profile
  const updateUser = async (updatedData: Partial<User>): Promise<void> => {
    if (!user || !firebaseUser) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No user logged in.',
      });
      return;
    }

    try {
      const { id, ...dataToUpdate } = updatedData;
      
      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid), {
        ...dataToUpdate,
        displayName: dataToUpdate.name || user.name,
        photoURL: dataToUpdate.avatar || user.avatar,
        updatedAt: serverTimestamp(),
      });

      setUser(prev => prev ? { ...prev, ...updatedData } : null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.',
      });
    }
  };

  // Award points to user
  const awardPoints = async (points: number, message?: string): Promise<void> => {
    if (!user || !firebaseUser || user.role === 'organizer') {
      return;
    }

    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid), {
        points: increment(points),
        updatedAt: serverTimestamp(),
      });

      setUser(prev => prev ? { ...prev, points: (prev.points || 0) + points } : null);
      
      if (message) {
        toast({
          title: 'Points Awarded!',
          description: `You earned ${points} points ${message}.`,
        });
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  // Check in user
  const checkInUser = async (registrationId: string): Promise<void> => {
    if (!firebaseUser) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Not authenticated.',
      });
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid));
      
      if (!userDoc.exists()) {
        toast({
          variant: 'destructive',
          title: 'Check-in Failed',
          description: 'User not found.',
        });
        return;
      }

      const userData = userDoc.data();
      
      if (userData.registrationId !== registrationId) {
        toast({
          variant: 'destructive',
          title: 'Check-in Failed',
          description: 'Invalid registration ID.',
        });
        return;
      }

      if (userData.checkedIn) {
        toast({
          title: 'Already Checked In',
          description: 'This user has already been checked in.',
        });
        return;
      }

      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid), {
        checkedIn: true,
        checkedInAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setUser(prev => prev ? { ...prev, checkedIn: true } : null);
      await awardPoints(25, 'for checking in');
      
      toast({
        title: 'Check-in Successful!',
        description: 'Welcome to the event!',
      });
    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        variant: 'destructive',
        title: 'Check-in Failed',
        description: 'An error occurred. Please try again.',
      });
    }
  };

  // Add event to user's list
  const addEventToUser = async (sessionId: string, force = false): Promise<void> => {
    if (!user || !firebaseUser) return;
    if (user.myEvents.includes(sessionId)) return;

    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid), {
        myEvents: arrayUnion(sessionId),
        updatedAt: serverTimestamp(),
      });

      setUser(prev => prev ? { ...prev, myEvents: [...prev.myEvents, sessionId] } : null);
      
      if (!force) {
        await awardPoints(10, 'for registering for an event');
      }
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  // Remove event from user's list
  const removeEventFromUser = async (sessionId: string): Promise<void> => {
    if (!user || !firebaseUser) return;

    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid), {
        myEvents: arrayRemove(sessionId),
        updatedAt: serverTimestamp(),
      });

      setUser(prev => prev ? { ...prev, myEvents: prev.myEvents.filter(id => id !== sessionId) } : null);
    } catch (error) {
      console.error('Error removing event:', error);
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    login,
    logout,
    register,
    updateUser,
    addEventToUser,
    removeEventFromUser,
    awardPoints,
    checkInUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
