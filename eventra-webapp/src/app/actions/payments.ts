'use server';

import { validateRole } from '@/lib/auth-utils';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { events, ticketTiers, tickets } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { auth } from '@/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

export type ProcessTicketCancellationResult = {
  success: boolean;
  message?: string;
};

export type CreateCheckoutSessionResult = {
  success: boolean;
  url?: string;
  error?: string;
};

export type VerifyCheckoutFulfillmentResult = {
  success: boolean;
  fulfilled: boolean;
  message: string;
  ticketId?: string;
};

export async function processTicketCancellation(ticketId: string): Promise<ProcessTicketCancellationResult> {
  // Guard: Authenticated
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, ticketId),
      with: {
        event: true,
      }
    });

    if (!ticket) {
      return { success: false, message: 'Ticket not found' };
    }

    const isAdmin = (user as any).role === 'admin';
    const isOwner = ticket.userId === user.id;
    const isOrganizer = ticket.event.organizerId === user.id;

    if (!isAdmin && !isOwner && !isOrganizer) {
      return { success: false, message: 'Unauthorized cancellation request' };
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      return { success: true, message: 'Ticket already cancelled or refunded' };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(tickets)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(and(eq(tickets.id, ticketId), eq(tickets.status, 'confirmed')));

      await tx
        .update(events)
        .set({ registeredCount: sql`GREATEST(${events.registeredCount} - 1, 0)` })
        .where(eq(events.id, ticket.eventId));

      if (ticket.tierId) {
        await tx
          .update(ticketTiers)
          .set({ registeredCount: sql`GREATEST(${ticketTiers.registeredCount} - 1, 0)` })
          .where(eq(ticketTiers.id, ticket.tierId));
      }
    });

    return { success: true, message: 'Ticket cancelled successfully' };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Failed to cancel ticket' };
  }
}

/**
 * Create a Stripe Checkout Session for ticket purchase
 */
export async function createCheckoutSession(data: { 
  eventId: string; 
  tierId?: string;
  origin: string;
}): Promise<CreateCheckoutSessionResult> {
  await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Authentication required' };
  }

  const user = session.user;

  try {
    // 1. Get event/tier details
    const event = await db.query.events.findFirst({
      where: eq(events.id, data.eventId)
    });

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    let priceInCents = Math.round(Number(event.price) * 100);
    let itemName = event.title;

    if (data.tierId) {
      const tier = await db.query.ticketTiers.findFirst({
        where: eq(ticketTiers.id, data.tierId)
      });
      if (!tier) {
        return { success: false, error: 'Tier not found' };
      }
      priceInCents = Math.round(Number(tier.price) * 100);
      itemName = `${event.title} - ${tier.name}`;
    }

    if (priceInCents <= 0) {
      return { success: false, error: 'Use registration action for free events' };
    }

    // 2. Create Stripe Session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: itemName,
              description: `Ticket for ${event.title}`,
              images: event.imageUrl ? [event.imageUrl] : [],
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${data.origin}/ticketing/success?session_id={CHECKOUT_SESSION_ID}&event_id=${data.eventId}${data.tierId ? `&tier=${data.tierId}` : ''}`,
      cancel_url: `${data.origin}/events/${data.eventId}`,
      customer_email: user.email || undefined,
      metadata: {
        userId: user.id!,
        eventId: data.eventId,
        tierId: data.tierId || '',
      },
      payment_intent_data: {
        metadata: {
          userId: user.id!,
          eventId: data.eventId,
          tierId: data.tierId || '',
        }
      },
    });

    return { success: true, url: stripeSession.url || undefined };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create checkout session' };
  }
}

/**
 * Verify that a checkout session is truly fulfilled before showing success UI.
 */
export async function verifyCheckoutFulfillment(data: {
  sessionId: string;
  eventId: string;
}): Promise<VerifyCheckoutFulfillmentResult> {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  if (!data.sessionId || !data.eventId) {
    return {
      success: true,
      fulfilled: false,
      message: 'Missing checkout verification parameters.',
    };
  }

  try {
    const stripeSession = await stripe.checkout.sessions.retrieve(data.sessionId);

    const sessionUserId = stripeSession.metadata?.userId || '';
    const sessionEventId = stripeSession.metadata?.eventId || '';

    if (sessionUserId !== user.id || sessionEventId !== data.eventId) {
      return {
        success: true,
        fulfilled: false,
        message: 'Checkout session metadata does not match this user or event.',
      };
    }

    const isPaid = stripeSession.payment_status === 'paid';
    const isCompleted = stripeSession.status === 'complete';
    if (!isPaid || !isCompleted) {
      return {
        success: true,
        fulfilled: false,
        message: 'Payment has not completed yet.',
      };
    }

    const ticketNumber = `TKT-STRIPE-${data.sessionId}`;
    const ticket = await db.query.tickets.findFirst({
      where: and(
        eq(tickets.ticketNumber, ticketNumber),
        eq(tickets.userId, user.id),
        eq(tickets.eventId, data.eventId),
        eq(tickets.status, 'confirmed')
      ),
    });

    if (!ticket) {
      return {
        success: true,
        fulfilled: false,
        message: 'Payment is complete, but ticket fulfillment is still processing.',
      };
    }

    return {
      success: true,
      fulfilled: true,
      message: 'Checkout verified and ticket confirmed.',
      ticketId: ticket.id,
    };
  } catch (error: any) {
    return {
      success: false,
      fulfilled: false,
      message: error?.message || 'Failed to verify checkout fulfillment.',
    };
  }
}
