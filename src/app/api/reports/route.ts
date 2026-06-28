import { NextRequest, NextResponse } from 'next/server';
import { generateAndSaveReport } from '@/app/actions/reports';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateAndSaveReport(body.eventId, body.highlights);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
