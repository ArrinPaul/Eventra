'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, ArrowRight, Ticket, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { verifyCheckoutFulfillment } from '@/app/actions/payments';

type VerifyState = 'loading' | 'confirmed' | 'failed';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const eventId = searchParams.get('event_id');
  
  const [state, setState] = useState<VerifyState>('loading');
  const [message, setMessage] = useState('Please wait while we verify your payment and ticket fulfillment.');

  useEffect(() => {
    let mounted = true;

    async function confirm() {
      if (!eventId || !sessionId) {
        router.push('/');
        return;
      }

      // Retry briefly to absorb webhook-to-db propagation lag.
      for (let attempt = 0; attempt < 6; attempt++) {
        const result = await verifyCheckoutFulfillment({
          sessionId,
          eventId,
        });

        if (!mounted) return;

        if (result.fulfilled) {
          setState('confirmed');
          setMessage('Thank you for your purchase! Your spot has been secured and your ticket is ready.');
          return;
        }

        setMessage(result.message);

        if (attempt < 5) {
          await sleep(1500);
        }
      }

      setState('failed');
      setMessage('We could not confirm ticket fulfillment yet. If payment succeeded, it may still be processing.');
    }

    confirm();

    return () => {
      mounted = false;
    };
  }, [eventId, sessionId, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-[#0f172a]/60 border-white/10 backdrop-blur-md text-white">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            {state === 'loading' ? (
              <div className="bg-cyan-500/20 p-4 rounded-full">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              </div>
            ) : state === 'confirmed' ? (
              <div className="bg-green-500/20 p-4 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
            ) : (
              <div className="bg-amber-500/20 p-4 rounded-full">
                <AlertTriangle className="w-12 h-12 text-amber-400" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {state === 'loading' ? 'Confirming Payment...' : state === 'confirmed' ? 'Registration Confirmed!' : 'Verification Pending'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6 pt-4">
          <p className="text-gray-400">{message}</p>

          {state === 'confirmed' && (
            <div className="flex flex-col gap-3">
              <Button asChild className="bg-cyan-600 hover:bg-cyan-500 text-white w-full">
                <Link href="/tickets">
                  <Ticket className="mr-2 h-4 w-4" /> View My Tickets
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full text-gray-400 hover:text-white">
                <Link href="/explore">
                  Explore More Events <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}

          {state === 'failed' && (
            <div className="flex flex-col gap-3">
              <Button asChild className="bg-cyan-600 hover:bg-cyan-500 text-white w-full">
                <Link href="/tickets">
                  <Ticket className="mr-2 h-4 w-4" /> Check My Tickets
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full text-gray-400 hover:text-white">
                <Link href={`/events/${eventId}`}>
                  Back to Event <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


