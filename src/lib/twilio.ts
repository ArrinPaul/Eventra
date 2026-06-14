import twilio from 'twilio';

/**
 * Lazy-initialized Twilio client.
 * Prevents crash when env vars are not set (e.g. in dev environments).
 */
let _client: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  if (!_client) {
    _client = twilio(accountSid, authToken);
  }
  return _client;
}

/**
 * Send an SMS alert to a user
 */
export async function sendSMS(to: string, message: string) {
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const client = getTwilioClient();

  if (!client || !fromNumber) {
    console.warn('Twilio credentials missing. Skipping SMS.');
    return null;
  }

  try {
    const result = await client.messages.create({
      body: `Eventra Alert: ${message}`,
      from: fromNumber,
      to
    });
    return result;
  } catch (error) {
    console.error('Twilio SMS Error:', error);
    return null;
  }
}

/**
 * Alert attendee about waitlist promotion via SMS
 */
export async function alertPromotedAttendee(phone: string, eventTitle: string) {
  return sendSMS(phone, `Good news! A spot opened up for ${eventTitle}. Your ticket is ready in the app.`);
}

/**
 * Alert attendee about event cancellation
 */
export async function alertEventCancelled(phone: string, eventTitle: string) {
  return sendSMS(phone, `Important: The event "${eventTitle}" has been cancelled. Please check your email for refund details.`);
}
