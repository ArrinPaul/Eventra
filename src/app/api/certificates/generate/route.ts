import { NextRequest, NextResponse } from 'next/server';
import { bulkIssueCertificates } from '@/app/actions/certificates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await bulkIssueCertificates(body.eventId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
