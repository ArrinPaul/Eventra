'use server';

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

const db = admin.firestore();

// Google Workspace integration configuration
const config = functions.config();
const GOOGLE_WORKSPACE_CONFIG = {
  clientId: config.google?.workspace?.client_id || process.env.GOOGLE_WORKSPACE_CLIENT_ID,
  clientSecret: config.google?.workspace?.client_secret || process.env.GOOGLE_WORKSPACE_CLIENT_SECRET,
  redirectUri: config.google?.workspace?.redirect_uri || process.env.GOOGLE_WORKSPACE_REDIRECT_URI,
};

interface DocumentTemplate {
  title: string;
  content: string;
  eventId?: string;
  templateType: 'event_planning' | 'agenda' | 'notes' | 'feedback' | 'custom';
}

interface SpreadsheetTemplate {
  title: string;
  sheets: Array<{
    title: string;
    headers: string[];
    data?: any[][];
  }>;
  eventId?: string;
  templateType: 'registrations' | 'analytics' | 'feedback' | 'planning' | 'custom';
}

// Initialize Google API clients
function getGoogleClients(accessToken: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_WORKSPACE_CONFIG.clientId,
    GOOGLE_WORKSPACE_CONFIG.clientSecret,
    GOOGLE_WORKSPACE_CONFIG.redirectUri
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const docs = google.docs({ version: 'v1', auth: oauth2Client });
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const picker = google.picker({ version: 'v1', auth: oauth2Client });

  return { docs, sheets, drive, picker, oauth2Client };
}

// Get Google Workspace authorization URL
export const getGoogleWorkspaceAuthUrl = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_WORKSPACE_CONFIG.clientId,
      GOOGLE_WORKSPACE_CONFIG.clientSecret,
      GOOGLE_WORKSPACE_CONFIG.redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: context.auth.uid,
    });

    return { authUrl: url };
  } catch (error) {
    console.error('Error generating Google Workspace auth URL:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate auth URL');
  }
});

// Handle Google Workspace OAuth callback
export const handleGoogleWorkspaceCallback = functions.https.onCall(async (data: any, context: any) => {
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
      GOOGLE_WORKSPACE_CONFIG.clientId,
      GOOGLE_WORKSPACE_CONFIG.clientSecret,
      GOOGLE_WORKSPACE_CONFIG.redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    await db.collection('users').doc(context.auth.uid).update({
      googleWorkspace: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        connected: true,
        connectedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
    });

    return { success: true, message: 'Google Workspace connected successfully' };
  } catch (error) {
    console.error('Error handling Google Workspace callback:', error);
    throw new functions.https.HttpsError('internal', 'Failed to connect Google Workspace');
  }
});

// Create Google Doc for event planning
export const createEventDocument = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { eventId, template } = data;
  const userId = context.auth.uid;

  if (!eventId || !template) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID and template are required');
  }

  try {
    // Get user's Google Workspace credentials
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.googleWorkspace?.connected || !userData.googleWorkspace.accessToken) {
      throw new functions.https.HttpsError('failed-precondition', 'Google Workspace not connected');
    }

    // Get event data
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();
    const { docs, drive } = getGoogleClients(
      userData.googleWorkspace.accessToken,
      userData.googleWorkspace.refreshToken
    );

    // Create document based on template
    const documentTitle = `${eventData?.title || 'Event'} - ${template.templateType === 'event_planning' ? 'Planning Document' : 
      template.templateType === 'agenda' ? 'Agenda' : 
      template.templateType === 'notes' ? 'Meeting Notes' : 
      template.templateType === 'feedback' ? 'Feedback Collection' : 'Document'}`;

    // Create the document
    const docResponse = await docs.documents.create({
      requestBody: {
        title: documentTitle,
      },
    });

    const documentId = docResponse.data.documentId;

    // Add content to the document
    if (template.content || eventData) {
      const content = generateDocumentContent(template, eventData);
      
      await docs.documents.batchUpdate({
        documentId: documentId!,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content,
              },
            },
          ],
        },
      });
    }

    // Set document permissions for collaboration
    await drive.permissions.create({
      fileId: documentId!,
      requestBody: {
        role: 'writer',
        type: 'anyone',
      },
    });

    // Store document reference in Firestore
    await db.collection('eventDocuments').add({
      eventId,
      documentId,
      documentTitle,
      templateType: template.templateType,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
      collaborators: [userId],
    });

    // Update event with document reference
    await db.collection('events').doc(eventId).update({
      [`documents.${template.templateType}`]: documentId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      documentId,
      documentUrl: `https://docs.google.com/document/d/${documentId}/edit`,
      message: 'Document created successfully'
    };

  } catch (error: any) {
    console.error('Error creating event document:', error);
    throw new functions.https.HttpsError('internal', `Failed to create document: ${error.message}`);
  }
});

// Create Google Sheet for event analytics/registrations
export const createEventSpreadsheet = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { eventId, template } = data;
  const userId = context.auth.uid;

  if (!eventId || !template) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID and template are required');
  }

  try {
    // Get user's Google Workspace credentials
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.googleWorkspace?.connected || !userData.googleWorkspace.accessToken) {
      throw new functions.https.HttpsError('failed-precondition', 'Google Workspace not connected');
    }

    // Get event data
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();
    const { sheets, drive } = getGoogleClients(
      userData.googleWorkspace.accessToken,
      userData.googleWorkspace.refreshToken
    );

    // Create spreadsheet based on template
    const spreadsheetTitle = `${eventData?.title || 'Event'} - ${template.templateType === 'registrations' ? 'Registrations' : 
      template.templateType === 'analytics' ? 'Analytics' : 
      template.templateType === 'feedback' ? 'Feedback' : 
      template.templateType === 'planning' ? 'Planning' : 'Data'}`;

    // Create the spreadsheet
    const spreadsheetResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: spreadsheetTitle,
        },
        sheets: template.sheets.map((sheet: any) => ({
          properties: {
            title: sheet.title,
          },
        })),
      },
    });

    const spreadsheetId = spreadsheetResponse.data.spreadsheetId;

    // Add headers and initial data to sheets
    for (let i = 0; i < template.sheets.length; i++) {
      const sheet = template.sheets[i];
      const sheetName = sheet.title;
      
      // Add headers
      if (sheet.headers && sheet.headers.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId!,
          range: `${sheetName}!A1:${String.fromCharCode(65 + sheet.headers.length - 1)}1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [sheet.headers],
          },
        });
      }

      // Add initial data if provided
      if (sheet.data && sheet.data.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId!,
          range: `${sheetName}!A2:${String.fromCharCode(65 + sheet.headers.length - 1)}${sheet.data.length + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: sheet.data,
          },
        });
      }
    }

    // Set spreadsheet permissions for collaboration
    await drive.permissions.create({
      fileId: spreadsheetId!,
      requestBody: {
        role: 'writer',
        type: 'anyone',
      },
    });

    // Store spreadsheet reference in Firestore
    await db.collection('eventSpreadsheets').add({
      eventId,
      spreadsheetId,
      spreadsheetTitle,
      templateType: template.templateType,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
      autoSync: template.templateType === 'registrations' || template.templateType === 'analytics',
    });

    // Update event with spreadsheet reference
    await db.collection('events').doc(eventId).update({
      [`spreadsheets.${template.templateType}`]: spreadsheetId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      message: 'Spreadsheet created successfully'
    };

  } catch (error: any) {
    console.error('Error creating event spreadsheet:', error);
    throw new functions.https.HttpsError('internal', `Failed to create spreadsheet: ${error.message}`);
  }
});

// Sync registration data to Google Sheets
export const syncRegistrationsToSheet = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { eventId } = data;
  const userId = context.auth.uid;

  try {
    // Get user's Google Workspace credentials
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.googleWorkspace?.connected) {
      throw new functions.https.HttpsError('failed-precondition', 'Google Workspace not connected');
    }

    // Get event spreadsheet
    const spreadsheetsQuery = await db.collection('eventSpreadsheets')
      .where('eventId', '==', eventId)
      .where('templateType', '==', 'registrations')
      .limit(1)
      .get();

    if (spreadsheetsQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'Registration spreadsheet not found');
    }

    const spreadsheetDoc = spreadsheetsQuery.docs[0];
    const spreadsheetData = spreadsheetDoc.data();
    const spreadsheetId = spreadsheetData.spreadsheetId;

    // Get registrations for this event
    const registrationsQuery = await db.collection('registrations')
      .where('eventId', '==', eventId)
      .get();

    const registrations = registrationsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Prepare data for Google Sheets
    const sheetData = registrations.map(reg => [
      reg.id,
      reg.userName || 'N/A',
      reg.userEmail || 'N/A',
      reg.userRole || 'N/A',
      reg.registeredAt?.toDate?.()?.toISOString() || 'N/A',
      reg.status || 'registered',
      reg.checkedIn ? 'Yes' : 'No',
      reg.ticketType || 'Free',
    ]);

    const { sheets } = getGoogleClients(
      userData.googleWorkspace.accessToken,
      userData.googleWorkspace.refreshToken
    );

    // Clear existing data and add new data
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Registrations!A2:H',
    });

    if (sheetData.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Registrations!A2:H${sheetData.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: sheetData,
        },
      });
    }

    // Update sync timestamp
    await spreadsheetDoc.ref.update({
      lastSynced: admin.firestore.FieldValue.serverTimestamp(),
      syncCount: (spreadsheetData.syncCount || 0) + 1,
    });

    return {
      success: true,
      syncedRecords: sheetData.length,
      message: 'Registrations synced to spreadsheet successfully'
    };

  } catch (error: any) {
    console.error('Error syncing registrations to sheet:', error);
    throw new functions.https.HttpsError('internal', `Failed to sync data: ${error.message}`);
  }
});

// Auto-sync registrations when new registration is created
export const onRegistrationCreated = functions.firestore
  .document('registrations/{registrationId}')
  .onCreate(async (snap, context) => {
    const registration = snap.data();
    const eventId = registration.eventId;

    try {
      // Get event spreadsheet with auto-sync enabled
      const spreadsheetsQuery = await db.collection('eventSpreadsheets')
        .where('eventId', '==', eventId)
        .where('templateType', '==', 'registrations')
        .where('autoSync', '==', true)
        .limit(1)
        .get();

      if (spreadsheetsQuery.empty) {
        return null;
      }

      const spreadsheetDoc = spreadsheetsQuery.docs[0];
      const spreadsheetData = spreadsheetDoc.data();

      // Get the event organizer's Google Workspace credentials
      const eventDoc = await db.collection('events').doc(eventId).get();
      const eventDataObj = eventDoc.data();
      
      if (!eventDataObj?.organizerId) {
        return null;
      }

      const organizerDoc = await db.collection('users').doc(eventDataObj.organizerId).get();
      const organizerData = organizerDoc.data();

      if (!organizerData?.googleWorkspace?.connected) {
        return null;
      }

      // Add registration to spreadsheet
      const { sheets } = getGoogleClients(
        organizerData.googleWorkspace.accessToken,
        organizerData.googleWorkspace.refreshToken
      );

      const registrationRow = [
        snap.id,
        registration.userName || 'N/A',
        registration.userEmail || 'N/A',
        registration.userRole || 'N/A',
        registration.registeredAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        registration.status || 'registered',
        registration.checkedIn ? 'Yes' : 'No',
        registration.ticketType || 'Free',
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetData.spreadsheetId,
        range: 'Registrations!A:H',
        valueInputOption: 'RAW',
        requestBody: {
          values: [registrationRow],
        },
      });

      console.log(`Auto-synced registration ${snap.id} to spreadsheet ${spreadsheetData.spreadsheetId}`);

    } catch (error) {
      console.error('Error auto-syncing registration:', error);
    }

    return null;
  });

// Helper function to generate document content
function generateDocumentContent(template: DocumentTemplate, eventData: any): string {
  const eventTitle = eventData?.title || 'Event';
  const eventDate = eventData?.startTime?.toDate?.()?.toLocaleDateString() || 'TBD';
  const eventLocation = eventData?.location || 'TBD';

  switch (template.templateType) {
    case 'event_planning':
      return `# ${eventTitle} - Planning Document

## Event Overview
- **Event Name:** ${eventTitle}
- **Date:** ${eventDate}
- **Location:** ${eventLocation}
- **Description:** ${eventData?.description || 'Event description'}

## Planning Checklist
- [ ] Venue booking confirmed
- [ ] Speakers/presenters confirmed
- [ ] Catering arranged
- [ ] Marketing materials prepared
- [ ] Registration system set up
- [ ] Technical equipment confirmed
- [ ] Staff assignments made
- [ ] Emergency procedures reviewed

## Timeline
### 4 weeks before
- [ ] Finalize venue and catering
- [ ] Confirm speakers
- [ ] Launch marketing campaign

### 2 weeks before  
- [ ] Final headcount
- [ ] Prepare materials
- [ ] Brief staff

### 1 week before
- [ ] Final confirmations
- [ ] Set up logistics
- [ ] Test technology

### Day of event
- [ ] Arrive early for setup
- [ ] Welcome attendees
- [ ] Monitor event flow
- [ ] Collect feedback

## Notes
Add your planning notes here...

## Action Items
| Task | Assignee | Due Date | Status |
|------|----------|----------|---------|
|      |          |          |         |
`;

    case 'agenda':
      return `# ${eventTitle} - Event Agenda

**Date:** ${eventDate}
**Location:** ${eventLocation}

## Schedule

### Morning Session
- **9:00 AM - 9:30 AM:** Registration & Welcome
- **9:30 AM - 10:30 AM:** Opening Keynote
- **10:30 AM - 10:45 AM:** Break
- **10:45 AM - 12:00 PM:** Workshop Session 1

### Afternoon Session
- **12:00 PM - 1:00 PM:** Lunch Break
- **1:00 PM - 2:30 PM:** Panel Discussion
- **2:30 PM - 2:45 PM:** Break
- **2:45 PM - 4:00 PM:** Workshop Session 2
- **4:00 PM - 4:30 PM:** Closing Remarks

## Session Details
[Add detailed descriptions of each session]

## Speakers
[Add speaker bios and contact information]

## Logistics
- **Parking:** [Parking information]
- **WiFi:** [Network details]
- **Emergency:** [Emergency contacts]
`;

    case 'notes':
      return `# ${eventTitle} - Meeting Notes

**Date:** ${eventDate}
**Attendees:** [List attendees]

## Meeting Objectives
- [Objective 1]
- [Objective 2]

## Discussion Points
### Topic 1
- Key points discussed
- Decisions made
- Action items

### Topic 2
- Key points discussed
- Decisions made
- Action items

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|---------|
|        |       |          |         |

## Next Steps
[Outline next steps and follow-up actions]

## Additional Notes
[Any additional notes or comments]
`;

    case 'feedback':
      return `# ${eventTitle} - Feedback Collection

**Event Date:** ${eventDate}

## Post-Event Survey Results
[Compile survey results here]

## Attendee Feedback
### What went well?
- [Positive feedback point 1]
- [Positive feedback point 2]

### Areas for improvement?
- [Improvement suggestion 1]  
- [Improvement suggestion 2]

### Overall satisfaction rating
- Average rating: [X/5]
- Response rate: [X%]

## Speaker Feedback
### Speaker 1: [Name]
- Session rating: [X/5]
- Comments: [Feedback]

### Speaker 2: [Name]
- Session rating: [X/5]  
- Comments: [Feedback]

## Lessons Learned
- [Key learning 1]
- [Key learning 2]

## Recommendations for Future Events
- [Recommendation 1]
- [Recommendation 2]

## Follow-up Actions
- [ ] Share thank you message with attendees
- [ ] Send certificates/resources to participants
- [ ] Archive event materials
- [ ] Update processes based on feedback
`;

    default:
      return `# ${eventTitle}

${template.content || 'Document content goes here...'}

---
*Created on: ${new Date().toLocaleDateString()}*
`;
  }
}

// Get Drive Picker token for frontend
export const getDrivePickerToken = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.googleWorkspace?.connected || !userData.googleWorkspace.accessToken) {
      throw new functions.https.HttpsError('failed-precondition', 'Google Workspace not connected');
    }

    return {
      accessToken: userData.googleWorkspace.accessToken,
      expiryDate: userData.googleWorkspace.expiryDate
    };
  } catch (error) {
    console.error('Error getting Drive Picker token:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get Drive Picker token');
  }
});

// Enhanced file management with metadata
export const manageWorkspaceFile = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { action, fileData } = data;
  const userId = context.auth.uid;

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.googleWorkspace?.connected) {
      throw new functions.https.HttpsError('failed-precondition', 'Google Workspace not connected');
    }

    const { drive } = getGoogleClients(
      userData.googleWorkspace.accessToken,
      userData.googleWorkspace.refreshToken
    );

    switch (action) {
      case 'share':
        await drive.permissions.create({
          fileId: fileData.fileId,
          requestBody: {
            role: fileData.role || 'reader',
            type: 'user',
            emailAddress: fileData.email,
          },
        });

        // Store sharing info in Firestore
        await db.collection('integrations').doc(userId).collection('files').doc(fileData.fileId).update({
          sharedWith: admin.firestore.FieldValue.arrayUnion({
            email: fileData.email,
            role: fileData.role || 'reader',
            sharedAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        });

        return { success: true, message: 'File shared successfully' };

      case 'updateMetadata':
        await db.collection('integrations').doc(userId).collection('files').doc(fileData.fileId).set({
          ...fileData,
          lastModified: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        return { success: true, message: 'Metadata updated successfully' };

      case 'exportPdf':
        const pdfResponse = await drive.files.export({
          fileId: fileData.fileId,
          mimeType: 'application/pdf',
        });

        // Store PDF in Firebase Storage
        const bucket = admin.storage().bucket();
        const fileName = `exports/${userId}/${fileData.fileId}_${Date.now()}.pdf`;
        const file = bucket.file(fileName);

        await file.save(pdfResponse.data as any, {
          metadata: {
            contentType: 'application/pdf',
          },
        });

        const downloadURL = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        });

        return { success: true, downloadURL: downloadURL[0] };

      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
    }
  } catch (error: any) {
    console.error('Error managing workspace file:', error);
    throw new functions.https.HttpsError('internal', `Failed to ${action} file: ${error.message}`);
  }
});

// Real-time collaboration features
export const enableRealtimeCollaboration = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { fileId, fileType } = data;
  const userId = context.auth.uid;

  try {
    // Create collaboration session
    const sessionRef = db.collection('collaborationSessions').doc();
    await sessionRef.set({
      fileId,
      fileType,
      owner: userId,
      participants: [userId],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { 
      success: true, 
      sessionId: sessionRef.id,
      message: 'Real-time collaboration enabled' 
    };
  } catch (error) {
    console.error('Error enabling collaboration:', error);
    throw new functions.https.HttpsError('internal', 'Failed to enable collaboration');
  }
});

// Sync document changes
export const syncDocumentChanges = functions.firestore
  .document('collaborationSessions/{sessionId}/changes/{changeId}')
  .onCreate(async (snap, context) => {
    const change = snap.data();
    const sessionId = context.params.sessionId;

    try {
      // Get session info
      const sessionDoc = await db.collection('collaborationSessions').doc(sessionId).get();
      const sessionData = sessionDoc.data();

      if (!sessionData?.isActive) return;

      // Notify all participants except the author
      const notifications = sessionData.participants
        .filter((participantId: string) => participantId !== change.userId)
        .map((participantId: string) => 
          db.collection('notifications').add({
            userId: participantId,
            type: 'document_change',
            title: 'Document Updated',
            message: `${change.userName || 'Someone'} made changes to the document`,
            data: {
              sessionId,
              fileId: sessionData.fileId,
              changeType: change.type,
            },
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        );

      await Promise.all(notifications);

      // Update session activity
      await db.collection('collaborationSessions').doc(sessionId).update({
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      });

    } catch (error) {
      console.error('Error syncing document changes:', error);
    }
  });

// Disconnect Google Workspace
export const disconnectGoogleWorkspace = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    await db.collection('users').doc(userId).update({
      'googleWorkspace.connected': false,
      'googleWorkspace.disconnectedAt': admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Google Workspace disconnected successfully' };
  } catch (error) {
    console.error('Error disconnecting Google Workspace:', error);
    throw new functions.https.HttpsError('internal', 'Failed to disconnect Google Workspace');
  }
});

export const googleWorkspaceFunctions = {
  getGoogleWorkspaceAuthUrl,
  handleGoogleWorkspaceCallback,
  createEventDocument,
  createEventSpreadsheet,
  syncRegistrationsToSheet,
  disconnectGoogleWorkspace,
  onRegistrationCreated
};