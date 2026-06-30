import { NextRequest, NextResponse } from 'next/server';
import { submitEventFeedback } from '@/app/actions/feedback';
import { requireAuth } from '@/lib/auth-utils';
import { enforceRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Rate Limiting
    try {
      await enforceRateLimit({
        userId: user.id,
        scope: 'feedback-submit',
        limit: 5,
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const body = await request.json();
    const result = await submitEventFeedback(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('API Feedback Submit error', error);
    const isUnauthorized = error.message?.includes('Unauthorized');
    return NextResponse.json({ success: false, error: error.message }, { status: isUnauthorized ? 401 : 400 });
  }
}

