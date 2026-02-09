'use server';

import Stripe from 'stripe';
import { envConfig } from '@/core/config/env-config';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function createCheckoutSession(eventId: string, userId: string) {
  try {
    // 1. Get event details
    const event = await convex.query(api.events.getById, { id: eventId as any });
    if (!event) throw new Error('Event not found');
    if (!event.isPaid || !event.price) throw new Error('Event is free');

    // 2. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: event.currency?.toLowerCase() || 'usd',
            product_data: {
              name: event.title,
              description: event.description.substring(0, 255),
              images: event.imageUrl ? [event.imageUrl] : [],
            },
            unit_amount: Math.round(event.price * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${envConfig.siteUrl}/ticketing/success?session_id={CHECKOUT_SESSION_ID}&event_id=${eventId}`,
      cancel_url: `${envConfig.siteUrl}/events/${eventId}`,
      metadata: {
        eventId,
        userId,
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error: any) {
    console.error('Stripe error:', error);
    throw new Error(error.message || 'Failed to create payment session');
  }
}
