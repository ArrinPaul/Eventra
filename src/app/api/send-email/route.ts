import { NextResponse } from 'next/server';
import { sendEmail } from '@/core/services/email';
import { validateRole } from '@/lib/auth-utils';
import { enforceRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    // 1. Authenticate and authorize (Only admin or organizer)
    let user;
    try {
      user = await validateRole(['admin', 'organizer']);
    } catch (authError: any) {
      return NextResponse.json({ error: 'Unauthorized: Organizers and Admins only' }, { status: 403 });
    }

    // 2. Enforce strict rate limiting (5 emails per minute)
    try {
      await enforceRateLimit({
        userId: user.id,
        scope: 'api-send-email',
        limit: 5,
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ error: limitError.message }, { status: 429 });
    }

    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Basic recipient validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: 'Invalid recipient email address' }, { status: 400 });
    }

    const result = await sendEmail({ to, subject, html });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Email service not configured' ? 503 : 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    logger.error('Email API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

