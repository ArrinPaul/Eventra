'use server';

import { db } from '@/lib/db';
import { tickets, events, waitlist, ticketTiers } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, and, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { validateRole } from '@/lib/auth-utils';

/**
 * Register a user for an event (Create a ticket or join waitlist)
 */
export async function registerForEvent(eventId: string, data?: { tierId?: string }) {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    // 1. Check if already registered
    const existing = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.eventId, eventId), eq(tickets.userId, user.id)))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, message: 'Already registered' };
    }

    // 2. Get event details
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        ticketTiers: true
      }
    });

    if (!event) throw new Error('Event not found');

    // 3. Handle Tier Logic
    let price = event.price;
    let tier = null;
    
    if (data?.tierId) {
      tier = await db.query.ticketTiers.findFirst({
        where: eq(ticketTiers.id, data.tierId)
      });
      if (!tier) throw new Error('Ticket tier not found');
      price = tier.price;
      
      if (tier.registeredCount >= tier.capacity) {
        if (event.waitlistEnabled) return joinWaitlist(eventId, user.id);
        throw new Error('This ticket tier is sold out');
      }
    } else if (event.registeredCount >= event.capacity) {
      if (event.waitlistEnabled) return joinWaitlist(eventId, user.id);
      throw new Error('Event is full');
    }

    // 4. Create ticket (In a real app, this happens AFTER payment)
    const ticketNumber = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    await db.transaction(async (tx) => {
      await tx.insert(tickets).values({
        eventId,
        userId: user.id,
        tierId: data?.tierId,
        ticketNumber,
        status: 'confirmed',
        price: price,
      });

      // Update registration counts
      await tx
        .update(events)
        .set({ registeredCount: event.registeredCount + 1 })
        .where(eq(events.id, eventId));

      if (data?.tierId) {
        await tx
          .update(ticketTiers)
          .set({ registeredCount: sql`${ticketTiers.registeredCount} + 1` })
          .where(eq(ticketTiers.id, data.tierId));
      }
    });

    revalidatePath(`/events/${eventId}`);
    revalidatePath('/tickets');
    
    return { success: true, ticketNumber };
  } catch (error: any) {
    console.error('Registration failed:', error);
    throw new Error(error.message || 'Registration failed');
  }
}

/**
 * Join the waitlist for an event
 */
async function joinWaitlist(eventId: string, userId: string) {
  try {
    const existing = await db
      .select()
      .from(waitlist)
      .where(and(eq(waitlist.eventId, eventId), eq(waitlist.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, message: 'Already on waitlist' };
    }

    // Get current max position
    const lastEntry = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.eventId, eventId))
      .orderBy(desc(waitlist.position))
      .limit(1);

    const position = (lastEntry[0]?.position || 0) + 1;

    await db.insert(waitlist).values({
      eventId,
      userId,
      position,
      status: 'waiting',
    });

    revalidatePath(`/events/${eventId}`);
    return { success: true, message: 'Added to waitlist', position };
  } catch (error) {
    console.error('Waitlist join failed:', error);
    throw new Error('Could not join waitlist');
  }
}

/**
 * Promote the next person from waitlist (Auto-promotion logic)
 */
export async function promoteFromWaitlist(eventId: string) {
  // Find next in line
  const nextInLine = await db
    .select()
    .from(waitlist)
    .where(and(eq(waitlist.eventId, eventId), eq(waitlist.status, 'waiting')))
    .orderBy(waitlist.position)
    .limit(1);

  if (nextInLine.length === 0) return null;

  const entry = nextInLine[0];

  // Logic to notify user or automatically create a ticket
  // For now, we'll mark as promoted.
  await db
    .update(waitlist)
    .set({ status: 'promoted' })
    .where(eq(waitlist.id, entry.id));

  return entry.userId;
}

/**
 * Check if a user is registered for an event
 */
export async function getRegistrationStatus(eventId: string) {
  const session = await auth();
  if (!session?.user) return null;

  try {
    const result = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.eventId, eventId),
          eq(tickets.userId, session.user.id)
        )
      )
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get all registrations for the current user
 */
export async function getUserRegistrations() {
  const session = await auth();
  if (!session?.user) return [];

  try {
    const result = await db
      .select({
        ticket: tickets,
        event: events,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.userId, session.user.id))
      .orderBy(desc(tickets.purchaseDate));
    
    return result;
  } catch (error) {
    console.error('Failed to fetch user registrations:', error);
    return [];
  }
}
