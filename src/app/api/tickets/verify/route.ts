import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tickets, events, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryCode, eventId } = body;

    if (!entryCode || !eventId) {
      return NextResponse.json({ success: false, error: 'Entry code and event ID required' }, { status: 400 });
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

    if (ticket.status === 'cancelled' || ticket.status === 'expired') {
      return NextResponse.json({ success: false, error: `Ticket ${ticket.status}` }, { status: 410 });
    }

    const [updated] = await db.update(tickets).set({ status: 'checked-in', verifiedAt: new Date(), updatedAt: new Date() }).where(and(eq(tickets.id, ticket.id), eq(tickets.status, 'confirmed'))).returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      ticket: { ticketNumber: ticket.ticketNumber, entryCode: ticket.entryCode, status: 'checked-in', userName: ticket.user.name, userEmail: ticket.user.email, eventTitle: ticket.event.title },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
