/**
 * Google Calendar OAuth Connection API Route
 * Handles initiating OAuth flow for Google Calendar integration
 */

import { NextRequest, NextResponse } from 'next/server';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALENDAR_REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/callback`;

// Scopes required for Google Calendar integration
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json({
        demoMode: true,
        message: 'Google Calendar integration requires Google Cloud Console setup. Please configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALENDAR_REDIRECT_URI environment variables.',
        setupInstructions: [
          '1. Go to Google Cloud Console (https://console.cloud.google.com)',
          '2. Create a new project or select existing one',
          '3. Enable Google Calendar API',
          '4. Create OAuth 2.0 credentials (Web application type)',
          '5. Add authorized redirect URI: ' + (GOOGLE_CALENDAR_REDIRECT_URI || 'YOUR_APP_URL/api/google-calendar/callback'),
          '6. Copy Client ID and Client Secret to your .env.local file',
        ],
      });
    }

    // Generate state for OAuth flow
    const state = Buffer.from(JSON.stringify({
      timestamp: Date.now(),
      returnUrl: request.nextUrl.searchParams.get('returnUrl') || '/calendar',
    })).toString('base64');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', GOOGLE_CALENDAR_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GOOGLE_CALENDAR_SCOPES);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    return NextResponse.json({
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    console.error('Error initiating Google Calendar OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Calendar connection' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return connection status and setup info
  const isConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  
  return NextResponse.json({
    configured: isConfigured,
    message: isConfigured 
      ? 'Google Calendar integration is configured and ready'
      : 'Google Calendar requires OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.',
  });
}
