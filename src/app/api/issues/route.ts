import { NextRequest, NextResponse } from 'next/server';
import { createIssue, getEventIssues } from '@/app/actions/issues';
import { requireAuth, validateEventOwnership } from '@/lib/auth-utils';
import { enforceRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Enforce rate limit (5 issue creations per minute)
    try {
      await enforceRateLimit({
        userId: user.id,
        scope: 'issue-create',
        limit: 5,
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const body = await request.json();
    const result = await createIssue(body);
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('API Issues POST error', error);
    const isUnauthorized = error.message?.includes('Unauthorized');
    return NextResponse.json({ success: false, error: error.message }, { status: isUnauthorized ? 401 : 400 });
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
        scope: `issues-get:${eventId}`,
        limit: 30, // 30 requests per minute
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const issues = await getEventIssues(eventId, {
      status: searchParams.get('status') || undefined,
      severity: searchParams.get('severity') || undefined,
      category: searchParams.get('category') || undefined,
    });
    return NextResponse.json({ success: true, data: issues });
  } catch (error: any) {
    logger.error('API Issues GET error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

