'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, ArrowRight, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const eventId = searchParams.get('event_id');
  const tier = searchParams.get('tier');
  const discountId = searchParams.get('discountId');
  
  const [loading, setLoading] = useState(true);
  const registerMutation = useMutation(api.registrations.register);

  useEffect(() => {
    async function confirm() {
      if (eventId && sessionId) {
        try {
          // Double confirm with Convex registration (mutation handles idempotency)
          await registerMutation({ 
            eventId: eventId as any, 
            status: 'confirmed',
            tierName: tier || undefined,
            discountId: discountId ? (discountId as any) : undefined
          });
        } catch (e) {
          console.error("Confirmation error:", e);
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/');
      }
    }
    confirm();
  }, [eventId, sessionId, router, registerMutation, tier, discountId]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-[#0f172a]/60 border-white/10 backdrop-blur-md text-white">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            {loading ? (
              <div className="bg-cyan-500/20 p-4 rounded-full">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <div className="bg-green-500/20 p-4 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {loading ? 'Confirming Payment...' : 'Registration Confirmed!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6 pt-4">
          <p className="text-gray-400">
            {loading 
              ? 'Please wait while we finalize your registration and generate your ticket.'
              : 'Thank you for your purchase! Your spot has been secured and your ticket is ready.'}
          </p>

          {!loading && (
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
        </CardContent>
      </Card>
    </div>
  );
}
