'use server';

import { db } from '@/lib/db';
import { tickets, events, activityFeed } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { validateRole, validateEventOwnership } from '@/lib/auth-utils';
import { awardXP } from './gamification';
import { logActivity } from './feed';

/**
 * Fetch events that the user is authorized to scan for.
 * (Organizer's own events or all if admin)
 */
export async function getScannerEvents() {
  const user = await validateRole(['organizer', 'admin']);
  
  try {
    const conditions = [];
    if ((user as any).role !== 'admin') {
      conditions.push(eq(events.organizerId, user.id));
    }

    const result = await db
      .select({
        id: events.id,
        title: events.title,
        registeredCount: events.registeredCount,
        capacity: events.capacity,
        organizerId: events.organizerId
      })
      .from(events)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get check-in counts for each event
    const eventsWithStats = await Promise.all(result.map(async (event) => {
      const checkInCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(and(
          eq(tickets.eventId, event.id),
          eq(tickets.status, 'checked-in')
        ));
      
      return {
        ...event,
        checkInCount: Number(checkInCount[0]?.count || 0)
      };
    }));

    return eventsWithStats;
  } catch (error) {
    console.error('getScannerEvents Error:', error);
    return [];
  }
}

/**
 * Process a check-in for a specific ticket number and event.
 */
export async function checkInTicket(ticketNumber: string, eventId: string) {
  const user = await validateRole(['organizer', 'admin']);
  
  // Security check: Ensure the user has permission to scan for this specific event
  if ((user as any).role !== 'admin') {
    const event = await db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.organizerId, user.id))
    });
    if (!event) {
      throw new Error('Unauthorized: You do not have permission to scan for this event');
    }
  }

  try {
    // 1. Find the ticket
    const ticket = await db.query.tickets.findFirst({
      where: and(
        eq(tickets.ticketNumber, ticketNumber),
        eq(tickets.eventId, eventId)
      ),
      with: {
        user: true,
        event: true
      }
    });

    if (!ticket) {
      throw new Error('Invalid Ticket: No matching record found for this event');
    }

    // 2. State Machine & Anti-Fraud Logic
    if (ticket.status === 'checked-in') {
      throw new Error(`Already Scanned: This ticket was checked in at ${ticket.updatedAt?.toLocaleString() || 'an earlier time'}`);
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      throw new Error(`Invalid Ticket: This registration has been ${ticket.status}`);
    }

    // 3. Perform Check-in
    const updatedTicket = await db.transaction(async (tx) => {
      const [result] = await tx
        .update(tickets)
        .set({ 
          status: 'checked-in',
          updatedAt: new Date()
        })
        .where(eq(tickets.id, ticket.id))
        .returning();
      
      return result;
    });

    // 4. Post-Check-in Actions (Background)
    
    // Award XP to the attendee for showing up
    awardXP(ticket.userId, 50, `Attending ${ticket.event.title}`).catch(console.error);
    
    // Log Activity for the attendee
    logActivity({
      userId: ticket.userId,
      type: 'event_checkin',
      targetId: eventId,
      content: `Checked into ${ticket.event.title}`,
      metadata: { ticketNumber }
    }).catch(console.error);

    revalidatePath(`/events/${eventId}`);
    revalidatePath('/check-in-scanner');

    return { 
      success: true, 
      ticket: {
        ...updatedTicket,
        userName: ticket.user.name,
        userImage: ticket.user.image
      } 
    };
  } catch (error: any) {
    console.error('Check-in processing error:', error);
    throw new Error(error.message || 'Check-in failed');
  }
}
