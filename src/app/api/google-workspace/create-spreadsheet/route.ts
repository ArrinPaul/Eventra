/**
 * Google Sheets Creation API Route
 * Creates a Google Spreadsheet for event data management
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

interface CreateSpreadsheetRequest {
  connectionId: string;
  eventId: string;
  eventName: string;
  templateType?: 'registrations' | 'budget' | 'schedule' | 'feedback' | 'custom';
  initialData?: Record<string, unknown>[];
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

function generateSpreadsheetTemplate(eventName: string, templateType: string): object {
  const templates: Record<string, object> = {
    registrations: {
      properties: {
        title: `${eventName} - Registrations`,
      },
      sheets: [
        {
          properties: {
            title: 'Registrations',
            gridProperties: { frozenRowCount: 1 },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Registration ID' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Name' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Email' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Ticket Type' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Registration Date' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Check-in Status' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Payment Status' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                  ],
                },
              ],
            },
          ],
        },
        {
          properties: {
            title: 'Summary',
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                { values: [{ userEnteredValue: { stringValue: 'Total Registrations' } }, { userEnteredValue: { formulaValue: '=COUNTA(Registrations!A:A)-1' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Checked In' } }, { userEnteredValue: { formulaValue: '=COUNTIF(Registrations!F:F,"Checked In")' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Pending' } }, { userEnteredValue: { formulaValue: '=COUNTIF(Registrations!F:F,"Pending")' } }] },
              ],
            },
          ],
        },
      ],
    },
    budget: {
      properties: {
        title: `${eventName} - Budget`,
      },
      sheets: [
        {
          properties: {
            title: 'Budget Overview',
            gridProperties: { frozenRowCount: 1 },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Category' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Description' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Budgeted' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Actual' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Variance' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                  ],
                },
                { values: [{ userEnteredValue: { stringValue: 'Venue' } }, { userEnteredValue: { stringValue: '' } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { formulaValue: '=C2-D2' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Catering' } }, { userEnteredValue: { stringValue: '' } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { formulaValue: '=C3-D3' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Marketing' } }, { userEnteredValue: { stringValue: '' } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { formulaValue: '=C4-D4' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Equipment' } }, { userEnteredValue: { stringValue: '' } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { formulaValue: '=C5-D5' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Staff' } }, { userEnteredValue: { stringValue: '' } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { formulaValue: '=C6-D6' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Miscellaneous' } }, { userEnteredValue: { stringValue: '' } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { formulaValue: '=C7-D7' } }] },
                { values: [{ userEnteredValue: { stringValue: 'TOTAL' }, userEnteredFormat: { textFormat: { bold: true } } }, { userEnteredValue: { stringValue: '' } }, { userEnteredValue: { formulaValue: '=SUM(C2:C7)' }, userEnteredFormat: { textFormat: { bold: true } } }, { userEnteredValue: { formulaValue: '=SUM(D2:D7)' }, userEnteredFormat: { textFormat: { bold: true } } }, { userEnteredValue: { formulaValue: '=C8-D8' }, userEnteredFormat: { textFormat: { bold: true } } }] },
              ],
            },
          ],
        },
        {
          properties: {
            title: 'Revenue',
            gridProperties: { frozenRowCount: 1 },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Source' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Expected' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Actual' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                  ],
                },
                { values: [{ userEnteredValue: { stringValue: 'Ticket Sales' } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { numberValue: 0 } }] },
                { values: [{ userEnteredValue: { stringValue: 'Sponsorships' } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { numberValue: 0 } }] },
                { values: [{ userEnteredValue: { stringValue: 'Merchandise' } }, { userEnteredValue: { numberValue: 0 } }, { userEnteredValue: { numberValue: 0 } }] },
                { values: [{ userEnteredValue: { stringValue: 'TOTAL' }, userEnteredFormat: { textFormat: { bold: true } } }, { userEnteredValue: { formulaValue: '=SUM(B2:B4)' }, userEnteredFormat: { textFormat: { bold: true } } }, { userEnteredValue: { formulaValue: '=SUM(C2:C4)' }, userEnteredFormat: { textFormat: { bold: true } } }] },
              ],
            },
          ],
        },
      ],
    },
    schedule: {
      properties: {
        title: `${eventName} - Schedule`,
      },
      sheets: [
        {
          properties: {
            title: 'Schedule',
            gridProperties: { frozenRowCount: 1 },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Time' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Session' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Speaker' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Room/Track' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Duration (min)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Notes' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                  ],
                },
                { values: [{ userEnteredValue: { stringValue: '09:00' } }, { userEnteredValue: { stringValue: 'Registration & Welcome' } }, { userEnteredValue: { stringValue: '' } }, { userEnteredValue: { stringValue: 'Main Hall' } }, { userEnteredValue: { numberValue: 30 } }, { userEnteredValue: { stringValue: '' } }] },
                { values: [{ userEnteredValue: { stringValue: '09:30' } }, { userEnteredValue: { stringValue: 'Opening Keynote' } }, { userEnteredValue: { stringValue: 'TBD' } }, { userEnteredValue: { stringValue: 'Main Stage' } }, { userEnteredValue: { numberValue: 60 } }, { userEnteredValue: { stringValue: '' } }] },
              ],
            },
          ],
        },
      ],
    },
    feedback: {
      properties: {
        title: `${eventName} - Feedback`,
      },
      sheets: [
        {
          properties: {
            title: 'Responses',
            gridProperties: { frozenRowCount: 1 },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Timestamp' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Attendee' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Overall Rating' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Venue Rating' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Content Rating' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Would Recommend' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                    { userEnteredValue: { stringValue: 'Comments' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                  ],
                },
              ],
            },
          ],
        },
        {
          properties: {
            title: 'Summary',
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                { values: [{ userEnteredValue: { stringValue: 'Total Responses' } }, { userEnteredValue: { formulaValue: '=COUNTA(Responses!A:A)-1' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Average Overall Rating' } }, { userEnteredValue: { formulaValue: '=AVERAGE(Responses!C2:C)' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Average Venue Rating' } }, { userEnteredValue: { formulaValue: '=AVERAGE(Responses!D2:D)' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Average Content Rating' } }, { userEnteredValue: { formulaValue: '=AVERAGE(Responses!E2:E)' } }] },
                { values: [{ userEnteredValue: { stringValue: 'Would Recommend %' } }, { userEnteredValue: { formulaValue: '=COUNTIF(Responses!F2:F,"Yes")/COUNTA(Responses!F2:F)*100' } }] },
              ],
            },
          ],
        },
      ],
    },
    custom: {
      properties: {
        title: `${eventName} - Data`,
      },
      sheets: [
        {
          properties: {
            title: 'Sheet1',
          },
        },
      ],
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

    const body: CreateSpreadsheetRequest = await request.json();
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

    // Create the Google Spreadsheet
    const template = generateSpreadsheetTemplate(eventName, templateType);
    
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('Failed to create Google Spreadsheet:', error);
      return NextResponse.json(
        { error: 'Failed to create Google Spreadsheet' },
        { status: 500 }
      );
    }

    const spreadsheet = await createResponse.json();

    // Store spreadsheet reference in Firestore
    await adminDb.collection('event_documents').add({
      eventId,
      spreadsheetId: spreadsheet.spreadsheetId,
      spreadsheetUrl: spreadsheet.spreadsheetUrl,
      title: (template as { properties: { title: string } }).properties.title,
      type: 'google-sheet',
      templateType,
      connectionId,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      spreadsheetId: spreadsheet.spreadsheetId,
      spreadsheetUrl: spreadsheet.spreadsheetUrl,
      title: (template as { properties: { title: string } }).properties.title,
    });
  } catch (error) {
    console.error('Error creating Google Spreadsheet:', error);
    return NextResponse.json(
      { error: 'Failed to create Google Spreadsheet' },
      { status: 500 }
    );
  }
}
