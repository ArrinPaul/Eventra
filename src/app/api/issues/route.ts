import { NextRequest, NextResponse } from 'next/server';
import { createIssue, getEventIssues } from '@/app/actions/issues';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createIssue(body);
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

    const issues = await getEventIssues(eventId, {
      status: searchParams.get('status') || undefined,
      severity: searchParams.get('severity') || undefined,
      category: searchParams.get('category') || undefined,
    });
    return NextResponse.json({ success: true, data: issues });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
