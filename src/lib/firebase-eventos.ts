/**
 * EventOS Firebase Configuration
 * Production-ready Firebase setup with emulator support
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { EVENTOS_CONFIG } from './eventos-config';

// Firebase configuration
const firebaseConfig = EVENTOS_CONFIG.firebase.config;

// Initialize Firebase App
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);
export const storage: FirebaseStorage = getStorage(app);

// Analytics (client-side only)
let analytics: Analytics | undefined;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  analytics = getAnalytics(app);
}

// Connect to emulators in development
if (EVENTOS_CONFIG.firebase.emulator.enabled && typeof window !== 'undefined') {
  const { auth: authConfig, firestore, functions: functionsConfig, storage: storageConfig } = EVENTOS_CONFIG.firebase.emulator;
  
  // Connect to emulators only if not already connected
  if (!auth.app.options.projectId?.includes('demo-')) {
    try {
      connectAuthEmulator(auth, `http://${authConfig.host}:${authConfig.port}`, { disableWarnings: true });
      connectFirestoreEmulator(db, firestore.host, firestore.port);
      connectFunctionsEmulator(functions, functionsConfig.host, functionsConfig.port);
      connectStorageEmulator(storage, storageConfig.host, storageConfig.port);
      console.log('🚀 Connected to Firebase Emulators');
    } catch (error) {
      console.warn('⚠️ Could not connect to Firebase Emulators:', error);
    }
  }
}

export { app, analytics };

/**
 * Firestore Collections Structure for EventOS
 */
export const FIRESTORE_COLLECTIONS = {
  // Core collections
  ORGANIZATIONS: 'organizations',
  USERS: 'users',
  EVENTS: 'events',
  SESSIONS: 'sessions',
  
  // Registration & Attendance
  REGISTRATIONS: 'registrations',
  CHECK_INS: 'check_ins',
  
  // Communication
  NOTIFICATIONS: 'notifications',
  MESSAGES: 'messages',
  CHAT_ROOMS: 'chat_rooms',
  
  // Analytics & Insights
  ANALYTICS_EVENTS: 'analytics_events',
  USER_ACTIVITIES: 'user_activities',
  EVENT_INSIGHTS: 'event_insights',
  
  // Payments & Subscriptions
  TRANSACTIONS: 'transactions',
  SUBSCRIPTIONS: 'subscriptions',
  INVOICES: 'invoices',
  
  // Integrations
  GOOGLE_INTEGRATIONS: 'google_integrations',
  AUTOMATION_WORKFLOWS: 'automation_workflows',
  
  // Content & Resources
  DOCUMENTS: 'documents',
  MEDIA_FILES: 'media_files',
  TEMPLATES: 'templates',
  
  // System
  AUDIT_LOGS: 'audit_logs',
  FEATURE_FLAGS: 'feature_flags',
  SYSTEM_SETTINGS: 'system_settings',
} as const;

/**
 * Firebase Security Rules Structure
 */
export const SECURITY_RULES_STRUCTURE = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Organizations - multi-tenant isolation
    match /organizations/{orgId} {
      allow read: if isOrgMember(orgId);
      allow write: if isOrgAdmin(orgId);
      
      // Users within organization
      match /users/{userId} {
        allow read: if isOrgMember(orgId) && (userId == request.auth.uid || hasPermission('view_users'));
        allow write: if userId == request.auth.uid || hasPermission('manage_users');
      }
      
      // Events within organization
      match /events/{eventId} {
        allow read: if isOrgMember(orgId) || isEventPublic(eventId);
        allow create: if isOrgMember(orgId) && hasPermission('create_events');
        allow update: if isOrgMember(orgId) && (isEventOrganizer(eventId) || hasPermission('edit_events'));
        allow delete: if isOrgAdmin(orgId) || hasPermission('delete_events');
        
        // Sessions within event
        match /sessions/{sessionId} {
          allow read: if isOrgMember(orgId) || isEventPublic(eventId);
          allow write: if isEventOrganizer(eventId) || hasPermission('edit_events');
        }
      }
      
      // Registrations within organization
      match /registrations/{registrationId} {
        allow read: if isOrgMember(orgId) && (resource.data.userId == request.auth.uid || hasPermission('view_registrations'));
        allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
        allow update: if resource.data.userId == request.auth.uid || hasPermission('manage_registrations');
      }
    }
    
    // Global collections
    match /notifications/{notificationId} {
      allow read, write: if resource.data.userId == request.auth.uid;
    }
    
    match /analytics_events/{eventId} {
      allow create: if request.auth != null;
      allow read: if hasPermission('view_analytics');
    }
    
    // Helper functions
    function isOrgMember(orgId) {
      return request.auth != null && 
             request.auth.token.organizationId == orgId;
    }
    
    function isOrgAdmin(orgId) {
      return isOrgMember(orgId) && 
             request.auth.token.role in ['admin', 'organizer'];
    }
    
    function hasPermission(permission) {
      return request.auth != null && 
             permission in request.auth.token.permissions;
    }
    
    function isEventOrganizer(eventId) {
      return request.auth.uid in get(/databases/$(database)/documents/events/$(eventId)).data.organizers;
    }
    
    function isEventPublic(eventId) {
      return get(/databases/$(database)/documents/events/$(eventId)).data.visibility == 'public';
    }
  }
}
`;

/**
 * Storage Rules Structure
 */
export const STORAGE_RULES_STRUCTURE = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Organization-specific storage
    match /organizations/{orgId}/{allPaths=**} {
      allow read: if isOrgMember(orgId);
      allow write: if isOrgMember(orgId) && 
                     request.resource.size < 50 * 1024 * 1024 && // 50MB limit
                     request.resource.contentType.matches('image/.*|application/pdf|text/.*');
    }
    
    // User avatars
    match /avatars/{userId} {
      allow read: if true; // Public read for avatars
      allow write: if request.auth.uid == userId &&
                     request.resource.size < 5 * 1024 * 1024 && // 5MB limit
                     request.resource.contentType.matches('image/.*');
    }
    
    // Event media
    match /events/{eventId}/{allPaths=**} {
      allow read: if true; // Public read for event media
      allow write: if isEventOrganizer(eventId);
    }
    
    function isOrgMember(orgId) {
      return request.auth != null && 
             request.auth.token.organizationId == orgId;
    }
    
    function isEventOrganizer(eventId) {
      return request.auth != null; // Simplified for now
    }
  }
}
`;

/**
 * Firebase Functions Configuration
 */
export const FUNCTIONS_CONFIG = {
  region: 'us-central1',
  timeoutSeconds: 300,
  memory: '1GB' as const,
  
  // Scheduled functions
  scheduledFunctions: {
    dailyAnalytics: '0 2 * * *', // Daily at 2 AM
    weeklyReports: '0 9 * * 1', // Weekly on Monday at 9 AM
    subscriptionChecks: '0 0 1 * *', // Monthly on 1st at midnight
    eventReminders: '*/15 * * * *', // Every 15 minutes
  },
  
  // HTTP functions
  httpFunctions: [
    'processPayment',
    'sendNotification',
    'generateReport',
    'syncGoogleCalendar',
    'processWebhook',
    'aiChatbot',
    'generateInsights',
  ],
  
  // Callable functions
  callableFunctions: [
    'createOrganization',
    'inviteUser',
    'generateQRCode',
    'processRefund',
    'exportData',
    'validateCoupon',
  ],
};

/**
 * Helper functions for Firebase operations
 */
export const firebase = {
  app,
  auth,
  db,
  functions,
  storage,
  analytics,
  collections: FIRESTORE_COLLECTIONS,
};

export default firebase;