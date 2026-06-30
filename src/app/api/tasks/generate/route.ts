import { NextRequest, NextResponse } from 'next/server';
import { generateEventTasks } from '@/app/actions/ai-tasks';
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
        scope: `tasks-generate:${eventId}`,
        limit: 10, // Max 10 task generation calls per minute
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const result = await generateEventTasks(eventId);
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('API Tasks Generate error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

