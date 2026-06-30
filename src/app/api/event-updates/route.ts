import { NextRequest, NextResponse } from 'next/server';
import { createEventUpdate, getEventUpdates } from '@/app/actions/event-updates';
import { validateEventOwnership } from '@/lib/auth-utils';
import { enforceRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'eventId required' }, { status: 400 });
    }

    // 1. Auth & Event Ownership Check
    let user;
    try {
      user = await validateEventOwnership(eventId);
    } catch (authError: any) {
      return NextResponse.json({ success: false, error: authError.message || 'Unauthorized' }, { status: 403 });
    }

    // 2. Rate Limiting Check
    try {
      await enforceRateLimit({
        userId: user.id,
        scope: `updates-post:${eventId}`,
        limit: 10, // 10 updates per minute
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const result = await createEventUpdate(body);
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('API Event Updates POST error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 });

    // Enforce rate limiting for public updates page
    try {
      await enforceRateLimit({
        scope: `updates-get:${eventId}`,
        limit: 60, // 60 requests per minute
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const updates = await getEventUpdates(eventId);
    return NextResponse.json({ success: true, data: updates });
  } catch (error: any) {
    logger.error('API Event Updates GET error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

