'use server';

import { validateRole } from '@/lib/auth-utils';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { events, ticketTiers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

export async function processTicketCancellation(_ticketId: string) {
  // Guard: Authenticated
  await validateRole(['attendee', 'organizer', 'admin', 'professional']);
  
  // TODO: Add ownership check and Stripe refund logic
  return { success: true };
}

/**
 * Create a Stripe Checkout Session for ticket purchase
 */
export async function createCheckoutSession(data: { 
  eventId: string; 
  tierId?: string;
  origin: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Authentication required');

  const user = session.user;

  // 1. Get event/tier details
  const event = await db.query.events.findFirst({
    where: eq(events.id, data.eventId)
  });

  if (!event) throw new Error('Event not found');

  let priceInCents = Math.round(Number(event.price) * 100);
  let itemName = event.title;

  if (data.tierId) {
    const tier = await db.query.ticketTiers.findFirst({
      where: eq(ticketTiers.id, data.tierId)
    });
    if (!tier) throw new Error('Tier not found');
    priceInCents = Math.round(Number(tier.price) * 100);
    itemName = `${event.title} - ${tier.name}`;
  }

  if (priceInCents <= 0) {
    throw new Error('Use registration action for free events');
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
    success_url: `${data.origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}&eventId=${data.eventId}`,
    cancel_url: `${data.origin}/events/${data.eventId}`,
    customer_email: user.email!,
    metadata: {
      userId: user.id!,
      eventId: data.eventId,
      tierId: data.tierId || '',
    },
  });

  return { url: stripeSession.url };
}
