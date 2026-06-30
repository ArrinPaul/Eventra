import { NextRequest, NextResponse } from 'next/server';
import { createStakeholder, getEventStakeholders, getStakeholderStats } from '@/app/actions/stakeholders';
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
        scope: `stakeholders-post:${eventId}`,
        limit: 20, // Max 20 changes per minute
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const result = await createStakeholder(body);
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('API Stakeholders POST error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

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
        scope: `stakeholders-get:${eventId}`,
        limit: 30, // 30 requests per minute
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const stakeholders = await getEventStakeholders(eventId, {
      role: searchParams.get('role') || undefined,
      search: searchParams.get('search') || undefined,
    });
    const stats = await getStakeholderStats(eventId);
    return NextResponse.json({ success: true, data: stakeholders, stats });
  } catch (error: any) {
    logger.error('API Stakeholders GET error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

