import { NextRequest, NextResponse } from 'next/server';
import { generateEventTasks } from '@/app/actions/ai-tasks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateEventTasks(body.eventId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
