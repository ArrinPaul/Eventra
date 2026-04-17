import { db } from '@/lib/db';
import { tickets, events, ticketTiers, notifications } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, eventId, tierId } = session.metadata || {};

      if (!userId || !eventId) {
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      try {
        // Idempotency: Check if a ticket already exists for this payment
        const existingTicket = await db.query.tickets.findFirst({
          where: and(
            eq(tickets.eventId, eventId),
            eq(tickets.userId, userId),
            eq(tickets.status, 'confirmed')
          )
        });

        if (existingTicket) {
          // Already fulfilled — return 200 to acknowledge without duplicate creation
          return NextResponse.json({ received: true, note: 'Already fulfilled' });
        }

        await db.transaction(async (tx) => {
          const ticketNumber = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

          await tx.insert(tickets).values({
            eventId,
            userId,
            tierId: tierId || null,
            ticketNumber,
            status: 'confirmed',
            price: (session.amount_total! / 100).toString(),
            qrCode: generateQrPayload(ticketNumber),
          });

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
      } catch (err) {
        console.error('Fulfillment Error:', err);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      try {
        // Find and update tickets associated with this charge via metadata
        // In a real setup, we'd store paymentIntentId on the ticket.
        // For now, use the session metadata pattern.
        if (charge.metadata?.userId && charge.metadata?.eventId) {
          const [refundedTicket] = await db
            .update(tickets)
            .set({ status: 'refunded', updatedAt: new Date() })
            .where(and(
              eq(tickets.eventId, charge.metadata.eventId),
              eq(tickets.userId, charge.metadata.userId),
              eq(tickets.status, 'confirmed')
            ))
            .returning();

          if (refundedTicket) {
            // Decrement event count
            await db
              .update(events)
              .set({ registeredCount: sql`${events.registeredCount} - 1` })
              .where(eq(events.id, charge.metadata.eventId));

            // Notify user
            await db.insert(notifications).values({
              userId: charge.metadata.userId,
              title: 'Refund Processed',
              message: `Your ticket has been refunded. The amount will appear in your account within 5-10 business days.`,
              type: 'info',
            });
          }
        }
      } catch (err) {
        console.error('Refund processing error:', err);
      }
      break;
    }

    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute;
      try {
        // Flag the associated ticket and notify the organizer
        if (dispute.metadata?.userId && dispute.metadata?.eventId) {
          await db
            .update(tickets)
            .set({ status: 'refunded', updatedAt: new Date() })
            .where(and(
              eq(tickets.eventId, dispute.metadata.eventId),
              eq(tickets.userId, dispute.metadata.userId)
            ));

          // Notify the event organizer about the dispute
          const event_record = await db.query.events.findFirst({
            where: eq(events.id, dispute.metadata.eventId)
          });

          if (event_record) {
            await db.insert(notifications).values({
              userId: event_record.organizerId,
              title: 'Payment Dispute Received',
              message: `A payment dispute has been filed for ${event_record.title}. Please review in your Stripe dashboard.`,
              type: 'info',
              link: '/organizer',
            });
          }
        }
      } catch (err) {
        console.error('Dispute processing error:', err);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
