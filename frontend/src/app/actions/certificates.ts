'use server';

import { db } from '@/lib/db';
import { tickets, events, users, notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateRole, validateEventOwnership } from '@/lib/auth-utils';
import { certificatePersonalizedMessageFlow } from '@/lib/ai';
import { revalidatePath } from 'next/cache';

/**
 * Issue a certificate for a ticket, generating a personalized AI message
 */
export async function issueCertificate(ticketId: string) {
  // Guard: Organizer or Admin
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

  try {
    // 1. Generate Personalized Message
    const { personalizedMessage } = await certificatePersonalizedMessageFlow({
      userName: user.name || 'Attendee',
      eventTitle: event.title,
    });

    // 2. Update Ticket with the message
    await db
      .update(tickets)
      .set({ 
        personalizedMessage,
        status: 'checked_in' 
      })
      .where(eq(tickets.id, ticketId));

    // 3. Create notification to trigger certificate email
    await db.insert(notifications).values({
      userId: user.id,
      title: 'Certificate Ready',
      message: `EMAIL_TRIGGER:certificate|${event.title}`,
      type: 'email',
    });

    revalidatePath(`/tickets/${ticketId}`);
    return { success: true, message: personalizedMessage };
  } catch (error) {
    console.error('Certificate Issue Error:', error);
    return { success: false, error: 'Failed to generate AI certificate message' };
  }
}

/**
 * Get certificate data for a ticket
 */
export async function getCertificateData(ticketId: string) {
  try {
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

    if (ticketData.length === 0) return null;

    const { ticket, event, user } = ticketData[0];

    return {
      recipientName: user.name,
      eventTitle: event.title,
      eventDate: event.startDate.toLocaleDateString(),
      verificationCode: ticket.ticketNumber,
      personalizedMessage: ticket.personalizedMessage,
    };
  } catch (error) {
    console.error('Fetch Certificate Error:', error);
    return null;
  }
}
