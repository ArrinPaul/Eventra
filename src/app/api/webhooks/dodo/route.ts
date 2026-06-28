import { NextRequest, NextResponse } from 'next/server';
import { handlePaymentWebhook } from '@/app/actions/payments';
import { refundOrder } from '@/app/actions/orders';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const eventType = body.type || body.event_type;

    if (eventType === 'payment.completed' || eventType === 'checkout.session.completed') {
      const result = await handlePaymentWebhook(body.data || body);

      if (!result.success) {
        logger.error('Payment webhook processing failed', result);
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }

    if (eventType === 'payment.refunded' || eventType === 'refund.created') {
      const paymentId = body.data?.payment_id || body.data?.id || body.payment_id;

      if (paymentId) {
        const order = await db.query.orders.findFirst({
          where: eq(orders.paymentId, paymentId),
        });

        if (order) {
          const result = await refundOrder(order.id);
          if (!result.success) {
            logger.error('Refund processing failed', result);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Payment webhook error', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
