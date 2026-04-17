import { db } from '@/lib/db';
import { tickets, events, ticketTiers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { generateQrPayload } from '@/core/utils/crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, eventId, tierId } = session.metadata || {};

      if (!userId || !eventId) {
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      try {
        await db.transaction(async (tx) => {
          const ticketNumber = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          
          // 1. Create the ticket
          await tx.insert(tickets).values({
            eventId,
            userId,
            tierId: tierId || null,
            ticketNumber,
            status: 'confirmed',
            price: (session.amount_total! / 100).toString(),
            qrCode: generateQrPayload(ticketNumber),
          });

          // 2. Update registration counts
          await tx
            .update(events)
            .set({ registeredCount: sql`${events.registeredCount} + 1` })
            .where(eq(events.id, eventId));

          if (tierId) {
            await tx
              .update(ticketTiers)
              .set({ registeredCount: sql`${ticketTiers.registeredCount} + 1` })
              .where(eq(ticketTiers.id, tierId));
          }
        });
        console.log(`✅ Ticket fulfilled: ${eventId}`);
      } catch (err) {
        console.error('Fulfillment Error:', err);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;
      console.log('Refund detected:', paymentIntentId);
      break;
    }

    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute;
      console.log('⚠️ Dispute created:', dispute.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
