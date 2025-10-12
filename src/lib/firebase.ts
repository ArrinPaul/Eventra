// Firebase Configuration - Placeholder for Firebase Studio migration
// Note: This will be updated with actual Firebase configuration during deployment
export const mockFirebaseConfig = {
  // These will be replaced with actual Firebase config values
  apiKey: "mock-api-key",
  authDomain: "ipx-hub.firebaseapp.com",
  projectId: "ipx-hub",
  storageBucket: "ipx-hub.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

// Mock Firebase v9 modular SDK functions
export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Mock auth state changes
    return () => {}; // unsubscribe function
  },
  signInWithEmailAndPassword: async (email: string, password: string) => {
    // Mock sign in
    return { user: { uid: 'mock-user-id', email } };
  },
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    // Mock sign up
    return { user: { uid: 'mock-user-id', email } };
  },
  signOut: async () => {
    // Mock sign out
  },
};

// Mock Firestore instance  
export const mockDb = {
  type: 'firestore' as const,
  app: mockApp,
  toJSON: () => ({}),
  collection: (path: string) => ({
    doc: (id?: string) => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async (data: any) => {},
      update: async (data: any) => {},
      delete: async () => {},
      onSnapshot: (callback: (doc: any) => void) => {
        return () => {}; // unsubscribe
      },
    }),
    get: async () => ({ docs: [], empty: true }),
    add: async (data: any) => ({ id: 'mock-doc-id' }),
    where: (field: string, op: any, value: any) => ({
      get: async () => ({ docs: [], empty: true }),
      onSnapshot: (callback: (snapshot: any) => void) => {
        return () => {}; // unsubscribe
      },
    }),
    orderBy: (field: string, direction?: string) => ({
      limit: (n: number) => ({
        get: async () => ({ docs: [], empty: true }),
        onSnapshot: (callback: (snapshot: any) => void) => {
          return () => {}; // unsubscribe
        },
      }),
      get: async () => ({ docs: [], empty: true }),
    }),
    onSnapshot: (callback: (snapshot: any) => void) => {
      return () => {}; // unsubscribe
    },
  }),
};

// Mock v9 modular functions
export const collection = (db: any, path: string, ...pathSegments: string[]) => ({
  type: 'collection',
  id: path,
  path: path,
  parent: null,
  converter: null,
  firestore: db,
});

export const doc = (db: any, path: string, ...pathSegments: string[]) => ({
  type: 'document',
  firestore: db,
  id: path.split('/').pop(),
  path: path,
  parent: null,
  converter: null,
});

export const query = (ref: any, ...queryConstraints: any[]) => ({
  type: 'query',
  firestore: ref.firestore,
});

export const where = (fieldPath: string, opStr: string, value: any) => ({
  type: 'where',
  fieldPath,
  opStr,
  value,
});

export const orderBy = (fieldPath: string, directionStr?: string) => ({
  type: 'orderBy',
  fieldPath,
  directionStr,
});

export const limit = (limit: number) => ({
  type: 'limit',
  limit,
});

export const getDoc = async (docRef: any) => ({
  exists: false,
  data: () => null,
  id: docRef.id,
});

export const getDocs = async (queryOrRef: any) => ({
  docs: [],
  empty: true,
  size: 0,
});

export const setDoc = async (docRef: any, data: any) => {};

export const updateDoc = async (docRef: any, data: any) => {};

export const addDoc = async (collectionRef: any, data: any) => ({
  id: 'mock-doc-id',
});

export const deleteDoc = async (docRef: any) => {};

export const onSnapshot = (ref: any, callback: (snapshot: any) => void) => {
  return () => {}; // unsubscribe
};

export const httpsCallable = (functions: any, name: string) => async (data: any) => {
  return { data: {} };
};

export const mockStorage = {
  ref: (path: string) => ({
    put: async (file: File) => ({ 
      ref: { 
        getDownloadURL: async () => 'https://mock-url.com/file.jpg' 
      } 
    }),
    delete: async () => {},
  }),
};

export const mockFunctions = {
  httpsCallable: (name: string) => async (data: any) => {
    // Mock function calls
    return { data: {} };
  },
  app: mockApp,
  region: 'us-central1',
  customDomain: null,
};

// Mock Firebase app
export const mockApp = {
  name: 'ipx-hub',
  options: mockFirebaseConfig,
  automaticDataCollectionEnabled: false,
};

// Export services (will be replaced with real Firebase in production)
export const auth = mockAuth;
export const db = mockDb;
export const storage = mockStorage;
export const functions = mockFunctions;
export const app = mockApp;