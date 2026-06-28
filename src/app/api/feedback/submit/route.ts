import { NextRequest, NextResponse } from 'next/server';
import { submitEventFeedback } from '@/app/actions/feedback';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await submitEventFeedback(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
