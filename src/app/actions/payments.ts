'use server';

import Stripe from 'stripe';
import { envConfig } from '@/core/config/env-config';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function createCheckoutSession(eventId: string, userId: string, tierName?: string) {
  try {
    // 1. Get event details
    const event = await convex.query(api.events.getById, { id: eventId as any });
    if (!event) throw new Error('Event not found');
    
    let price = event.price || 0;
    let description = event.description.substring(0, 255);

    if (tierName && event.ticketTiers) {
      const tier = (event.ticketTiers as any[]).find((t: any) => t.name === tierName);
      if (tier) {
        price = tier.price;
        description = `${tier.name}: ${tier.description || event.title}`;
      }
    }

    if (!price || price <= 0) throw new Error('Event or tier is free');

    // 2. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: event.currency?.toLowerCase() || 'usd',
            product_data: {
              name: tierName ? `${event.title} - ${tierName}` : event.title,
              description: description,
              images: event.imageUrl ? [event.imageUrl] : [],
            },
            unit_amount: Math.round(price * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${envConfig.siteUrl}/ticketing/success?session_id={CHECKOUT_SESSION_ID}&event_id=${eventId}${tierName ? `&tier=${encodeURIComponent(tierName)}` : ''}`,
      cancel_url: `${envConfig.siteUrl}/events/${eventId}`,
      metadata: {
        eventId,
        userId,
        tierName: tierName || "",
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error: any) {
    console.error('Stripe error:', error);
    throw new Error(error.message || 'Failed to create payment session');
  }
}

export async function refundPayment(paymentIntentId: string) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
    return { success: true, refundId: refund.id };
  } catch (error: any) {
    console.error('Stripe refund error:', error);
    throw new Error(error.message || 'Failed to process refund');
  }
}

/**
 * Handle full cancellation flow: Stripe refund + Convex update
 */
export async function processTicketCancellation(ticketId: string, stripePaymentId?: string) {
  try {
    let status = 'cancelled';
    
    if (stripePaymentId) {
      await refundPayment(stripePaymentId);
      status = 'refunded';
    }

    // Since we're in a server action, we need a way to call Convex mutation
    // We can't use useMutation here. We use ConvexHttpClient.
    await convex.mutation(api.tickets.cancelTicket, { 
      ticketId: ticketId as any, 
      status 
    });

    return { success: true, status };
  } catch (error: any) {
    console.error('Cancellation error:', error);
    throw new Error(error.message || 'Failed to cancel ticket');
  }
}
