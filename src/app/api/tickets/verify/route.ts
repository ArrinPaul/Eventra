import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tickets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateStaffPermission } from '@/lib/auth-utils';
import { enforceRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryCode, eventId } = body;

    if (!entryCode || !eventId) {
      return NextResponse.json({ success: false, error: 'Entry code and event ID required' }, { status: 400 });
    }

    // 1. Auth & Permission Check (Organizers/Admins/Staff with 'scan_tickets' permission)
    let staffUser;
    try {
      staffUser = await validateStaffPermission(eventId, 'scan_tickets');
    } catch (authError: any) {
      logger.warn(`Unauthorized ticket verification attempt: ${authError.message}`);
      return NextResponse.json({ success: false, error: authError.message || 'Unauthorized' }, { status: 403 });
    }

    // 2. Rate Limiting Check
    try {
      await enforceRateLimit({
        userId: staffUser.id,
        scope: `ticket-verify:${eventId}`,
        limit: 30, // 30 verification attempts per minute
        windowMs: 60_000,
      });
    } catch (limitError: any) {
      return NextResponse.json({ success: false, error: limitError.message }, { status: 429 });
    }

    const ticket = await db.query.tickets.findFirst({
      where: and(eq(tickets.entryCode, entryCode), eq(tickets.eventId, eventId)),
      with: { user: true, event: true },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Invalid entry code' }, { status: 404 });
    }

    if (ticket.status === 'checked-in') {
      return NextResponse.json({ success: false, error: 'Already used', ticket: { ticketNumber: ticket.ticketNumber, status: ticket.status } }, { status: 409 });
    }

    if (ticket.status === 'cancelled' || ticket.status === 'expired' || ticket.status === 'refunded') {
      return NextResponse.json({ success: false, error: `Ticket ${ticket.status}` }, { status: 410 });
    }

    const [updated] = await db
      .update(tickets)
      .set({ 
        status: 'checked-in', 
        verifiedAt: new Date(), 
        verifiedBy: staffUser.id,
        updatedAt: new Date() 
      })
      .where(and(eq(tickets.id, ticket.id), eq(tickets.status, 'confirmed')))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      ticket: { 
        ticketNumber: ticket.ticketNumber, 
        entryCode: ticket.entryCode, 
        status: 'checked-in', 
        userName: ticket.user.name, 
        userEmail: ticket.user.email, 
        eventTitle: ticket.event.title 
      },
    });
  } catch (error) {
    logger.error('API Ticket Verify error', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

