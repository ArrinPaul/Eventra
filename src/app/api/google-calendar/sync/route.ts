/**
 * Google Calendar Events Sync API Route
 * Syncs events between Eventra and Google Calendar
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/config/firebase-admin';

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
  attendees?: { email: string }[];
}

interface SyncEventRequest {
  connectionId: string;
  event: {
    id: string;
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime: string;
    timezone?: string;
  };
  action: 'create' | 'update' | 'delete';
  googleEventId?: string;
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

    const body: SyncEventRequest = await request.json();
    const { connectionId, event, action, googleEventId } = body;

    if (!connectionId || !event || !action) {
      return NextResponse.json(
        { error: 'connectionId, event, and action are required' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get the stored connection
    const connectionDoc = await adminDb.collection('google_calendar_connections').doc(connectionId).get();
    
    if (!connectionDoc.exists) {
      return NextResponse.json(
        { error: 'Google Calendar connection not found' },
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
      await adminDb.collection('google_calendar_connections').doc(connectionId).update({
        accessToken,
        expiresAt: Date.now() + 3600 * 1000,
      });
    }

    const calendarEvent: CalendarEvent = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime,
        timeZone: event.timezone || 'UTC',
      },
      end: {
        dateTime: event.endTime,
        timeZone: event.timezone || 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    };

    let result;
    const calendarId = 'primary';

    switch (action) {
      case 'create': {
        const createResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(calendarEvent),
          }
        );

        if (!createResponse.ok) {
          const error = await createResponse.text();
          console.error('Failed to create calendar event:', error);
          return NextResponse.json(
            { error: 'Failed to create calendar event' },
            { status: 500 }
          );
        }

        result = await createResponse.json();

        // Store sync record
        await adminDb.collection('calendar_syncs').add({
          eventraEventId: event.id,
          googleEventId: result.id,
          connectionId,
          action: 'created',
          syncedAt: new Date(),
        });

        return NextResponse.json({
          success: true,
          googleEventId: result.id,
          htmlLink: result.htmlLink,
        });
      }

      case 'update': {
        if (!googleEventId) {
          return NextResponse.json(
            { error: 'googleEventId is required for update action' },
            { status: 400 }
          );
        }

        const updateResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(calendarEvent),
          }
        );

        if (!updateResponse.ok) {
          const error = await updateResponse.text();
          console.error('Failed to update calendar event:', error);
          return NextResponse.json(
            { error: 'Failed to update calendar event' },
            { status: 500 }
          );
        }

        result = await updateResponse.json();

        // Update sync record
        await adminDb.collection('calendar_syncs').add({
          eventraEventId: event.id,
          googleEventId,
          connectionId,
          action: 'updated',
          syncedAt: new Date(),
        });

        return NextResponse.json({
          success: true,
          googleEventId: result.id,
          htmlLink: result.htmlLink,
        });
      }

      case 'delete': {
        if (!googleEventId) {
          return NextResponse.json(
            { error: 'googleEventId is required for delete action' },
            { status: 400 }
          );
        }

        const deleteResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!deleteResponse.ok && deleteResponse.status !== 404) {
          const error = await deleteResponse.text();
          console.error('Failed to delete calendar event:', error);
          return NextResponse.json(
            { error: 'Failed to delete calendar event' },
            { status: 500 }
          );
        }

        // Record deletion
        await adminDb.collection('calendar_syncs').add({
          eventraEventId: event.id,
          googleEventId,
          connectionId,
          action: 'deleted',
          syncedAt: new Date(),
        });

        return NextResponse.json({
          success: true,
          message: 'Event deleted from Google Calendar',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use create, update, or delete.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error syncing calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendar event' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch synced events
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'connectionId is required' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get the stored connection
    const connectionDoc = await adminDb.collection('google_calendar_connections').doc(connectionId).get();
    
    if (!connectionDoc.exists) {
      return NextResponse.json(
        { error: 'Google Calendar connection not found' },
        { status: 404 }
      );
    }

    const connection = connectionDoc.data()!;
    let accessToken = connection.accessToken;

    // Check if token needs refresh
    if (connection.expiresAt && connection.expiresAt < Date.now()) {
      if (!connection.refreshToken) {
        return NextResponse.json(
          { error: 'Token expired. Please reconnect.' },
          { status: 401 }
        );
      }
      accessToken = await refreshAccessToken(connection.refreshToken);
    }

    // Fetch upcoming events from Google Calendar
    const now = new Date().toISOString();
    const maxTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${maxTime}&maxResults=50&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!eventsResponse.ok) {
      const error = await eventsResponse.text();
      console.error('Failed to fetch calendar events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calendar events' },
        { status: 500 }
      );
    }

    const eventsData = await eventsResponse.json();

    return NextResponse.json({
      events: eventsData.items || [],
      nextPageToken: eventsData.nextPageToken,
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
