'use server';

import { db } from '@/lib/db';
import { tickets, events, users, notifications } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { validateRole, validateEventOwnership } from '@/lib/auth-utils';
import { certificatePersonalizedMessageFlow } from '@/lib/ai';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

/**
 * Issue a certificate for a single ticket, generating a personalized AI message
 */
export async function issueCertificate(ticketId: string) {
  const ticketData = await db
    .select({
      ticket: tickets,
      event: events,
      user: users,
    })
    .from(tickets)
    .innerJoin(events, eq(tickets.eventId, events.id))
    .innerJoin(users, eq(tickets.userId, users.id))
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (ticketData.length === 0) throw new Error('Ticket not found');
  
  const { ticket, event, user } = ticketData[0];
  await validateEventOwnership(event.id);

  if (ticket.status !== 'checked-in') {
    throw new Error('Attendee must be checked in to receive a certificate');
  }

  try {
    // 1. Generate Personalized Message using AI
    const { personalizedMessage } = await certificatePersonalizedMessageFlow({
      userName: user.name || 'Attendee',
      eventTitle: event.title,
    });

    // 2. Update Ticket with the message and mark as "issued" (using a status or just the message presence)
    await db
      .update(tickets)
      .set({ 
        personalizedMessage,
        updatedAt: new Date()
      })
      .where(eq(tickets.id, ticketId));

    // 3. Notify user
    await db.insert(notifications).values({
      userId: user.id,
      title: 'Your Certificate is Ready!',
      message: `Congratulations! Your certificate for ${event.title} is now available for download.`,
      type: 'achievement',
      link: `/certificates`
    });

    revalidatePath(`/certificates`);
    return { success: true, message: personalizedMessage };
  } catch (error) {
    console.error('Certificate Issue Error:', error);
    throw new Error('Failed to generate certificate');
  }
}

/**
 * Bulk issue certificates for all checked-in attendees of an event
 */
export async function bulkIssueCertificates(eventId: string) {
  await validateEventOwnership(eventId);

  const checkedInTickets = await db
    .select()
    .from(tickets)
    .where(and(
      eq(tickets.eventId, eventId),
      eq(tickets.status, 'checked-in'),
      sql`${tickets.personalizedMessage} IS NULL`
    ));

  if (checkedInTickets.length === 0) {
    return { success: true, count: 0, message: 'No pending certificates for checked-in attendees' };
  }

  // Process in background or small batches to avoid timeouts
  let issuedCount = 0;
  for (const ticket of checkedInTickets) {
    try {
      await issueCertificate(ticket.id);
      issuedCount++;
    } catch (e) {
      console.error(`Failed to issue bulk certificate for ticket ${ticket.id}:`, e);
    }
  }

  revalidatePath('/organizer');
  return { success: true, count: issuedCount };
}

/**
 * Fetch all certificates for the current user
 */
export async function getUserCertificates() {
  const session = await auth();
  if (!session?.user) return [];

  try {
    const result = await db
      .select({
        id: tickets.id,
        certificateNumber: tickets.ticketNumber,
        personalizedMessage: tickets.personalizedMessage,
        issueDate: tickets.updatedAt,
        event: {
          title: events.title,
          startDate: events.startDate,
        }
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(and(
        eq(tickets.userId, session.user.id),
        sql`${tickets.personalizedMessage} IS NOT NULL`
      ))
      .orderBy(desc(tickets.updatedAt));

    return result;
  } catch (error) {
    console.error('getUserCertificates Error:', error);
    return [];
  }
}

/**
 * Verify a certificate by its number
 */
export async function verifyCertificate(certificateNumber: string) {
  try {
    const result = await db
      .select({
        certificateNumber: tickets.ticketNumber,
        issueDate: tickets.updatedAt,
        userName: users.name,
        eventTitle: events.title,
        personalizedMessage: tickets.personalizedMessage
      })
      .from(tickets)
      .innerJoin(users, eq(tickets.userId, users.id))
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(and(
        eq(tickets.ticketNumber, certificateNumber.toUpperCase()),
        sql`${tickets.personalizedMessage} IS NOT NULL`
      ))
      .limit(1);

    if (result.length === 0) {
      return { valid: false };
    }

    return { 
      valid: true, 
      ...result[0] 
    };
  } catch (error) {
    console.error('verifyCertificate Error:', error);
    return { valid: false };
  }
}
