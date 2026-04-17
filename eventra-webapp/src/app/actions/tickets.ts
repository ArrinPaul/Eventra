'use server';

import { db } from '@/lib/db';
import { tickets, events } from '@/lib/db/schema';
import { eq, and, isNull, lt, sql, or } from 'drizzle-orm';
import { validateRole } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

/**
 * Sync all tickets that have missing QR codes.
 * This ensures data integrity if the qr_code field was added later.
 */
export async function syncTicketQRCodes() {
  await validateRole(['admin']);

  try {
    const missingQRTickets = await db
      .select({ id: tickets.id, ticketNumber: tickets.ticketNumber })
      .from(tickets)
      .where(or(isNull(tickets.qrCode), eq(tickets.qrCode, '')));

    console.log(`Found ${missingQRTickets.length} tickets with missing QR codes.`);

    let updatedCount = 0;
    for (const ticket of missingQRTickets) {
      await db
        .update(tickets)
        .set({ qrCode: ticket.ticketNumber })
        .where(eq(tickets.id, ticket.id));
      updatedCount++;
    }

    return { success: true, updatedCount };
  } catch (error) {
    console.error('Failed to sync QR codes:', error);
    throw new Error('QR Sync failed');
  }
}

/**
 * Automatically refresh ticket statuses based on event dates.
 * Marks confirmed tickets as 'expired' if the event has ended.
 */
export async function refreshTicketStatuses(eventId?: string) {
  // Can be called by anyone but ideally triggered by a cron job or admin
  
  try {
    const now = new Date();
    
    // Find events that have already ended
    const finishedEvents = await db
      .select({ id: events.id })
      .from(events)
      .where(eventId ? and(eq(events.id, eventId), lt(events.endDate, now)) : lt(events.endDate, now));

    if (finishedEvents.length === 0) return { success: true, updatedCount: 0 };

    const eventIds = finishedEvents.map(e => e.id);

    // Update tickets for these events that are still in 'confirmed' or 'pending' state
    const result = await db
      .update(tickets)
      .set({ status: 'expired' })
      .where(
        and(
          sql`${tickets.eventId} IN ${eventIds}`,
          or(eq(tickets.status, 'confirmed'), eq(tickets.status, 'pending'))
        )
      );

    revalidatePath('/tickets');
    if (eventId) revalidatePath(`/events/${eventId}`);

    return { success: true, updatedCount: finishedEvents.length };
  } catch (error) {
    console.error('Failed to refresh ticket statuses:', error);
    throw new Error('Status refresh failed');
  }
}

/**
 * Get ticket details by ticket number (used for internal verification)
 */
export async function getTicketByNumber(ticketNumber: string) {
  try {
    const result = await db.query.tickets.findFirst({
      where: eq(tickets.ticketNumber, ticketNumber),
      with: {
        event: true,
        user: true,
        tier: true
      }
    });
    return result;
  } catch (error) {
    console.error('Failed to fetch ticket:', error);
    return null;
  }
}
