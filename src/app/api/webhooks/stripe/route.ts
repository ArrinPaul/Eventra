import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const eventId = session.metadata?.eventId;
    const userId = session.metadata?.userId;

    if (eventId && userId) {
      // Confirm payment in Convex
      try {
        await convex.mutation(api.registrations.confirmPayment, {
          eventId: eventId as any,
          userId: userId as any,
        });
      } catch (e) {
        console.error('Failed to confirm payment in Convex:', e);
        return NextResponse.json({ error: 'Convex mutation failed' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
