'use server';

import { db } from '@/lib/db';
import { tickets, events } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { validateRole } from '@/lib/auth-utils';

/**
 * Register a user for an event (Create a ticket)
 */
export async function registerForEvent(eventId: string, data?: { tierName?: string }) {
  // Guard: Must be authenticated
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    // 1. Check if already registered
    const existing = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.eventId, eventId),
          eq(tickets.userId, user.id)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { success: false, message: 'Already registered' };
    }

    // 2. Get event details
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId)
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.registeredCount >= event.capacity) {
      throw new Error('Event is full');
    }

    // 3. Create ticket
    const ticketNumber = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    await db.transaction(async (tx) => {
      await tx.insert(tickets).values({
        eventId,
        userId: user.id,
        ticketNumber,
        status: 'confirmed',
        price: event.price,
      });

      // 4. Update registration count
      await tx
        .update(events)
        .set({ registeredCount: event.registeredCount + 1 })
        .where(eq(events.id, eventId));
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
