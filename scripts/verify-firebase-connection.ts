
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Load env vars
dotenv.config({ path: '.env.local' });

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('Checking Firebase Config...');
if (!config.apiKey || !config.projectId) {
  console.error('❌ Missing Firebase configuration in .env.local');
  console.log('Current Config:', JSON.stringify(config, null, 2));
  process.exit(1);
}
console.log(`✅ Project ID: ${config.projectId}`);

try {
  const app = initializeApp(config);
  const db = getFirestore(app);
  console.log('✅ Firebase App Initialized');
  
  console.log('📡 Attempting to connect to Firestore...');
  // Set a timeout
  const timeout = setTimeout(() => {
      console.error('❌ Connection timed out');
      process.exit(1);
  }, 10000);

  getDocs(collection(db, 'test_connection')).then(() => {
      clearTimeout(timeout);
      console.log('✅ Firestore Connection Successful (Read empty/test collection)');
      process.exit(0);
  }).catch((err) => {
      clearTimeout(timeout);
      if (err.code === 'permission-denied') {
           console.log('✅ Firestore Connected (Permission Denied - implies connection worked)');
           process.exit(0);
      }
      console.error('❌ Firestore Connection Failed:', err.message);
      process.exit(1);
  });

} catch (error) {
  console.error('❌ Error initializing Firebase:', error);
  process.exit(1);
}
