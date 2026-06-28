import { NextRequest, NextResponse } from 'next/server';
import { handlePaymentWebhook } from '@/app/actions/payments';
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

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Payment webhook error', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
