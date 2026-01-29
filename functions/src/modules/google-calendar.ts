'use server';

import { google } from 'googleapis';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Google Calendar integration configuration
const config = functions.config();
const GOOGLE_CALENDAR_CONFIG = {
  clientId: config.google?.calendar?.client_id || process.env.GOOGLE_CALENDAR_CLIENT_ID,
  clientSecret: config.google?.calendar?.client_secret || process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  redirectUri: config.google?.calendar?.redirect_uri || process.env.GOOGLE_CALENDAR_REDIRECT_URI,
};

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

// Initialize Google Calendar client
function getCalendarClient(accessToken: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CALENDAR_CONFIG.clientId,
    GOOGLE_CALENDAR_CONFIG.clientSecret,
    GOOGLE_CALENDAR_CONFIG.redirectUri
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Get Google Calendar authorization URL
export const getGoogleCalendarAuthUrl = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CALENDAR_CONFIG.clientId,
      GOOGLE_CALENDAR_CONFIG.clientSecret,
      GOOGLE_CALENDAR_CONFIG.redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: context.auth.uid, // Include user ID for verification
    });

    return { authUrl: url };
  } catch (error) {
    console.error('Error generating Google Calendar auth URL:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate auth URL');
  }
});

// Handle Google Calendar OAuth callback
export const handleGoogleCalendarCallback = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { code, state } = data;

  if (!code) {
    throw new functions.https.HttpsError('invalid-argument', 'Authorization code is required');
  }

  if (state !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid state parameter');
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CALENDAR_CONFIG.clientId,
      GOOGLE_CALENDAR_CONFIG.clientSecret,
      GOOGLE_CALENDAR_CONFIG.redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in user document
    await db.collection('users').doc(context.auth.uid).update({
      googleCalendar: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        connected: true,
        connectedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
    });

    return { success: true, message: 'Google Calendar connected successfully' };
  } catch (error) {
    console.error('Error handling Google Calendar callback:', error);
    throw new functions.https.HttpsError('internal', 'Failed to connect Google Calendar');
  }
});

// Sync event to Google Calendar
export const syncEventToGoogleCalendar = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { eventId, action = 'create' } = data;
  const userId = context.auth.uid;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
  }

  try {
    // Get user's Google Calendar credentials
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.googleCalendar?.connected || !userData.googleCalendar.accessToken) {
      throw new functions.https.HttpsError('failed-precondition', 'Google Calendar not connected');
    }

    // Get event data
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();
    if (!eventData) {
      throw new functions.https.HttpsError('not-found', 'Event data not found');
    }

    const calendar = getCalendarClient(
      userData.googleCalendar.accessToken,
      userData.googleCalendar.refreshToken
    );

    const calendarEvent = {
      summary: eventData.title,
      description: `${eventData.description}\n\nEvent organized through EventOS`,
      start: {
        dateTime: eventData.startTime.toDate().toISOString(),
        timeZone: eventData.timeZone || 'UTC',
      },
      end: {
        dateTime: eventData.endTime.toDate().toISOString(),
        timeZone: eventData.timeZone || 'UTC',
      },
      location: eventData.location,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours
          { method: 'popup', minutes: 60 }, // 1 hour
          { method: 'popup', minutes: 15 }, // 15 minutes
        ],
      },
      attendees: eventData.attendees ? eventData.attendees.map((email: string) => ({ email })) : [],
    };

    let result;
    let googleCalendarEventId;

    switch (action) {
      case 'create':
        result = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: calendarEvent,
        });
        googleCalendarEventId = result.data.id;
        
        // Store Google Calendar event ID in our event
        await db.collection('events').doc(eventId).update({
          googleCalendarSync: {
            [userId]: {
              googleEventId: googleCalendarEventId,
              syncedAt: admin.firestore.FieldValue.serverTimestamp(),
              lastAction: 'create'
            }
          }
        });
        break;

      case 'update':
        // Get existing Google Calendar event ID
        const existingSync = eventData.googleCalendarSync?.[userId];
        if (!existingSync?.googleEventId) {
          throw new functions.https.HttpsError('not-found', 'No existing Google Calendar sync found');
        }

        result = await calendar.events.update({
          calendarId: 'primary',
          eventId: existingSync.googleEventId,
          requestBody: calendarEvent,
        });

        await db.collection('events').doc(eventId).update({
          [`googleCalendarSync.${userId}.syncedAt`]: admin.firestore.FieldValue.serverTimestamp(),
          [`googleCalendarSync.${userId}.lastAction`]: 'update'
        });
        break;

      case 'delete':
        const deleteSync = eventData.googleCalendarSync?.[userId];
        if (!deleteSync?.googleEventId) {
          throw new functions.https.HttpsError('not-found', 'No existing Google Calendar sync found');
        }

        await calendar.events.delete({
          calendarId: 'primary',
          eventId: deleteSync.googleEventId,
        });

        await db.collection('events').doc(eventId).update({
          [`googleCalendarSync.${userId}`]: admin.firestore.FieldValue.delete()
        });
        break;

      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
    }

    return { 
      success: true, 
      message: `Event ${action}d in Google Calendar successfully`,
      googleEventId: googleCalendarEventId 
    };

  } catch (error: any) {
    console.error('Error syncing event to Google Calendar:', error);
    
    // Handle specific Google API errors
    if (error.code === 401) {
      throw new functions.https.HttpsError('unauthenticated', 'Google Calendar access expired. Please reconnect.');
    }
    
    throw new functions.https.HttpsError('internal', `Failed to sync event: ${error.message}`);
  }
});

// Auto-sync user's registered events
export const autoSyncUserEvents = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    // Get user's registrations
    const registrationsSnapshot = await db.collection('registrations')
      .where('userId', '==', userId)
      .where('status', '==', 'registered')
      .get();

    const syncResults = [];
    
    for (const regDoc of registrationsSnapshot.docs) {
      const registration = regDoc.data();
      
      try {
        // Sync each event
        const syncResult = await syncEventToGoogleCalendar({
          eventId: registration.eventId,
          action: 'create'
        }, context);
        
        syncResults.push({
          eventId: registration.eventId,
          success: true,
          googleEventId: syncResult.googleEventId
        });
      } catch (error: any) {
        syncResults.push({
          eventId: registration.eventId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = syncResults.filter(r => r.success).length;
    const failureCount = syncResults.filter(r => !r.success).length;

    return {
      success: true,
      message: `Sync completed: ${successCount} successful, ${failureCount} failed`,
      results: syncResults
    };

  } catch (error) {
    console.error('Error auto-syncing user events:', error);
    throw new functions.https.HttpsError('internal', 'Failed to sync events');
  }
});

// Disconnect Google Calendar
export const disconnectGoogleCalendar = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    // Update user document to remove Google Calendar connection
    await db.collection('users').doc(userId).update({
      'googleCalendar.connected': false,
      'googleCalendar.disconnectedAt': admin.firestore.FieldValue.serverTimestamp(),
      // Keep tokens for potential reconnection but mark as disconnected
    });

    return { success: true, message: 'Google Calendar disconnected successfully' };
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    throw new functions.https.HttpsError('internal', 'Failed to disconnect Google Calendar');
  }
});

// Scheduled function to refresh expired tokens
export const refreshGoogleCalendarTokens = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Refreshing expired Google Calendar tokens...');
    
    try {
      const now = Date.now();
      
      // Get users with Google Calendar connected and potentially expired tokens
      const usersSnapshot = await db.collection('users')
        .where('googleCalendar.connected', '==', true)
        .get();

      let refreshedCount = 0;
      let errorCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const googleCalendar = userData.googleCalendar;

        // Check if token is close to expiry (refresh 1 hour before)
        if (googleCalendar.expiryDate && googleCalendar.expiryDate < now + (60 * 60 * 1000)) {
          try {
            const oauth2Client = new google.auth.OAuth2(
              GOOGLE_CALENDAR_CONFIG.clientId,
              GOOGLE_CALENDAR_CONFIG.clientSecret,
              GOOGLE_CALENDAR_CONFIG.redirectUri
            );

            oauth2Client.setCredentials({
              refresh_token: googleCalendar.refreshToken,
            });

            const { credentials } = await oauth2Client.refreshAccessToken();

            await userDoc.ref.update({
              'googleCalendar.accessToken': credentials.access_token,
              'googleCalendar.expiryDate': credentials.expiry_date,
              'googleCalendar.refreshedAt': admin.firestore.FieldValue.serverTimestamp(),
            });

            refreshedCount++;
          } catch (error) {
            console.error(`Error refreshing token for user ${userDoc.id}:`, error);
            
            // Mark as disconnected if refresh fails
            await userDoc.ref.update({
              'googleCalendar.connected': false,
              'googleCalendar.lastError': error,
              'googleCalendar.errorAt': admin.firestore.FieldValue.serverTimestamp(),
            });
            
            errorCount++;
          }
        }
      }

      console.log(`Token refresh completed: ${refreshedCount} refreshed, ${errorCount} errors`);
      return null;
    } catch (error) {
      console.error('Error in scheduled token refresh:', error);
      throw error;
    }
  });

// Function to handle event updates and sync to Google Calendar
export const onEventUpdated = functions.firestore
  .document('events/{eventId}')
  .onUpdate(async (change, context) => {
    const eventId = context.params.eventId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Check if relevant event details changed
    const relevantFields = ['title', 'description', 'startTime', 'endTime', 'location'];
    const hasRelevantChanges = relevantFields.some(field => 
      JSON.stringify(beforeData[field]) !== JSON.stringify(afterData[field])
    );

    if (!hasRelevantChanges) {
      return null;
    }

    try {
      // Get all users who have this event synced to their Google Calendar
      const googleCalendarSync = afterData.googleCalendarSync || {};
      
      for (const userId of Object.keys(googleCalendarSync)) {
        const syncData = googleCalendarSync[userId];
        
        if (syncData.googleEventId) {
          // Update the event in each user's Google Calendar
          const userDoc = await db.collection('users').doc(userId).get();
          const userData = userDoc.data();

          if (userData?.googleCalendar?.connected && userData.googleCalendar.accessToken) {
            try {
              const calendar = getCalendarClient(
                userData.googleCalendar.accessToken,
                userData.googleCalendar.refreshToken
              );

              const calendarEvent = {
                summary: afterData.title,
                description: `${afterData.description}\n\nEvent organized through EventOS`,
                start: {
                  dateTime: afterData.startTime.toDate().toISOString(),
                  timeZone: afterData.timeZone || 'UTC',
                },
                end: {
                  dateTime: afterData.endTime.toDate().toISOString(),
                  timeZone: afterData.timeZone || 'UTC',
                },
                location: afterData.location,
              };

              await calendar.events.update({
                calendarId: 'primary',
                eventId: syncData.googleEventId,
                requestBody: calendarEvent,
              });

              // Update sync metadata
              await change.after.ref.update({
                [`googleCalendarSync.${userId}.syncedAt`]: admin.firestore.FieldValue.serverTimestamp(),
                [`googleCalendarSync.${userId}.lastAction`]: 'auto-update'
              });

              console.log(`Updated Google Calendar event for user ${userId}`);
            } catch (error) {
              console.error(`Error updating Google Calendar for user ${userId}:`, error);
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error in onEventUpdated:', error);
      return null;
    }
  });

export const googleCalendarFunctions = {
  getGoogleCalendarAuthUrl,
  handleGoogleCalendarCallback,
  syncEventToGoogleCalendar,
  autoSyncUserEvents,
  disconnectGoogleCalendar,
  refreshGoogleCalendarTokens,
  onEventUpdated
};