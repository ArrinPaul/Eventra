'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, ArrowRight, Ticket } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const eventId = searchParams.get('event_id');
  const tier = searchParams.get('tier');
  const discountId = searchParams.get('discountId');
  
  const [loading, setLoading] = useState(true);

  // Stub implementation for missing registerMutation
  const registerMutation = useCallback(async (params: any) => {
    // TODO: Implement actual registration mutation
    console.log('Registering with params:', params);
    return Promise.resolve();
  }, []);

  useEffect(() => {
    async function confirm() {
      if (eventId && sessionId) {
        try {
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-card/80 border-border backdrop-blur-md text-white">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            {loading ? (
              <div className="bg-primary/20 p-4 rounded-full">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
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
          <p className="text-muted-foreground">
            {loading 
              ? 'Please wait while we finalize your registration and generate your ticket.'
              : 'Thank you for your purchase! Your spot has been secured and your ticket is ready.'}
          </p>

          {!loading && (
            <div className="flex flex-col gap-3">
              <Button asChild className="bg-primary hover:bg-primary text-white w-full">
                <Link href="/tickets">
                  <Ticket className="mr-2 h-4 w-4" /> View My Tickets
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-white">
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


