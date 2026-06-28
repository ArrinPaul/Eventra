import { NextRequest, NextResponse } from 'next/server';
import { createEventUpdate, getEventUpdates } from '@/app/actions/event-updates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createEventUpdate(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 });

    const updates = await getEventUpdates(eventId);
    return NextResponse.json({ success: true, data: updates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
