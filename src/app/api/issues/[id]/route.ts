import { NextRequest, NextResponse } from 'next/server';
import { updateIssueStatus } from '@/app/actions/issues';
import { validateEventOwnership } from '@/lib/auth-utils';
import { enforceRateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { issues } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Fetch the issue to get the eventId
    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, id),
    });

    if (!issue) {
      return NextResponse.json({ success: false, error: 'Issue not found' }, { status: 404 });
    }

    // 2. Auth & Event Ownership Check
    let user;
    try {
      user = await validateEventOwnership(issue.eventId);
    } catch (authError: any) {
      return NextResponse.json({ success: false, error: authError.message || 'Unauthorized' }, { status: 403 });
    }

    // 3. Rate Limiting Check
    try {
      await enforceRateLimit({
        userId: user.id,
        scope: `issue-patch:${id}`,
        limit: 15,
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const body = await request.json();
    const result = await updateIssueStatus(id, body.status, body.adminNotes);
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('API Issues PATCH error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

