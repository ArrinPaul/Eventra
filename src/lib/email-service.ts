/**
 * Email Service for EventOS
 * Handles sending emails for various events (registration, reminders, certificates, etc.)
 */

import { EventTicket, Event } from '@/types';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Email Templates
const templates = {
  registrationConfirmation: (ticket: EventTicket, event: Event) => ({
    subject: `Registration Confirmed: ${event.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B35 0%, #A855F7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .ticket-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .ticket-number { font-size: 24px; font-weight: bold; color: #FF6B35; font-family: monospace; }
          .button { display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .label { font-weight: 600; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 Registration Confirmed!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">You're all set for ${event.title}</p>
          </div>
          <div class="content">
            <h2>Hi ${ticket.attendeeName}! 👋</h2>
            <p>Great news! Your registration for <strong>${event.title}</strong> has been confirmed.</p>
            
            <div class="ticket-info">
              <div class="detail-row">
                <span class="label">Ticket Number:</span>
                <span class="ticket-number">${ticket.ticketNumber}</span>
              </div>
              <div class="detail-row">
                <span class="label">Event:</span>
                <span>${event.title}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span>${new Date(ticket.event?.date || event.startDate || new Date()).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span>${new Date(ticket.event?.date || event.startDate || new Date()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              </div>
              <div class="detail-row">
                <span class="label">Location:</span>
                <span>${ticket.event?.location || 'TBD'}</span>
              </div>
              ${ticket.price && ticket.price > 0 ? `
              <div class="detail-row">
                <span class="label">Amount Paid:</span>
                <span><strong>${ticket.currency || 'USD'} ${ticket.price.toFixed(2)}</strong></span>
              </div>
              ` : ''}
            </div>

            <h3>What's Next?</h3>
            <ul>
              <li>📱 <strong>Save your QR code:</strong> You'll need it for check-in</li>
              <li>📅 <strong>Add to calendar:</strong> Don't miss the event</li>
              <li>🎫 <strong>View your ticket:</strong> Access anytime from your dashboard</li>
            </ul>

            <center>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos.app'}/tickets?event=${event.id}" class="button">
                View My Ticket
              </a>
            </center>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              <strong>Need help?</strong> Reply to this email or contact support at support@eventos.app
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EventOS. All rights reserved.</p>
            <p>You're receiving this because you registered for an event on EventOS.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Registration Confirmed: ${event.title}

Hi ${ticket.attendeeName},

Your registration for "${event.title}" has been confirmed!

Ticket Details:
- Ticket Number: ${ticket.ticketNumber}
- Event: ${event.title}
- Date: ${new Date(ticket.event?.date || event.startDate || new Date()).toLocaleDateString()}
- Time: ${new Date(ticket.event?.date || event.startDate || new Date()).toLocaleTimeString()}
- Location: ${ticket.event?.location || 'TBD'}
${ticket.price && ticket.price > 0 ? `- Amount Paid: ${ticket.currency || 'USD'} ${ticket.price.toFixed(2)}` : ''}

View your ticket: ${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos.app'}/tickets?event=${event.id}

See you at the event!

EventOS Team
    `
  }),

  eventReminder: (event: Event, hoursUntil: number) => ({
    subject: `Reminder: ${event.title} ${hoursUntil < 24 ? 'starts soon!' : 'is coming up'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B35 0%, #A855F7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; margin-top: -8px; }
          .button { display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .countdown { font-size: 36px; font-weight: bold; color: #FF6B35; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">⏰ Event Reminder</h1>
          </div>
          <div class="content">
            <div class="countdown">${hoursUntil}h until ${event.title}</div>
            <p>Don't forget! Your event is ${hoursUntil < 24 ? 'starting soon' : 'coming up'}.</p>
            <h3>Event Details:</h3>
            <ul>
              <li><strong>Event:</strong> ${event.title}</li>
              <li><strong>Date:</strong> ${new Date(event.startDate || new Date()).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</li>
              <li><strong>Time:</strong> ${new Date(event.startDate || new Date()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</li>
            </ul>
            <center>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos.app'}/events/${event.id}" class="button">
                View Event Details
              </a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

class EmailService {
  private apiEndpoint: string;

  constructor() {
    // Use Firebase Functions endpoint or fallback to environment variable
    this.apiEndpoint = process.env.NEXT_PUBLIC_EMAIL_API_ENDPOINT || '/api/send-email';
  }

  /**
   * Send registration confirmation email
   */
  async sendRegistrationConfirmation(ticket: EventTicket, event: Event): Promise<boolean> {
    try {
      const emailContent = templates.registrationConfirmation(ticket, event);
      
      await this.sendEmail({
        to: ticket.attendeeEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });

      console.log(`✅ Registration confirmation sent to ${ticket.attendeeEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send registration confirmation:', error);
      return false;
    }
  }

  /**
   * Send event reminder email
   */
  async sendEventReminder(userEmail: string, event: Event, hoursUntil: number): Promise<boolean> {
    try {
      const emailContent = templates.eventReminder(event, hoursUntil);
      
      await this.sendEmail({
        to: userEmail,
        subject: emailContent.subject,
        html: emailContent.html
      });

      console.log(`✅ Event reminder sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send event reminder:', error);
      return false;
    }
  }

  /**
   * Core email sending function
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV MODE] Email would be sent:', {
        to: options.to,
        subject: options.subject,
        preview: options.text?.substring(0, 100) + '...'
      });
      return;
    }

    // In production, send via API endpoint (Firebase Function or Next.js API route)
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error(`Email API responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
