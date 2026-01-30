/**
 * Google Workspace OAuth Connection API Route
 * Handles initiating OAuth flow for Google Workspace integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google-workspace/callback`;

// Scopes required for Google Workspace integration
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, verify the Firebase token
    // const token = authHeader.split('Bearer ')[1];
    // const decodedToken = await adminAuth.verifyIdToken(token);
    // const userId = decodedToken.uid;

    if (!GOOGLE_CLIENT_ID) {
      // Return demo mode response if Google credentials not configured
      return NextResponse.json({
        demoMode: true,
        message: 'Google Workspace integration requires Google Cloud Console setup. Please configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables.',
        setupInstructions: [
          '1. Go to Google Cloud Console (https://console.cloud.google.com)',
          '2. Create a new project or select existing one',
          '3. Enable Google Drive API, Google Docs API, Google Sheets API, and Google Calendar API',
          '4. Create OAuth 2.0 credentials (Web application type)',
          '5. Add authorized redirect URI: ' + (GOOGLE_REDIRECT_URI || 'YOUR_APP_URL/api/google-workspace/callback'),
          '6. Copy Client ID and Client Secret to your .env.local file',
        ],
      });
    }

    // Generate OAuth URL
    const state = Buffer.from(JSON.stringify({
      timestamp: Date.now(),
      returnUrl: request.nextUrl.searchParams.get('returnUrl') || '/integrations',
    })).toString('base64');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GOOGLE_SCOPES);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    return NextResponse.json({
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Workspace connection' },
      { status: 500 }
    );
  }
}
