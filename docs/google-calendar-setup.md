# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for the CIS-SAP Event Management Platform.

## Prerequisites

1. Google Cloud Platform (GCP) account
2. Firebase project with Functions enabled
3. Node.js and Firebase CLI installed

## Step 1: Create Google Calendar API Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Set Application type to "Web application"
   - Add authorized redirect URIs:
     - For production: `https://your-domain.com/api/auth/google-calendar/callback`
     - For development: `http://localhost:3000/api/auth/google-calendar/callback`
   - Save and note down the Client ID and Client Secret

## Step 2: Configure Firebase Functions

Set the Google Calendar configuration in Firebase Functions:

```bash
# Set Google Calendar credentials
firebase functions:config:set google.calendar.client_id="your-google-client-id"
firebase functions:config:set google.calendar.client_secret="your-google-client-secret"
firebase functions:config:set google.calendar.redirect_uri="https://your-domain.com/api/auth/google-calendar/callback"

# Deploy the configuration
firebase deploy --only functions
```

## Step 3: Update Firestore Security Rules

Add these rules to your `firestore.rules` to support Google Calendar sync:

```javascript
// Add to user document rules
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  
  // Allow reading/writing Google Calendar sync data
  allow update: if request.auth != null && 
                request.auth.uid == userId && 
                request.writeFields.hasOnly(['googleCalendar']);
}

// Add to events collection rules
match /events/{eventId} {
  // Allow updating Google Calendar sync data for registered users
  allow update: if request.auth != null && 
                isRegisteredForEvent(eventId, request.auth.uid) &&
                request.writeFields.hasOnly(['googleCalendarSync']);
}
```

## Step 4: Install Dependencies

The required dependencies should already be installed, but if you need to install them manually:

```bash
cd functions
npm install googleapis@^132.0.0
```

## Step 5: Environment Variables (Development)

For local development, create a `.env.local` file in the root directory:

```env
GOOGLE_CALENDAR_CLIENT_ID=your-google-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/auth/google-calendar/callback
```

## Step 6: Deploy and Test

1. Deploy the Firebase Functions:
```bash
firebase deploy --only functions
```

2. Test the integration:
   - Navigate to `/app/calendar` in your application
   - Click "Connect Google Calendar"
   - Complete the OAuth flow
   - Test syncing events

## Features

### Automatic Event Sync
- Events are automatically synced when users register
- Updates to events are propagated to Google Calendar
- Event cancellations remove events from Google Calendar

### Configurable Reminders
- Email reminders (24 hours before)
- Popup reminders (1 hour and 15 minutes before)
- Customizable reminder preferences

### Bulk Operations
- Sync all registered events at once
- Auto-refresh expired OAuth tokens
- Bulk disconnect/reconnect functionality

## Troubleshooting

### Common Issues

1. **"OAuth callback error"**
   - Check that redirect URIs match in Google Cloud Console
   - Verify Firebase Functions configuration
   - Check browser console for detailed errors

2. **"Token expired" errors**
   - The system automatically refreshes tokens daily
   - Users can reconnect if needed
   - Check Firebase Functions logs for refresh errors

3. **"Calendar not found" errors**
   - Ensure users have granted calendar permissions
   - Check Google Calendar API quotas
   - Verify OAuth scopes include calendar access

### Debug Commands

Check Firebase Functions configuration:
```bash
firebase functions:config:get
```

View Functions logs:
```bash
firebase functions:log --only googleCalendarFunctions
```

Test locally with emulator:
```bash
firebase emulators:start --only functions
```

## Security Considerations

1. **Token Storage**: OAuth tokens are stored securely in Firestore with user-specific access controls
2. **Scopes**: Only necessary calendar scopes are requested (read/write calendar events)
3. **Auto-refresh**: Tokens are automatically refreshed to maintain security
4. **Cleanup**: Disconnection properly removes stored tokens

## API Endpoints

The integration provides these Firebase Functions:

- `getGoogleCalendarAuthUrl` - Get OAuth authorization URL
- `handleGoogleCalendarCallback` - Handle OAuth callback
- `syncEventToGoogleCalendar` - Sync individual events
- `autoSyncUserEvents` - Bulk sync user's events
- `disconnectGoogleCalendar` - Disconnect and cleanup
- `refreshGoogleCalendarTokens` - Scheduled token refresh
- `onEventUpdated` - Auto-sync on event changes

## Next Steps

After setup, users can:
1. Connect their Google Calendar accounts
2. Automatically sync registered events
3. Receive calendar reminders
4. Update events synchronously across platforms
5. Manage sync preferences and settings