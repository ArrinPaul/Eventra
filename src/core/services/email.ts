import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  if (!resend) {
    console.warn('Resend API key is missing. Email dispatch skipped.');
    return { error: 'Email service not configured', success: false };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Eventra <notifications@eventra.com>',
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Resend error:', error);
      return { error, success: false };
    }

    return { data, success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { error: 'Internal Server Error', success: false };
  }
}

export function constructConfirmationEmail(userName: string, eventTitle: string, ticketNumber: string) {
  return {
    subject: `Registration Confirmed: ${eventTitle}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #06b6d4; text-align: center;">Registration Confirmed!</h1>
        <p>Hello ${userName || 'Attendee'},</p>
        <p>Your registration for <strong>${eventTitle}</strong> has been successfully confirmed.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #06b6d4;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Ticket Number</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #0f172a; letter-spacing: 2px;">${ticketNumber}</p>
        </div>
        <p>You can view and download your QR code ticket in the Eventra app under "My Tickets".</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://eventra.com'}/tickets" style="background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View My Tickets</a>
        </div>
        <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">The Eventra Team</p>
      </div>
    `,
  };
}

export function constructCertificateEmail(userName: string, eventTitle: string) {
  return {
    subject: `Congratulations! Your certificate for ${eventTitle} is ready`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #06b6d4; text-align: center;">Certificate Ready!</h1>
        <p>Hello ${userName || 'Attendee'},</p>
        <p>Congratulations on completing <strong>${eventTitle}</strong>! Your official certificate of participation is now available for download.</p>
        <p>You can access it from your profile under the "Certificates" tab.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://eventra.com'}/profile" style="background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Download Certificate</a>
        </div>
        <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">Well done from the Eventra Team!</p>
      </div>
    `,
  };
}
