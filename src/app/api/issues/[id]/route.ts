import { NextRequest, NextResponse } from 'next/server';
import { updateIssueStatus } from '@/app/actions/issues';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await updateIssueStatus(id, body.status, body.adminNotes);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
