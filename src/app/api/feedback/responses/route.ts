import { NextRequest, NextResponse } from 'next/server';
import { getEventFeedbackAnalytics } from '@/app/actions/feedback';
import { validateEventOwnership } from '@/lib/auth-utils';
import { enforceRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 });

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
        scope: `feedback-responses:${eventId}`,
        limit: 30, // 30 requests per minute
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const data = await getEventFeedbackAnalytics(eventId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    logger.error('API Feedback Responses error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

