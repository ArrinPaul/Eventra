'use server';
/**
 * @fileOverview A flow to send a broadcast email to all attendees.
 * 
 * Supports SendGrid and Resend providers via environment variables.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BroadcastEmailInputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The HTML body of the email.'),
  recipients: z.array(z.object({
    name: z.string().optional(),
    email: z.string(),
  })).describe('A list of recipients with their name and email address.'),
});
export type BroadcastEmailInput = z.infer<typeof BroadcastEmailInputSchema>;

const BroadcastEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the broadcast was sent successfully.'),
  sentCount: z.number().describe('The number of emails sent.'),
  provider: z.string().optional(),
});
export type BroadcastEmailOutput = z.infer<typeof BroadcastEmailOutputSchema>;

export async function broadcastEmail(input: BroadcastEmailInput): Promise<BroadcastEmailOutput> {
  return broadcastEmailFlow(input);
}

const broadcastEmailFlow = ai.defineFlow(
  {
    name: 'broadcastEmailFlow',
    inputSchema: BroadcastEmailInputSchema,
    outputSchema: BroadcastEmailOutputSchema,
  },
  async (input) => {
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@eventos.app';
    const fromName = process.env.EMAIL_FROM_NAME || 'Eventra';

    let sentCount = 0;
    let provider = 'none';

    if (sendgridApiKey) {
      provider = 'sendgrid';
      // SendGrid supports batch sending but for simplicity and reliability we'll do it in chunks or individually
      // Here we'll do it one by one to handle potential individual failures, but in prod you'd use batching
      for (const recipient of input.recipients) {
        try {
          const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sendgridApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: recipient.email }] }],
              from: { email: fromEmail, name: fromName },
              subject: input.subject,
              content: [{ type: 'text/html', value: input.body }],
            }),
          });
          if (response.ok) sentCount++;
        } catch (e) {
          console.error(`Failed to send email to ${recipient.email} via SendGrid:`, e);
        }
      }
    } else if (resendApiKey) {
      provider = 'resend';
      for (const recipient of input.recipients) {
        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `${fromName} <${fromEmail}>`,
              to: recipient.email,
              subject: input.subject,
              html: input.body,
            }),
          });
          if (response.ok) sentCount++;
        } catch (e) {
          console.error(`Failed to send email to ${recipient.email} via Resend:`, e);
        }
      }
    } else {
      console.log('📧 [SIMULATION] No email provider configured. Logging broadcast:');
      console.log('Subject:', input.subject);
      console.log('Recipients:', input.recipients.length);
      sentCount = input.recipients.length;
    }

    return {
      success: true,
      sentCount,
      provider
    };
  }
);