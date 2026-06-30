import { NextRequest, NextResponse } from 'next/server';
import { generateAndSaveReport } from '@/app/actions/reports';
import { validateEventOwnership } from '@/lib/auth-utils';
import { enforceRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, highlights } = body;

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'eventId required' }, { status: 400 });
    }

    // 1. Auth & Event Ownership Check (Organizer, Co-organizers, Admin)
    let user;
    try {
      user = await validateEventOwnership(eventId);
    } catch (authError: any) {
      return NextResponse.json({ success: false, error: authError.message || 'Unauthorized' }, { status: 403 });
    }

    // 2. Rate Limiting Check (e.g., 5 report generations per minute per user)
    try {
      await enforceRateLimit({
        userId: user.id,
        scope: `report-gen:${eventId}`,
        limit: 5,
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const result = await generateAndSaveReport(eventId, highlights);
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('API Report generation error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

