/**
 * Google Workspace OAuth Callback API Route
 * Handles the OAuth callback from Google and exchanges code for tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/config/firebase-admin';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google-workspace/callback`;

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Unknown error';
      console.error('Google OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/integrations?error=${encodeURIComponent(errorDescription)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/integrations?error=No authorization code received', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // Get user info
    const userInfo = await getUserInfo(tokens.access_token);

    // The state parameter contains the userId
    const userId = state;

    if (userId && adminDb) {
      // Update user document directly
      await adminDb.collection('users').doc(userId).update({
        googleWorkspace: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: Date.now() + tokens.expires_in * 1000,
          connected: true,
          connectedAt: new Date(),
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          scope: tokens.scope
        }
      });
    }

    // Redirect back to integrations page with success indicator
    return NextResponse.redirect(
      new URL('/integrations?google_connected=true', request.url)
    );
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
