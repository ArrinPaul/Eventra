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
  Edit,
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { EventChatbot, ChatbotTrigger } from '@/components/ai/event-chatbot';
import { Progress } from '@/components/ui/progress';
import { createCheckoutSession } from '@/app/actions/payments';
import { EventDiscussionBoard } from './event-discussion-board';
import { EventReactions } from './event-reactions';

export default function EventDetailsClient({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const event = useQuery(api.events.getById, { id: eventId as any });
  const registration = useQuery(api.registrations.getRegistration, { eventId: eventId as any });
  const registerMutation = useMutation(api.registrations.register);
  
  const [registering, setRegistering] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [activeTab, setActiveTab] = useState('about');


  const handleRegister = async () => {
    if (!user) {
      router.push(`/login?callbackUrl=/events/${eventId}`);
      return;
    }
    
    setRegistering(true);
    try {
      if (event?.isPaid && event.price && event.price > 0) {
        // Stripe Flow
        const { url } = await createCheckoutSession(eventId, user._id || user.id);
        if (url) {
          window.location.href = url;
        } else {
          throw new Error("Failed to create checkout session");
        }
      } else {
        // Free Registration Flow
        await registerMutation({ eventId: eventId as any });
        toast({ title: 'Registered! 🎉' });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Registration Failed', description: e.message || "Please try again", variant: 'destructive' });
    } finally {
      setRegistering(false);
    }
  };

  if (event === undefined) return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
  if (event === null) return <div className="flex items-center justify-center min-h-screen text-white">Event Not Found</div>;

  const isRegistered = !!registration;
  const isOrganizer = user && (user._id === event.organizerId || user.role === 'admin');
  const capacityPercent = event.capacity > 0 ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 0;
  const isFull = event.registeredCount >= event.capacity;

  const locationDisplay = typeof event.location === 'string'
    ? event.location
    : event.location?.venue
      ? (typeof event.location.venue === 'string' ? event.location.venue : event.location.venue?.name ?? '')
      : '';

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="h-[300px] bg-gradient-to-br from-cyan-900/50 to-purple-900/50 relative">
        <div className="absolute top-4 left-4"><Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></div>
        {isOrganizer && (
          <div className="absolute top-4 right-4">
            <Button variant="outline" asChild className="border-white/20 hover:bg-white/10">
              <Link href={`/events/${eventId}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit Event</Link>
            </Button>
          </div>
        )}
      </div>
      <div className="container -mt-20 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">{event.category}</Badge>
                  <Badge variant="outline" className="border-white/20 text-gray-300">{event.type}</Badge>
                  {event.status === 'cancelled' && <Badge variant="destructive">Cancelled</Badge>}
                </div>
                <h1 className="text-4xl font-bold mb-6">{event.title}</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3"><Calendar className="text-cyan-400" /> <div><p className="text-xs text-gray-400">Date</p><p className="font-medium">{new Date(event.startDate).toLocaleDateString()}</p></div></div>
                  {locationDisplay && (
                    <div className="flex items-center gap-3"><MapPin className="text-cyan-400" /> <div><p className="text-xs text-gray-400">Location</p><p className="font-medium">{locationDisplay}</p></div></div>
                  )}
                  <div className="flex items-center gap-3"><Users className="text-cyan-400" /> <div><p className="text-xs text-gray-400">Attendees</p><p className="font-medium">{event.registeredCount} / {event.capacity}</p></div></div>
                </div>

                {/* Capacity Progress */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Capacity</span>
                    <span className={cn("font-medium", isFull ? "text-red-400" : capacityPercent > 80 ? "text-amber-400" : "text-cyan-400")}>
                      {isFull ? 'Sold Out' : `${event.capacity - event.registeredCount} spots left`}
                    </span>
                  </div>
                  <Progress value={capacityPercent} className="h-2" />
                </div>

                <EventReactions eventId={event._id} />

                <div className="mt-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-white/5 border-white/10 text-white p-1 mb-6">
                      <TabsTrigger value="about" className="data-[state=active]:bg-cyan-600">About</TabsTrigger>
                      <TabsTrigger value="agenda" className="data-[state=active]:bg-cyan-600">Agenda</TabsTrigger>
                      <TabsTrigger value="discussion" className="data-[state=active]:bg-cyan-600 flex items-center gap-2">
                        Discussion
                        <Badge variant="secondary" className="h-4 p-0 px-1 text-[8px] bg-white/10 text-gray-400">NEW</Badge>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="about" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <h3 className="font-bold mb-4">About the Event</h3>
                      <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{event.description}</p>
                    </TabsContent>

                    <TabsContent value="agenda" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      {event.agenda && Array.isArray(event.agenda) && event.agenda.length > 0 ? (
                        <div className="space-y-3">
                          {event.agenda.map((item: any, i: number) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors">
                              {item.startTime && (
                                <div className="flex items-center gap-1.5 text-sm text-cyan-400 font-mono shrink-0 pt-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {item.startTime}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-lg">{item.title}</p>
                                {item.speaker && <p className="text-xs text-cyan-400/70 mt-0.5">By {item.speaker}</p>}
                                {item.description && <p className="text-sm text-gray-400 mt-2">{item.description}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-gray-500 italic">No agenda items listed yet.</div>
                      )}
                    </TabsContent>

                    <TabsContent value="discussion">
                      <EventDiscussionBoard eventId={event._id} />
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold">{event.isPaid ? `$${event.price}` : 'Free'}</p>
                </div>
                {/* Capacity mini bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>{event.registeredCount} registered</span>
                    <span>{event.capacity} max</span>
                  </div>
                  <Progress value={capacityPercent} className="h-1.5" />
                </div>
                <Button className="w-full" size="lg" onClick={handleRegister} disabled={registering || isRegistered || isFull || event.status === 'cancelled'}>
                  {registering ? <Loader2 className="animate-spin" /> : isRegistered ? <CheckCircle className="mr-2" /> : <Ticket className="mr-2" />}
                  {isRegistered ? 'Registered' : isFull ? 'Sold Out' : 'Register Now'}
                </Button>
                {event.waitlistEnabled && isFull && !isRegistered && (
                  <p className="text-xs text-center text-gray-400 mt-2">You&apos;ll be added to the waitlist</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      {showChatbot ? (
        <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96">
          <EventChatbot 
            event={{
              id: event._id,
              title: event.title,
              description: event.description,
              date: new Date(event.startDate).toLocaleDateString(),
              location: typeof event.location === 'string' ? event.location : event.location?.venue?.name,
              category: event.category,
              agenda: event.agenda,
            } as any}
            onClose={() => setShowChatbot(false)}
          />
        </div>
      ) : (
        <ChatbotTrigger onClick={() => setShowChatbot(true)} />
      )}
    </div>
  );
}