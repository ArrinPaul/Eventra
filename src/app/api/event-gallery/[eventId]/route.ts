import { NextRequest, NextResponse } from 'next/server';
import { getEventGallery } from '@/app/actions/media';

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const gallery = await getEventGallery(eventId);
    return NextResponse.json({ success: true, data: gallery });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
