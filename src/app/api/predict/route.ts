import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { enforceRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Enforce rate limit (20 requests per minute)
    try {
      await enforceRateLimit({
        userId: user.id,
        scope: 'api-predict',
        limit: 20,
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const body = await request.json();
    return NextResponse.json({ success: true, message: 'Prediction endpoint ready', data: body });
  } catch (error: any) {
    logger.error('API Predict error', error);
    const isUnauthorized = error.message?.includes('Unauthorized');
    return NextResponse.json({ success: false, error: error.message }, { status: isUnauthorized ? 401 : 500 });
  }
}

