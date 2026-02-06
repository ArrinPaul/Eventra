'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Heart,
  Share2,
  Ticket,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function EventDetailsClient({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const event = useQuery(api.events.getById, { id: eventId as any });
  const registration = useQuery(api.registrations.getRegistration, { eventId: eventId as any });
  const registerMutation = useMutation(api.registrations.register);
  
  const [registering, setRegistering] = useState(false);

  const handleRegister = async () => {
    if (!user) {
      router.push(`/login?callbackUrl=/events/${eventId}`);
      return;
    }
    setRegistering(true);
    try {
      await registerMutation({ eventId: eventId as any });
      toast({ title: 'Registered! 🎉' });
    } catch (e) {
      toast({ title: 'Registration Failed', variant: 'destructive' });
    } finally {
      setRegistering(false);
    }
  };

  if (event === undefined) return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
  if (event === null) return <div className="flex items-center justify-center min-h-screen text-white">Event Not Found</div>;

  const isRegistered = !!registration;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="h-[300px] bg-gradient-to-br from-cyan-900/50 to-purple-900/50 relative">
        <div className="absolute top-4 left-4"><Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></div>
      </div>
      <div className="container -mt-20 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardContent className="p-8">
                <Badge className="mb-4">{event.category}</Badge>
                <h1 className="text-4xl font-bold mb-6">{event.title}</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3"><Calendar className="text-cyan-400" /> <div><p className="text-xs text-gray-400">Date</p><p className="font-medium">{new Date(event.startDate).toLocaleDateString()}</p></div></div>
                  <div className="flex items-center gap-3"><Users className="text-cyan-400" /> <div><p className="text-xs text-gray-400">Attendees</p><p className="font-medium">{event.registeredCount}</p></div></div>
                </div>
                <Separator className="my-8 border-white/10" />
                <h3 className="font-bold mb-4">About</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{event.description}</p>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold">{event.isPaid ? `$${event.price}` : 'Free'}</p>
                </div>
                <Button className="w-full" size="lg" onClick={handleRegister} disabled={registering || isRegistered}>
                  {registering ? <Loader2 className="animate-spin" /> : isRegistered ? <CheckCircle className="mr-2" /> : <Ticket className="mr-2" />}
                  {isRegistered ? 'Registered' : 'Register Now'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}