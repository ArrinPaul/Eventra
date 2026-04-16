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
      conditions.push(eq(events.organizerId, user.id!));
    }

    const result = await db
      .select({
        id: events.id,
        title: events.title,
        registeredCount: events.registeredCount,
        capacity: events.capacity,
        organizerId: events.organizerId,
        startDate: events.startDate,
        endDate: events.endDate
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
  // 1. Security check: Ensure the user has permission to scan for this specific event
  await validateEventOwnership(eventId);

  try {
    // 2. Find the ticket and event details
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

    // 3. Event Timing Validation
    const now = new Date();
    const event = ticket.event;
    
    // Buffer for early check-in (e.g., 2 hours before)
    const checkInStartTime = new Date(event.startDate.getTime() - (2 * 60 * 60 * 1000));
    
    if (now < checkInStartTime) {
      throw new Error(`Too Early: Check-in for this event starts at ${checkInStartTime.toLocaleTimeString()}`);
    }
    
    if (now > event.endDate) {
      throw new Error(`Event Finished: This event ended at ${event.endDate.toLocaleString()}`);
    }

    // 4. State Machine & Anti-Fraud Logic
    if (ticket.status === 'checked-in') {
      throw new Error(`Already Scanned: This ticket was checked in at ${ticket.updatedAt?.toLocaleString() || 'an earlier time'}`);
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      throw new Error(`Invalid Ticket: This registration has been ${ticket.status}`);
    }
    
    if (ticket.status === 'expired') {
      throw new Error('Invalid Ticket: This ticket has expired');
    }

    // 5. Perform Check-in
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

    // 6. Post-Check-in Actions (Background)
    
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

    // Schedule Feedback Notification
    db.insert(notifications).values({
      userId: ticket.userId,
      title: 'How was the event?',
      message: `We hope you're enjoying ${ticket.event.title}! Don't forget to share your feedback.`,
      type: 'info',
      link: `/feedback/${eventId}`
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
