'use client';
import { useEffect } from 'react';

export function ClerkDebug() {
  useEffect(() => {
    console.log('--- Clerk Debug ---');
    console.log('Publishable Key:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Present' : 'MISSING');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Window Location:', window.location.href);
    console.log('-------------------');
  }, []);
  return null;
}
