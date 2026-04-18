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

function getMetadataValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export async function POST(req: Request) {
  if (!endpointSecret) {
    return NextResponse.json({ error: 'Stripe webhook secret is not configured' }, { status: 500 });
  }

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
      const userId = getMetadataValue(session.metadata?.userId);
      const eventId = getMetadataValue(session.metadata?.eventId);
      const tierId = getMetadataValue(session.metadata?.tierId);

      if (!userId || !eventId) {
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      try {
        // Idempotency token derived from Stripe checkout session
        const idempotencyTicketNumber = `TKT-STRIPE-${session.id}`;

        // Idempotency: Check if this checkout session was already fulfilled
        const existingTicket = await db.query.tickets.findFirst({
          where: eq(tickets.ticketNumber, idempotencyTicketNumber)
        });

        if (existingTicket) {
          // Already fulfilled — return 200 to acknowledge without duplicate creation
          return NextResponse.json({ received: true, note: 'Already fulfilled' });
        }

        await db.transaction(async (tx) => {
          await tx.insert(tickets).values({
            eventId,
            userId,
            tierId,
            ticketNumber: idempotencyTicketNumber,
            status: 'confirmed',
            price: (session.amount_total! / 100).toString(),
            qrCode: generateQrPayload(idempotencyTicketNumber),
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
      const eventId = getMetadataValue(charge.metadata?.eventId);
      const userId = getMetadataValue(charge.metadata?.userId);

      try {
        if (eventId && userId) {
          const [refundedTicket] = await db
            .update(tickets)
            .set({ status: 'refunded', updatedAt: new Date() })
            .where(and(
              eq(tickets.eventId, eventId),
              eq(tickets.userId, userId),
              eq(tickets.status, 'confirmed')
            ))
            .returning();

          if (refundedTicket) {
            // Decrement event count
            await db
              .update(events)
              .set({ registeredCount: sql`${events.registeredCount} - 1` })
              .where(eq(events.id, eventId));

            // Notify user
            await db.insert(notifications).values({
              userId,
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
      const eventId = getMetadataValue(dispute.metadata?.eventId);
      const userId = getMetadataValue(dispute.metadata?.userId);

      try {
        // Flag the associated ticket and notify the organizer
        if (eventId && userId) {
          await db
            .update(tickets)
            .set({ status: 'refunded', updatedAt: new Date() })
            .where(and(
              eq(tickets.eventId, eventId),
              eq(tickets.userId, userId)
            ));

          // Notify the event organizer about the dispute
          const event_record = await db.query.events.findFirst({
            where: eq(events.id, eventId)
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
