/**
 * Google Sheets Registration Sync API Route
 * Syncs event registration data to a Google Spreadsheet
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/config/firebase-admin';

interface SyncRegistrationsRequest {
  connectionId: string;
  spreadsheetId: string;
  eventId: string;
  registrations: Registration[];
}

interface Registration {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  registrationDate: string;
  checkInStatus: 'Checked In' | 'Pending' | 'No Show';
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  customFields?: Record<string, unknown>;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SyncRegistrationsRequest = await request.json();
    const { connectionId, spreadsheetId, eventId, registrations } = body;

    if (!connectionId || !spreadsheetId || !eventId) {
      return NextResponse.json(
        { error: 'connectionId, spreadsheetId, and eventId are required' },
        { status: 400 }
      );
    }

    // Get the stored connection
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const connectionDoc = await adminDb.collection('google_workspace_connections').doc(connectionId).get();
    
    if (!connectionDoc.exists) {
      return NextResponse.json(
        { error: 'Google Workspace connection not found' },
        { status: 404 }
      );
    }

    const connection = connectionDoc.data()!;
    let accessToken = connection.accessToken;

    // Check if token needs refresh
    if (connection.expiresAt && connection.expiresAt < Date.now()) {
      if (!connection.refreshToken) {
        return NextResponse.json(
          { error: 'Token expired and no refresh token available. Please reconnect.' },
          { status: 401 }
        );
      }
      accessToken = await refreshAccessToken(connection.refreshToken);
      
      // Update stored access token
      await adminDb.collection('google_workspace_connections').doc(connectionId).update({
        accessToken,
        expiresAt: Date.now() + 3600 * 1000, // 1 hour
      });
    }

    // Prepare data for the spreadsheet
    // First row is headers, subsequent rows are data
    const values = registrations.map(reg => [
      reg.id,
      reg.name,
      reg.email,
      reg.ticketType,
      reg.registrationDate,
      reg.checkInStatus,
      reg.paymentStatus,
    ]);

    // Clear existing data and write new data
    // First, clear the data range (keeping headers)
    const clearResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Registrations!A2:G:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!clearResponse.ok) {
      const error = await clearResponse.text();
      console.error('Failed to clear spreadsheet:', error);
      // Continue anyway - might be a new sheet
    }

    // Write the registration data
    if (values.length > 0) {
      const updateResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Registrations!A2:G${values.length + 1}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: `Registrations!A2:G${values.length + 1}`,
            majorDimension: 'ROWS',
            values,
          }),
        }
      );

      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        console.error('Failed to update spreadsheet:', error);
        return NextResponse.json(
          { error: 'Failed to sync registrations to spreadsheet' },
          { status: 500 }
        );
      }
    }

    // Log the sync operation
    await adminDb.collection('sync_logs').add({
      eventId,
      spreadsheetId,
      connectionId,
      operation: 'sync_registrations',
      recordsCount: registrations.length,
      syncedAt: new Date(),
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      syncedRecords: registrations.length,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error syncing registrations:', error);
    return NextResponse.json(
      { error: 'Failed to sync registrations' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current sync status
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const spreadsheetId = searchParams.get('spreadsheetId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get latest sync log for this event/spreadsheet
    let query = adminDb.collection('sync_logs')
      .where('eventId', '==', eventId)
      .orderBy('syncedAt', 'desc')
      .limit(10);

    if (spreadsheetId) {
      query = adminDb.collection('sync_logs')
        .where('eventId', '==', eventId)
        .where('spreadsheetId', '==', spreadsheetId)
        .orderBy('syncedAt', 'desc')
        .limit(10);
    }

    const logsSnapshot = await query.get();
    
    const syncLogs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      syncedAt: doc.data().syncedAt?.toDate?.()?.toISOString() || doc.data().syncedAt,
    }));

    return NextResponse.json({
      syncLogs,
      lastSync: syncLogs[0] || null,
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}
