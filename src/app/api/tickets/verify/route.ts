import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tickets, events, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryCode, eventId } = body;

    if (!entryCode || !eventId) {
      return NextResponse.json(
        { success: false, error: 'Entry code and event ID are required' },
        { status: 400 }
      );
    }

    const ticket = await db.query.tickets.findFirst({
      where: and(
        eq(tickets.entryCode, entryCode),
        eq(tickets.eventId, eventId)
      ),
      with: {
        user: true,
        event: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Invalid entry code for this event' },
        { status: 404 }
      );
    }

    if (ticket.status === 'used' || ticket.status === 'checked-in') {
      return NextResponse.json(
        {
          success: false,
          error: 'Ticket already used',
          ticket: {
            ticketNumber: ticket.ticketNumber,
            status: ticket.status,
            verifiedAt: ticket.verifiedAt,
            userName: ticket.user.name,
          },
        },
        { status: 409 }
      );
    }

    if (ticket.status === 'expired') {
      return NextResponse.json(
        { success: false, error: 'Ticket has expired' },
        { status: 410 }
      );
    }

    if (ticket.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Ticket has been cancelled' },
        { status: 410 }
      );
    }

    if (ticket.expiresAt && new Date(ticket.expiresAt) < new Date()) {
      await db
        .update(tickets)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(tickets.id, ticket.id));

      return NextResponse.json(
        { success: false, error: 'Ticket has expired' },
        { status: 410 }
      );
    }

    const now = new Date();
    const [updatedTicket] = await db
      .update(tickets)
      .set({
        status: 'checked-in',
        verifiedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(tickets.id, ticket.id),
          eq(tickets.status, 'confirmed')
        )
      )
      .returning();

    if (!updatedTicket) {
      return NextResponse.json(
        { success: false, error: 'Ticket verification failed - status may have changed' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket: {
        ticketNumber: ticket.ticketNumber,
        entryCode: ticket.entryCode,
        status: 'checked-in',
        verifiedAt: now,
        userName: ticket.user.name,
        userEmail: ticket.user.email,
        userImage: ticket.user.image,
        eventTitle: ticket.event.title,
        ticketType: (ticket.metadata as any)?.ticketType || 'Standard',
      },
    });
  } catch (error) {
    console.error('Ticket verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
