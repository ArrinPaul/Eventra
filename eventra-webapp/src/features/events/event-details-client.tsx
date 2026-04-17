'use client';

import React, { useState, useEffect } from 'react';
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
  Copy,
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { EventChatbot, ChatbotTrigger } from '@/features/ai/event-chatbot';
import { Progress } from '@/components/ui/progress';
import { createCheckoutSession } from '@/app/actions/payments';
import { EventDiscussionBoard } from './event-discussion-board';
import { EventReactions } from './event-reactions';
import { EventGallery } from './event-gallery';
import { EventPolls } from './event-polls';
import { AnnouncementBanner } from './announcement-banner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tag } from 'lucide-react';

import { generateEventSummary } from '@/app/actions/event-insights';
import { Sparkles, MessageSquare } from 'lucide-react';

import { registerForEvent, getRegistrationStatus } from '@/app/actions/registrations';
import { updateEvent, cloneEvent } from '@/app/actions/events';

export default function EventDetailsClient({ eventId, initialEvent }: { eventId: string, initialEvent: any }) {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState(initialEvent);
  const [registration, setRegistration] = useState<any>(null);
  
  const [registering, setRegistering] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [showTierSelection, setShowTierSelection] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      if (user) {
        const status = await getRegistrationStatus(eventId);
        setRegistration(status);
      }
    }
    loadStatus();
  }, [eventId, user]);

  const handleRegister = async (tierId?: string) => {
    if (!user) {
      router.push(`/login?callbackUrl=/events/${eventId}`);
      return;
    }
    
    setRegistering(true);
    try {
      const result = await registerForEvent(eventId, { tierId });
      if (result.success) {
        if ((result as any).ticketNumber) {
          toast({ title: 'Registered! 🎉', description: `Your ticket number is ${(result as any).ticketNumber}` });
        } else {
          toast({ title: 'Waitlist Joined', description: `You are at position ${(result as any).position}` });
        }
        const status = await getRegistrationStatus(eventId);
        setRegistration(status);
      } else {
        toast({ title: 'Status', description: result.message, variant: 'default' });
      }
    } catch (e: any) {
      toast({ title: 'Registration Failed', description: e.message, variant: 'destructive' });
    } finally {
      setRegistering(false);
    }
  };

  const handleClone = async () => {
    setCloning(true);
    try {
      const newId = await cloneEvent(eventId);
      toast({ title: 'Event cloned successfully!', description: 'Redirecting to the new event editor.' });
      router.push(`/events/${newId}/edit`);
    } catch (e: any) {
      toast({ title: 'Clone failed', description: e.message, variant: 'destructive' });
    } finally {
      setCloning(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const result = await generateEventSummary(eventId);
      if (result.success) {
        setEvent({ ...event, summary: result.summary });
        toast({ title: 'Summary generated!', description: 'AI has analyzed the event details.' });
      }
    } catch (e: any) {
      toast({ title: 'Failed to generate summary', description: e.message, variant: 'destructive' });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleApplyDiscount = async () => {
    setIsValidatingDiscount(true);
    try {
      // Mock discount validation for now as per current Phase 1 status
      if (discountCode.toLowerCase() === 'welcome10') {
        setAppliedDiscount({ type: 'percentage', value: 10 });
        toast({ title: 'Code applied!', description: '10% discount has been applied to your ticket.' });
      } else {
        toast({ title: 'Invalid code', description: 'This promo code is not valid or has expired.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: 'Could not validate discount code.', variant: 'destructive' });
    } finally {
      setIsValidatingDiscount(false);
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
    <div className="min-h-screen bg-background text-white pb-20">
      <div className="h-[300px] bg-gradient-to-br from-primary/50 to-purple-900/50 relative">
        <div className="absolute top-4 left-4"><Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></div>
        {isOrganizer && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button 
              variant="outline" 
              className="border-border hover:bg-muted"
              onClick={handleClone}
              disabled={cloning}
            >
              {cloning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
              Clone
            </Button>
            <Button variant="outline" asChild className="border-border hover:bg-muted">
              <Link href={`/events/${eventId}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit Event</Link>
            </Button>
          </div>
        )}
      </div>
      <div className="container -mt-20 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <AnnouncementBanner eventId={event.id} />
            <Card className="bg-muted/40 border-border text-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-primary/20 text-primary border-primary/30">{event.category}</Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">{event.type}</Badge>
                  {event.status === 'cancelled' && <Badge variant="destructive">Cancelled</Badge>}
                </div>
                <h1 className="text-4xl font-bold mb-6">{event.title}</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3"><Calendar className="text-primary" /> <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{new Date(event.startDate).toLocaleDateString()}</p></div></div>
                  {locationDisplay && (
                    <div className="flex items-center gap-3"><MapPin className="text-primary" /> <div><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{locationDisplay}</p></div></div>
                  )}
                  <div className="flex items-center gap-3"><Users className="text-primary" /> <div><p className="text-xs text-muted-foreground">Attendees</p><p className="font-medium">{event.registeredCount} / {event.capacity}</p></div></div>
                </div>

                {/* Capacity Progress */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className={cn("font-medium", isFull ? "text-red-400" : capacityPercent > 80 ? "text-amber-400" : "text-primary")}>
                      {isFull ? 'Sold Out' : `${event.capacity - event.registeredCount} spots left`}
                    </span>
                  </div>
                  <Progress value={capacityPercent} className="h-2" />
                </div>

                <EventReactions eventId={event.id} />

                <div className="mt-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-muted/40 border-border text-white p-1 mb-6">
                      <TabsTrigger value="about" className="data-[state=active]:bg-primary">About</TabsTrigger>
                      <TabsTrigger value="agenda" className="data-[state=active]:bg-primary">Agenda</TabsTrigger>
                      <TabsTrigger value="discussion" className="data-[state=active]:bg-primary flex items-center gap-2">
                        Discussion
                        <Badge variant="secondary" className="h-4 p-0 px-1 text-[8px] bg-muted text-muted-foreground">NEW</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="photos" className="data-[state=active]:bg-primary">Photos</TabsTrigger>
                      <TabsTrigger value="polls" className="data-[state=active]:bg-primary flex items-center gap-2">
                        Polls
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="about" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      {event.summary && (
                        <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl space-y-4">
                          <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                            <Sparkles className="h-5 w-5" />
                            Event Summary
                          </h3>
                          <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {event.summary}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold">About the Event</h3>
                        {isOrganizer && (new Date().getTime() > event.endDate) && !event.summary && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-primary/30 text-primary hover:bg-primary/10"
                            onClick={handleGenerateSummary}
                            disabled={generatingSummary}
                          >
                            {generatingSummary ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            Generate AI Summary
                          </Button>
                        )}
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{event.description}</p>
                    </TabsContent>

                    <TabsContent value="agenda" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      {event.agenda && Array.isArray(event.agenda) && event.agenda.length > 0 ? (
                        <div className="space-y-3">
                          {event.agenda.map((item: any, i: number) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-muted/40 border border-border hover:border-primary/30 transition-colors">
                              {item.startTime && (
                                <div className="flex items-center gap-1.5 text-sm text-primary font-mono shrink-0 pt-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {item.startTime}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-lg">{item.title}</p>
                                {item.speaker && <p className="text-xs text-primary/70 mt-0.5">By {item.speaker}</p>}
                                {item.description && <p className="text-sm text-muted-foreground mt-2">{item.description}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-muted-foreground italic">No agenda items listed yet.</div>
                      )}
                    </TabsContent>

                    <TabsContent value="discussion">
                      <EventDiscussionBoard eventId={event.id} />
                    </TabsContent>

                    <TabsContent value="photos">
                      <EventGallery eventId={event.id} isRegistered={isRegistered} isStaff={!!isOrganizer} />
                    </TabsContent>

                    <TabsContent value="polls">
                      <EventPolls eventId={event.id} isOrganizer={!!isOrganizer} />
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="bg-muted/40 border-border text-white">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold">
                    {appliedDiscount ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="line-through text-muted-foreground text-xl">
                          ${event.price}
                        </span>
                        <span className="text-green-400">
                          ${Math.max(0, (event.price || 0) - (appliedDiscount.type === 'percentage' ? ((event.price || 0) * appliedDiscount.value / 100) : appliedDiscount.value))}
                        </span>
                      </span>
                    ) : (
                      event.isPaid ? `$${event.price}` : 'Free'
                    )}
                  </p>
                </div>

                {/* Discount Code Input */}
                {event.isPaid && !isRegistered && (
                  <div className="mb-4 space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input 
                          placeholder="Promo code" 
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          className="pl-8 h-9 text-xs bg-muted/40 border-border"
                        />
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-9 border-border"
                        onClick={handleApplyDiscount}
                        disabled={!discountCode || registering}
                      >
                        Apply
                      </Button>
                    </div>
                    {appliedDiscount && (
                      <p className="text-[10px] text-green-400 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Code applied successfully!
                      </p>
                    )}
                  </div>
                )}

                {/* Capacity mini bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{event.registeredCount} registered</span>
                    <span>{event.capacity} max</span>
                  </div>
                  <Progress value={capacityPercent} className="h-1.5" />
                </div>
                <Button className="w-full" size="lg" onClick={() => handleRegister()} disabled={registering || isRegistered || isFull || event.status === 'cancelled'}>
                  {registering ? <Loader2 className="animate-spin" /> : isRegistered ? <CheckCircle className="mr-2" /> : <Ticket className="mr-2" />}
                  {isRegistered ? 'Registered' : isFull ? 'Sold Out' : 'Register Now'}
                </Button>
                {isRegistered && (new Date().getTime() > event.startDate) && (
                  <Button variant="outline" className="w-full mt-3 border-primary/30 text-primary hover:bg-primary/10" asChild>
                    <Link href={`/events/${eventId}/feedback`}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Give Feedback
                    </Link>
                  </Button>
                )}
                {event.waitlistEnabled && isFull && !isRegistered && (
                  <p className="text-xs text-center text-muted-foreground mt-2">You&apos;ll be added to the waitlist</p>
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

                    id: event.id,

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

      

            {/* Tier Selection Dialog */}

            <Dialog open={showTierSelection} onOpenChange={setShowTierSelection}>

              <DialogContent className="bg-card border-border text-white max-w-md">

                <DialogHeader>

                  <DialogTitle>Select Ticket Tier</DialogTitle>

                  <DialogDescription className="text-muted-foreground">

                    Choose the best option for your experience.

                  </DialogDescription>

                </DialogHeader>

                                <div className="space-y-3 py-4">

                                  {/* Discount input inside dialog if not already applied */}

                                  {!appliedDiscount && (

                                     <div className="flex gap-2 mb-4">

                                      <Input 

                                        placeholder="Enter promo code" 

                                        value={discountCode}

                                        onChange={(e) => setDiscountCode(e.target.value)}

                                        className="bg-muted/40 border-border"

                                      />

                                      <Button onClick={handleApplyDiscount} variant="outline">Apply</Button>

                                    </div>

                                  )}

                                  {appliedDiscount && (

                                    <div className="bg-green-500/10 border border-green-500/20 p-2 rounded-lg flex justify-between items-center mb-4">

                                      <p className="text-xs text-green-400 flex items-center gap-1">

                                        <Tag className="h-3 w-3" /> Code <strong>{discountCode.toUpperCase()}</strong> applied

                                      </p>

                                      <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => {setAppliedDiscount(null); setDiscountCode('');}}>Remove</Button>

                                    </div>

                                  )}

                

                                  {event.ticketTiers?.map((tier: any) => {

                                    const isTierFull = tier.registeredCount >= tier.capacity;

                                    

                                    let finalTierPrice = tier.price;

                                    if (appliedDiscount && tier.price > 0) {

                                      const discount = appliedDiscount.type === 'percentage' 

                                        ? (tier.price * appliedDiscount.value / 100) 

                                        : appliedDiscount.value;

                                      finalTierPrice = Math.max(0, tier.price - discount);

                                    }

                

                                    return (

                                      <button

                                        key={tier.name}

                                        disabled={isTierFull}

                                        onClick={() => handleRegister(tier.name)}

                                        className={cn(

                                          "w-full p-4 rounded-xl border transition-all text-left flex justify-between items-center group",

                                          isTierFull 

                                            ? "bg-muted/40 border-border/60 opacity-50 cursor-not-allowed" 

                                            : "bg-muted/40 border-border hover:border-primary/50 hover:bg-white/[0.08]"

                                        )}

                                      >

                                        <div className="flex-1">

                                          <div className="flex items-center gap-2">

                                            <p className="font-bold text-lg">{tier.name}</p>

                                            {isTierFull && <Badge variant="destructive" className="text-[8px] h-4">SOLD OUT</Badge>}

                                          </div>

                                          {tier.description && <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>}

                                          <p className="text-[10px] text-muted-foreground mt-2">{tier.capacity - tier.registeredCount} spots remaining</p>

                                        </div>

                                        <div className="text-right ml-4">

                                          <p className="text-xl font-black text-primary">

                                            {appliedDiscount && tier.price > 0 ? (

                                              <span className="flex flex-col items-end">

                                                <span className="text-[10px] line-through text-muted-foreground">${tier.price}</span>

                                                <span>{finalTierPrice > 0 ? `${finalTierPrice}` : 'FREE'}</span>

                                              </span>

                                            ) : (

                                              tier.price > 0 ? `${tier.price}` : 'FREE'

                                            )}

                                          </p>

                                        </div>

                                      </button>

                                    );

                                  })}

                                </div>

              </DialogContent>

            </Dialog>

          </div>

        );

      }

      

