import { NextRequest, NextResponse } from 'next/server';
import { createStakeholder, getEventStakeholders, getStakeholderStats } from '@/app/actions/stakeholders';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createStakeholder(body);
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

    const stakeholders = await getEventStakeholders(eventId, {
      role: searchParams.get('role') || undefined,
      search: searchParams.get('search') || undefined,
    });
    const stats = await getStakeholderStats(eventId);
    return NextResponse.json({ success: true, data: stakeholders, stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
