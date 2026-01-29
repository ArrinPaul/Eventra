import { NextRequest, NextResponse } from 'next/server';

/**
 * Email API Route
 * Handles sending emails via various providers (SendGrid, Resend, etc.)
 * 
 * In production, configure one of these:
 * - SENDGRID_API_KEY for SendGrid
 * - RESEND_API_KEY for Resend
 * - Or use Firebase Extensions (Trigger Email)
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: EmailPayload = await request.json();

    // Validate required fields
    if (!payload.to || !payload.subject || !payload.html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check for email provider configuration
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (sendgridApiKey) {
      // Use SendGrid
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { 
            email: process.env.EMAIL_FROM || 'noreply@eventos.app',
            name: process.env.EMAIL_FROM_NAME || 'EventOS'
          },
          subject: payload.subject,
          content: [
            { type: 'text/html', value: payload.html },
            ...(payload.text ? [{ type: 'text/plain', value: payload.text }] : [])
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SendGrid error:', error);
        return NextResponse.json(
          { error: 'Failed to send email via SendGrid' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, provider: 'sendgrid' });
    } 
    
    if (resendApiKey) {
      // Use Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'EventOS <noreply@eventos.app>',
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Resend error:', error);
        return NextResponse.json(
          { error: 'Failed to send email via Resend' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, provider: 'resend' });
    }

    // No email provider configured - log and return success (for development)
    console.log('📧 [NO PROVIDER] Email would be sent:');
    console.log('  To:', payload.to);
    console.log('  Subject:', payload.subject);
    console.log('  Preview:', payload.html.substring(0, 200) + '...');

    return NextResponse.json({ 
      success: true, 
      provider: 'none',
      message: 'No email provider configured. Email logged to console.'
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  const hasProvider = !!(process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY);
  
  return NextResponse.json({
    status: 'ok',
    provider: process.env.SENDGRID_API_KEY 
      ? 'sendgrid' 
      : process.env.RESEND_API_KEY 
        ? 'resend' 
        : 'none',
    configured: hasProvider
  });
}
