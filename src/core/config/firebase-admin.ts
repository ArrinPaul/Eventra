/**
 * Firebase Admin SDK Configuration
 * Server-side Firebase initialization for API routes
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // Check for service account credentials
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (serviceAccount) {
    try {
      const parsedServiceAccount = JSON.parse(serviceAccount);
      return admin.initializeApp({
        credential: admin.credential.cert(parsedServiceAccount),
        projectId,
      });
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    }
  }

  // Try using application default credentials (for Firebase hosting/Cloud Functions)
  if (projectId) {
    try {
      return admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
    } catch (error) {
      console.warn('Failed to initialize with application default credentials:', error);
    }
  }

  // Fallback: Initialize without credentials (limited functionality)
  console.warn(
    'Firebase Admin SDK initialized without credentials. ' +
    'Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable for full functionality.'
  );
  
  return null;
}

const app = initializeFirebaseAdmin();

// Export admin services
export const adminApp = app;
export const adminAuth = app ? admin.auth(app) : null;
export const adminDb = app ? admin.firestore(app) : null;
export const adminStorage = app ? admin.storage(app) : null;

// Helper function to verify Firebase ID tokens
export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken | null> {
  if (!adminAuth) {
    console.warn('Admin auth not available - token verification skipped');
    return null;
  }

  try {
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Helper function to get user by UID
export async function getUserByUid(uid: string): Promise<admin.auth.UserRecord | null> {
  if (!adminAuth) {
    console.warn('Admin auth not available');
    return null;
  }

  try {
    return await adminAuth.getUser(uid);
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

export default admin;
