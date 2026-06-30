import { NextRequest, NextResponse } from 'next/server';
import { getEventGallery } from '@/app/actions/media';
import { enforceRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;

    // Enforce rate limiting for public page
    try {
      await enforceRateLimit({
        scope: `event-gallery:${eventId}`,
        limit: 60, // 60 requests per minute
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const gallery = await getEventGallery(eventId);
    return NextResponse.json({ success: true, data: gallery });
  } catch (error: any) {
    logger.error('API Event Gallery GET error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

