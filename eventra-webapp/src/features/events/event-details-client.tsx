'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
  const { user } = useAuth();
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
        toast({
          title: 'Registration Status',
          description: (result as any).error || (result as any).message || 'Registration could not be completed',
          variant: 'default',
        });
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
      const cloneResult = await cloneEvent(eventId);
      if (!cloneResult.success || !cloneResult.id) {
        toast({
          title: 'Clone failed',
          description: cloneResult.error || 'Could not clone this event',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Event cloned successfully!', description: 'Redirecting to the new event editor.' });
      router.push(`/events/${cloneResult.id}/edit`);
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

  if (event === undefined) return <div className="flex items-center justify-center min-h-screen text-foreground font-black uppercase tracking-[0.3em]">Initializing Node...</div>;
  if (event === null) return <div className="flex items-center justify-center min-h-screen text-foreground font-display font-bold text-2xl">Event Not Found</div>;

  const isRegistered = !!registration;
  const isOrganizer = user && (user.id === event.organizerId || user.role === 'admin');
  const capacityPercent = event.capacity > 0 ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 0;
  const isFull = event.registeredCount >= event.capacity;

  const locationDisplay = typeof event.location === 'string'
    ? event.location
    : event.location?.venue
      ? (typeof event.location.venue === 'string' ? event.location.venue : event.location.venue?.name ?? '')
      : '';

  return (
    <div className="min-h-screen bg-background text-foreground pb-40">
      {/* IMPACT HEADER */}
      <div className="relative h-[450px] md:h-[600px] overflow-hidden">
        {event.imageUrl ? (
           <Image 
             src={event.imageUrl} 
             alt={event.title} 
             fill 
             className="object-cover"
             priority
           />
        ) : (
           <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
              <Sparkles className="w-32 h-32 text-primary/5" />
           </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute top-8 left-8 flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="rounded-xl h-12 px-6 bg-background/50 backdrop-blur-md border-border/40 font-bold uppercase tracking-widest text-[10px] hover:bg-background transition-all"
          >
            <ArrowLeft className="mr-3 h-4 w-4" /> Back to Network
          </Button>
        </div>

        {isOrganizer && (
          <div className="absolute top-8 right-8 flex items-center gap-3">
            <Button 
              variant="outline" 
              className="rounded-xl h-12 px-6 bg-background/50 backdrop-blur-md border-border/40 font-bold uppercase tracking-widest text-[10px] hover:bg-background transition-all"
              onClick={handleClone}
              disabled={cloning}
            >
              {cloning ? <Loader2 className="mr-3 h-4 w-4 animate-spin" /> : <Copy className="mr-3 h-4 w-4" />}
              Clone Node
            </Button>
            <Button 
              asChild 
              className="rounded-xl h-12 px-6 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-glow shadow-primary/20 border-none transition-all"
            >
              <Link href={`/events/${eventId}/edit`}><Edit className="mr-3 h-4 w-4" /> Edit Mission</Link>
            </Button>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-7xl mx-auto space-y-6">
             <div className="flex items-center gap-3">
                <Badge className="bg-primary text-primary-foreground border-none rounded-full px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]">
                   {event.category}
                </Badge>
                <Badge variant="outline" className="bg-background/40 backdrop-blur-md border-border/40 text-foreground rounded-full px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]">
                   {event.type}
                </Badge>
                {event.status === 'cancelled' && (
                  <Badge variant="destructive" className="rounded-full px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]">
                    Terminated
                  </Badge>
                )}
             </div>
             <h1 className="text-5xl md:text-8xl font-display font-bold tracking-tighter leading-none text-foreground max-w-4xl">
                {event.title}
             </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-10 relative z-20">
        <div className="grid lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-16">
            <AnnouncementBanner eventId={event.id} />

            {/* QUICK INFO BAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 rounded-[2.5rem] bg-background border border-border/80 shadow-2xl">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mb-1">Timeline</p>
                   <p className="text-lg font-bold">{new Date(event.startDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              {locationDisplay && (
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mb-1">Coordinate</p>
                     <p className="text-lg font-bold truncate max-w-[200px]">{locationDisplay}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mb-1">Network Capacity</p>
                   <p className="text-lg font-bold">{event.registeredCount} / {event.capacity}</p>
                </div>
              </div>
            </div>

            {/* TABS INTERFACE */}
            <div className="space-y-12">
               <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 gap-10 mb-12">
                     {['about', 'agenda', 'discussion', 'photos', 'polls'].map((tab) => (
                       <TabsTrigger 
                         key={tab} 
                         value={tab}
                         className="bg-transparent border-none rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground font-black uppercase tracking-[0.2em] text-[11px] pb-4 px-0 transition-all"
                       >
                         {tab}
                         {tab === 'discussion' && <Badge className="ml-2 h-4 p-0 px-1.5 text-[8px] bg-primary text-primary-foreground rounded-full">LIVE</Badge>}
                       </TabsTrigger>
                     ))}
                  </TabsList>

                  <TabsContent value="about" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     {event.summary && (
                       <div className="p-10 bg-primary/[0.03] border border-primary/10 rounded-[2.5rem] space-y-6">
                         <h3 className="text-xl font-display font-bold flex items-center gap-3 text-primary">
                           <Sparkles className="h-6 w-6" />
                           Neural Summary
                         </h3>
                         <div className="text-foreground/80 text-lg leading-relaxed font-medium">
                           {event.summary}
                         </div>
                       </div>
                     )}
                     
                     <div className="space-y-6">
                        <div className="flex justify-between items-center">
                           <h3 className="text-3xl font-display font-bold tracking-tight">Mission Briefing</h3>
                           {isOrganizer && !event.summary && (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="rounded-xl border-primary/20 text-primary font-black uppercase tracking-widest text-[9px] hover:bg-primary/5 transition-all"
                               onClick={handleGenerateSummary}
                               disabled={generatingSummary}
                             >
                               {generatingSummary ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                               Generate AI Intel
                             </Button>
                           )}
                        </div>
                        <p className="text-muted-foreground text-lg leading-loose font-medium whitespace-pre-wrap">{event.description}</p>
                     </div>
                     <EventReactions eventId={event.id} />
                  </TabsContent>

                  <TabsContent value="agenda" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     {event.agenda && Array.isArray(event.agenda) && event.agenda.length > 0 ? (
                       <div className="grid gap-6">
                         {event.agenda.map((item: any, i: number) => (
                           <div key={i} className="flex gap-8 p-8 rounded-[2rem] bg-background border border-border/80 hover:border-primary/30 transition-all group">
                             {item.startTime && (
                               <div className="flex flex-col items-center gap-2 shrink-0 pt-2">
                                 <Clock className="h-5 w-5 text-primary" />
                                 <span className="text-xs font-black tracking-widest text-muted-foreground">{item.startTime}</span>
                               </div>
                             )}
                             <div className="space-y-3">
                               <p className="text-2xl font-display font-bold tracking-tight group-hover:text-primary transition-colors">{item.title}</p>
                               {item.speaker && (
                                  <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-black uppercase">
                                        {item.speaker[0]}
                                     </div>
                                     <p className="text-sm font-bold text-muted-foreground">Expert: {item.speaker}</p>
                                  </div>
                               )}
                               {item.description && <p className="text-muted-foreground font-medium leading-relaxed">{item.description}</p>}
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center py-20 bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-border">
                          <p className="text-muted-foreground font-medium italic">Mission timeline is currently being finalized.</p>
                       </div>
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
          </div>

          {/* SIDEBAR REGISTRATION CARD */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-10">
               <Card className="p-10 space-y-10 border-none shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[80px] rounded-full -mr-24 -mt-24 group-hover:bg-primary/10 transition-colors duration-700" />
                  <div className="relative z-10 space-y-10">
                     <div className="text-center space-y-3">
                        <Badge variant="outline" className="rounded-full px-5 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 border-primary/20">Mission Access</Badge>
                        <p className="text-6xl font-display font-bold tracking-tighter italic">Free.</p>
                     </div>

                     <div className="space-y-6 bg-muted/20 p-6 rounded-[2rem] border border-border/40 shadow-inner">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">
                          <span className="flex items-center gap-2"><Users size={12} className="text-primary" /> {event.registeredCount} Syncs</span>
                          <span>{event.capacity} Max Node</span>
                        </div>
                        <Progress value={capacityPercent} className="h-4 rounded-full bg-background border border-border/20" />
                        <p className={cn(
                           "text-center text-xs font-black uppercase tracking-widest",
                           isFull ? "text-red-500" : capacityPercent > 80 ? "text-amber-500" : "text-emerald-500"
                        )}>
                           {isFull ? 'Critical Load: Full' : `Protocol: ${event.capacity - event.registeredCount} Slots Available`}
                        </p>
                     </div>

                     <Button 
                        size="xl"
                        className="w-full h-20 rounded-[2rem] bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm shadow-glow shadow-primary/20 border-none transition-all active:scale-95 group/btn" 
                        onClick={() => handleRegister()} 
                        disabled={registering || isRegistered || isFull || event.status === 'cancelled'}
                     >
                        {registering ? (
                          <Loader2 className="animate-spin w-6 h-6" />
                        ) : isRegistered ? (
                          <div className="flex items-center gap-3">
                             <CheckCircle className="w-6 h-6" />
                             <span>Node Synchronized</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                             <Ticket className="w-6 h-6 group-hover/btn:rotate-12 transition-transform" />
                             <span>Initialize Sync</span>
                          </div>
                        )}
                     </Button>

                     {isRegistered && (new Date().getTime() > event.startDate) && (
                       <Button 
                         variant="outline" 
                         size="lg"
                         className="w-full h-16 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] hover:bg-muted" 
                         asChild
                       >
                         <Link href={`/events/${eventId}/feedback`}>
                           <MessageSquare className="mr-3 h-4 w-4 text-primary" /> Transmit Experience Intel
                         </Link>
                       </Button>
                     )}
                  </div>
                  
                  <div className="bg-muted/30 p-6 text-center border-t border-border/40 -mx-10 -mb-10 mt-10">
                     <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                        Secure_Node_Auth_Protocol v0.1
                     </p>
                  </div>
               </Card>

               {/* Share / Actions */}
               <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" size="lg" className="rounded-2xl h-16 border-2 font-black uppercase tracking-widest text-[10px] hover:bg-muted hover:border-primary/30 transition-all group">
                     <Share2 className="mr-3 h-4 w-4 text-primary group-hover:scale-110 transition-transform" /> Broadcast
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-2xl h-16 border-2 font-black uppercase tracking-widest text-[10px] hover:bg-muted hover:border-primary/30 transition-all group">
                     <Heart className="mr-3 h-4 w-4 text-primary group-hover:scale-110 transition-transform" /> Archive
                  </Button>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      {showChatbot ? (
        <div className="fixed bottom-10 right-10 z-50 w-80 md:w-[450px] shadow-3xl">
          <EventChatbot 
            event={{
              id: event.id,
              title: event.title,
              description: event.description,
              date: new Date(event.startDate).toLocaleDateString(),
              location: locationDisplay,
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
