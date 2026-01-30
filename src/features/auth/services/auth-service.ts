/**
 * Firebase Authentication Service
 * Handles Google OAuth and Email/Password authentication
 */

import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/core/config/firebase';
import { FIRESTORE_COLLECTIONS } from '@/core/config/firebase';
import { EventOSRole } from '@/core/config/eventos-config';
import { getFirebaseErrorMessage, isFirebaseError } from '@/core/utils/utils';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: EventOSRole;
  onboardingCompleted: boolean;
  organizationId?: string;
}

export interface SignupData {
  email: string;
  password: string;
  displayName: string;
  role: 'attendee' | 'organizer';
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid));
    
    if (!userDoc.exists()) {
      // New user - create profile with default role
      const newUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: 'attendee' as EventOSRole,
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        emailVerified: firebaseUser.emailVerified,
        points: 0,
        myEvents: [],
        interests: [],
      };
      
      await setDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid), newUserData);
      
      // Set auth cookies for middleware
      setAuthCookies(firebaseUser.uid, 'attendee');
      
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: 'attendee',
        onboardingCompleted: false,
      };
    }
    
    const userData = userDoc.data();
    
    // Set auth cookies for middleware
    setAuthCookies(firebaseUser.uid, userData.role);
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || userData.displayName,
      photoURL: firebaseUser.photoURL || userData.photoURL,
      role: userData.role || 'attendee',
      onboardingCompleted: userData.onboardingCompleted ?? false,
      organizationId: userData.organizationId,
    };
  } catch (error: unknown) {
    console.error('Google sign-in error:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthUser | null> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = result.user;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found. Please contact support.');
    }
    
    const userData = userDoc.data();
    
    // Update last login
    await setDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid), {
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
    
    // Set auth cookies for middleware
    setAuthCookies(firebaseUser.uid, userData.role);
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: userData.displayName || firebaseUser.displayName,
      photoURL: userData.photoURL || firebaseUser.photoURL,
      role: userData.role || 'attendee',
      onboardingCompleted: userData.onboardingCompleted ?? false,
      organizationId: userData.organizationId,
    };
  } catch (error: unknown) {
    console.error('Email sign-in error:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

/**
 * Sign up with Email and Password
 */
export async function signUpWithEmail(data: SignupData): Promise<AuthUser | null> {
  try {
    const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const firebaseUser = result.user;
    
    // Update display name in Firebase Auth
    await updateProfile(firebaseUser, {
      displayName: data.displayName,
    });
    
    // Create user profile in Firestore
    const newUserData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: data.displayName,
      photoURL: null,
      role: data.role as EventOSRole,
      onboardingCompleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      emailVerified: firebaseUser.emailVerified,
      points: 0,
      myEvents: [],
      interests: [],
    };
    
    await setDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid), newUserData);
    
    // Set auth cookies for middleware
    setAuthCookies(firebaseUser.uid, data.role);
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: data.displayName,
      photoURL: null,
      role: data.role,
      onboardingCompleted: false,
    };
  } catch (error: unknown) {
    console.error('Email sign-up error:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

/**
 * Sign out
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    clearAuthCookies();
  } catch (error: unknown) {
    console.error('Sign out error:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: unknown) {
    console.error('Password reset error:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuthChanges(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<AuthUser | null> {
  try {
    const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, uid));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    return {
      uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      role: userData.role || 'attendee',
      onboardingCompleted: userData.onboardingCompleted ?? false,
      organizationId: userData.organizationId,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  uid: string, 
  data: Partial<AuthUser>
): Promise<void> {
  try {
    await setDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, uid), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    // Update role cookie if role changed
    if (data.role) {
      setAuthCookies(uid, data.role);
    }
  } catch (error: unknown) {
    console.error('Error updating user profile:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

/**
 * Set authentication cookies for middleware
 */
function setAuthCookies(uid: string, role: string): void {
  if (typeof document !== 'undefined') {
    // Set cookies with 7 day expiry
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `auth-token=${uid}; path=/; expires=${expires}; SameSite=Lax`;
    document.cookie = `user-role=${role}; path=/; expires=${expires}; SameSite=Lax`;
  }
}

/**
 * Clear authentication cookies
 */
function clearAuthCookies(): void {
  if (typeof document !== 'undefined') {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}