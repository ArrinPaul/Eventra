/**
 * Google Docs Creation API Route
 * Creates a Google Document for event documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

interface CreateDocumentRequest {
  connectionId: string;
  eventId: string;
  eventName: string;
  templateType?: 'agenda' | 'notes' | 'summary' | 'custom';
  customContent?: string;
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

function generateDocumentContent(eventName: string, templateType: string): object {
  const templates: Record<string, object> = {
    agenda: {
      title: `${eventName} - Agenda`,
      body: {
        content: [
          {
            paragraph: {
              elements: [{ textRun: { content: `Event Agenda: ${eventName}\n`, textStyle: { bold: true, fontSize: { magnitude: 18, unit: 'PT' } } } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '\nSchedule\n', textStyle: { bold: true, fontSize: { magnitude: 14, unit: 'PT' } } } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '• Opening remarks\n' } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '• Keynote session\n' } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '• Breakout sessions\n' } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '• Networking\n' } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '• Closing\n' } }],
            },
          },
        ],
      },
    },
    notes: {
      title: `${eventName} - Meeting Notes`,
      body: {
        content: [
          {
            paragraph: {
              elements: [{ textRun: { content: `Meeting Notes: ${eventName}\n`, textStyle: { bold: true, fontSize: { magnitude: 18, unit: 'PT' } } } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: `\nDate: ${new Date().toLocaleDateString()}\n` } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '\nAttendees\n', textStyle: { bold: true } } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '• \n' } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '\nDiscussion Points\n', textStyle: { bold: true } } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '1. \n' } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '\nAction Items\n', textStyle: { bold: true } } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '☐ \n' } }],
            },
          },
        ],
      },
    },
    summary: {
      title: `${eventName} - Event Summary`,
      body: {
        content: [
          {
            paragraph: {
              elements: [{ textRun: { content: `Event Summary: ${eventName}\n`, textStyle: { bold: true, fontSize: { magnitude: 18, unit: 'PT' } } } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '\nOverview\n', textStyle: { bold: true, fontSize: { magnitude: 14, unit: 'PT' } } } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: 'Add event overview here...\n' } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '\nKey Highlights\n', textStyle: { bold: true, fontSize: { magnitude: 14, unit: 'PT' } } } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '• \n' } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '\nStatistics\n', textStyle: { bold: true, fontSize: { magnitude: 14, unit: 'PT' } } } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '• Total Attendees: \n' } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: '• Sessions: \n' } }],
            },
          },
        ],
      },
    },
    custom: {
      title: `${eventName} - Document`,
      body: {
        content: [
          {
            paragraph: {
              elements: [{ textRun: { content: `${eventName}\n`, textStyle: { bold: true, fontSize: { magnitude: 18, unit: 'PT' } } } }],
            },
          },
          {
            paragraph: {
              elements: [{ textRun: { content: `\nCreated: ${new Date().toLocaleDateString()}\n` } }],
            },
          },
        ],
      },
    },
  };

  return templates[templateType] || templates.custom;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateDocumentRequest = await request.json();
    const { connectionId, eventId, eventName, templateType = 'custom' } = body;

    if (!connectionId || !eventId || !eventName) {
      return NextResponse.json(
        { error: 'connectionId, eventId, and eventName are required' },
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

    // Create the Google Doc
    const template = generateDocumentContent(eventName, templateType);
    
    const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: (template as { title: string }).title,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('Failed to create Google Doc:', error);
      return NextResponse.json(
        { error: 'Failed to create Google Document' },
        { status: 500 }
      );
    }

    const doc = await createResponse.json();

    // Store document reference in Firestore
    await adminDb.collection('event_documents').add({
      eventId,
      documentId: doc.documentId,
      documentUrl: `https://docs.google.com/document/d/${doc.documentId}/edit`,
      title: (template as { title: string }).title,
      type: 'google-doc',
      templateType,
      connectionId,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      documentId: doc.documentId,
      documentUrl: `https://docs.google.com/document/d/${doc.documentId}/edit`,
      title: (template as { title: string }).title,
    });
  } catch (error) {
    console.error('Error creating Google Document:', error);
    return NextResponse.json(
      { error: 'Failed to create Google Document' },
      { status: 500 }
    );
  }
}
