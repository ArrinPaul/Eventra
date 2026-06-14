'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Sparkles,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  Terminal
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ChatbotTrigger, EventChatbot } from '@/features/ai/event-chatbot';
import { Progress } from '@/components/ui/progress';
import { EventDiscussionBoard } from './event-discussion-board';
import { EventReactions } from './event-reactions';
import { EventGallery } from './event-gallery';
import { EventPolls } from './event-polls';
import { AnnouncementBanner } from './announcement-banner';
import { generateEventSummary } from '@/app/actions/event-insights';
import { registerForEvent, getRegistrationStatus } from '@/app/actions/registrations';
import { cloneEvent } from '@/app/actions/events';
import { format } from 'date-fns';

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
        toast({ title: 'Successfully Synced', description: (result as any).ticketNumber ? `Pass ID: ${(result as any).ticketNumber}` : 'Added to waitlist.' });        
        const status = await getRegistrationStatus(eventId);
        setRegistration(status);
      } else {
        toast({ title: 'Sync Status', description: result.error || 'Connection failed.' });
      }
    } catch (e: any) {
      toast({ title: 'Sync Failed', variant: 'destructive' });
    } finally {
      setRegistering(false);
    }
  };

  const handleClone = async () => {
    setCloning(true);
    try {
      const result = await cloneEvent(eventId);
      if (result.success && result.id) {
        toast({ title: 'Node Cloned', description: 'Redirecting to new deployment.' });
        router.push(`/events/${result.id}/edit`);
      }
    } catch (e) {
      toast({ title: 'Clone Failed', variant: 'destructive' });
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
        toast({ title: 'AI Summary Ready' });
      }
    } catch (e) {
      toast({ title: 'Analysis Failed', variant: 'destructive' });
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (!event) return null;

  const isRegistered = !!registration;
  const isOrganizer = user && (user.id === event.organizerId || user.role === 'admin');
  const capacityPercent = event.capacity > 0 ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 0;
  const isFull = event.registeredCount >= event.capacity;

  const locationDisplay = typeof event.location === 'string' 
    ? event.location 
    : event.location?.venue || 'Virtual Mesh';

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-40 overflow-x-hidden">
      {/* PREMIUM HERO */}
      <div className="relative h-[50vh] md:h-[65vh] overflow-hidden bg-zinc-100 dark:bg-zinc-900 border-b border-notion-hairline">
        {event.imageUrl ? (
           <Image src={event.imageUrl} alt={event.title} fill className="object-cover" priority />
        ) : (
           <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
              <Sparkles className="w-24 h-24 text-white/5" />
           </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-transparent to-transparent" />
        
        {/* TOP OVERLAY NAVIGATION */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-30">
          <Button variant="outline" onClick={() => router.back()} className="rounded-xl h-11 px-5 bg-white/80 dark:bg-black/40 backdrop-blur-md border-notion-hairline font-bold text-xs shadow-sm">
            <ArrowLeft className="mr-2.5 h-4 w-4" /> Return
          </Button>

          {isOrganizer && (
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleClone} disabled={cloning} className="rounded-xl h-11 px-5 bg-white/80 dark:bg-black/40 backdrop-blur-md border-notion-hairline font-bold text-xs shadow-sm">
                {cloning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />} Clone
              </Button>
              <Button asChild className="rounded-xl h-11 px-6 font-black uppercase tracking-widest text-[10px] shadow-notion-elevated">
                <Link href={`/events/${eventId}/edit`}><Edit className="mr-2.5 h-4 w-4" /> Edit Event</Link>
              </Button>
            </div>
          )}
        </div>

        {/* HERO TITLE BLOCK */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 md:pb-16 z-20">
          <div className="max-w-6xl mx-auto space-y-6">
             <div className="flex items-center gap-3">
                <Badge className="bg-primary text-primary-foreground border-none rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                   {event.category}
                </Badge>
                <Badge variant="outline" className="bg-white/40 dark:bg-black/20 backdrop-blur-md border-white/20 text-foreground rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest">
                   {event.type}
                </Badge>
             </div>
             <h1 className="text-4xl md:text-7xl font-display font-bold tracking-tighter leading-[1.1] text-notion-ink max-w-4xl uppercase">
                {event.title}
             </h1>
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 -mt-8 relative z-30">
        <div className="grid lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-8 space-y-12">
            <AnnouncementBanner eventId={event.id} />

            {/* INFO CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { l: "Schedule", v: format(new Date(event.startDate), 'MMM do, yyyy'), i: Calendar },
                { l: "Coordinate", v: locationDisplay, i: MapPin },
                { l: "Network", v: `${event.registeredCount} / ${event.capacity} Syncs`, i: Users }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-notion-hairline shadow-notion-soft flex flex-col gap-4">
                   <div className="w-10 h-10 rounded-xl bg-notion-canvas-soft flex items-center justify-center text-primary border border-notion-hairline shadow-inner">
                      <item.i className="w-5 h-5" />
                   </div>
                   <div className="space-y-0.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-notion-ink-faint">{item.l}</p>
                      <p className="text-sm font-bold text-notion-ink truncate">{item.v}</p>
                   </div>
                </div>
              ))}
            </div>

            {/* TABS */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
               <TabsList className="bg-transparent border-b border-notion-hairline w-full justify-start rounded-none h-auto p-0 gap-10 mb-10">
                  {['about', 'agenda', 'discussion', 'media'].map((tab) => (
                    <TabsTrigger key={tab} value={tab} className="bg-transparent border-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-notion-ink-faint font-black uppercase tracking-widest text-[10px] pb-4 px-0 transition-all uppercase">
                      {tab}
                    </TabsTrigger>
                  ))}
               </TabsList>

               <TabsContent value="about" className="space-y-10 focus:outline-none">
                  {event.summary && (
                    <div className="p-8 bg-notion-primary/5 border border-notion-primary/10 rounded-3xl space-y-5 relative overflow-hidden group/sum">
                      <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform duration-1000"><Sparkles size={120} /></div>
                      <h3 className="text-lg font-bold flex items-center gap-2.5 text-notion-primary">
                        <Terminal size={18} /> AI Analysis_Brief
                      </h3>
                      <p className="text-base leading-relaxed font-medium text-notion-ink-secondary italic">"{event.summary}"</p>
                    </div>
                  )}
                  
                  <div className="space-y-6">
                     <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold tracking-tight text-notion-ink">Description</h3>
                        {isOrganizer && !event.summary && (
                          <Button variant="outline" size="sm" onClick={handleGenerateSummary} disabled={generatingSummary} className="rounded-xl border-notion-primary/20 text-primary font-black uppercase tracking-widest text-[9px] h-8">
                            {generatingSummary ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />} Analyze Intel
                          </Button>
                        )}
                     </div>
                     <p className="text-notion-ink-muted text-lg leading-loose font-medium whitespace-pre-wrap">{event.description}</p>
                  </div>
                  <EventReactions eventId={event.id} />
               </TabsContent>

               <TabsContent value="agenda">
                  <div className="grid gap-4">
                     {event.agenda && Array.isArray(event.agenda) && event.agenda.length > 0 ? (
                       event.agenda.map((item: any, i: number) => (
                         <div key={i} className="p-6 rounded-2xl bg-notion-canvas-soft/50 border border-notion-hairline hover:bg-white dark:hover:bg-zinc-900 transition-all group flex items-start gap-6">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-950 border border-notion-hairline flex items-center justify-center text-primary shrink-0 shadow-sm">
                               <Clock className="w-5 h-5" />
                            </div>
                            <div className="space-y-2">
                               <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-notion-primary uppercase tracking-widest">{item.startTime}</span>
                                  <h4 className="text-lg font-bold text-notion-ink">{item.title}</h4>
                               </div>
                               <p className="text-sm font-medium text-notion-ink-muted">{item.description}</p>
                            </div>
                         </div>
                       ))
                     ) : (
                       <div className="p-20 text-center border-2 border-dashed border-notion-hairline rounded-3xl bg-muted/5">
                          <p className="text-notion-ink-faint font-bold italic uppercase tracking-widest text-xs">Agenda sync in progress...</p>
                       </div>
                     )}
                  </div>
               </TabsContent>

               <TabsContent value="discussion">
                 <EventDiscussionBoard eventId={event.id} />
               </TabsContent>

               <TabsContent value="media">
                 <EventGallery eventId={event.id} isRegistered={isRegistered} isStaff={!!isOrganizer} />
               </TabsContent>
            </Tabs>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-8">
               <Card className="border-notion-hairline bg-white dark:bg-zinc-950 shadow-notion-elevated overflow-hidden relative rounded-[2rem] group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full -mr-16 -mt-16" />
                  <CardContent className="p-10 space-y-10 relative z-10 text-center">
                     <div className="space-y-3">
                        <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-notion-ink-faint border-notion-hairline">Enrollment Status</Badge>
                        <p className="text-5xl font-display font-black tracking-tighter italic">Free<span className="text-primary">.</span></p>
                     </div>

                     <div className="space-y-5 bg-notion-canvas-soft/80 p-6 rounded-3xl border border-notion-hairline shadow-inner">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-notion-ink-faint">
                           <span>Registration Load</span>
                           <span>{capacityPercent}%</span>
                        </div>
                        <div className="h-3 w-full bg-notion-canvas rounded-full overflow-hidden border border-notion-hairline">
                           <motion.div initial={{ width: 0 }} whileInView={{ width: `${capacityPercent}%` }} transition={{ duration: 1 }} className="h-full bg-primary" />
                        </div>
                        <p className="text-[10px] font-bold text-notion-primary uppercase tracking-widest">
                           {isFull ? "CAPACITY REACHED" : `${event.capacity - event.registeredCount} NODE SLOTS REMAINING`}
                        </p>
                     </div>

                     <Button size="xl" onClick={() => handleRegister()} disabled={registering || isRegistered || isFull || event.status === 'cancelled'} className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[11px] shadow-glow shadow-primary/20 border-none group/btn active:scale-95 transition-all">
                        {registering ? <Loader2 className="animate-spin w-5 h-5" /> : isRegistered ? (
                          <span className="flex items-center justify-center gap-3"><CheckCircle size={20} /> SYNCHRONIZED</span>
                        ) : (
                          <span className="flex items-center justify-center gap-3"><Ticket size={20} className="group-hover/btn:rotate-12 transition-transform" /> START SYNC</span>
                        )}
                     </Button>
                  </CardContent>
                  <div className="bg-notion-canvas-soft py-4 text-center border-t border-notion-hairline">
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-notion-ink-faint flex items-center justify-center gap-2">
                        <ShieldCheck size={10} /> SECURE PROTOCOL v1.0
                     </p>
                  </div>
               </Card>

               <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-14 rounded-2xl border-notion-hairline font-bold text-xs uppercase tracking-widest hover:bg-white group shadow-sm transition-all">
                    <Share2 className="mr-3 h-4 w-4 text-notion-ink-faint group-hover:text-primary transition-colors" /> Broadcast
                  </Button>
                  <Button variant="outline" className="h-14 rounded-2xl border-notion-hairline font-bold text-xs uppercase tracking-widest hover:bg-white group shadow-sm transition-all">
                    <Heart className="mr-3 h-4 w-4 text-notion-ink-faint group-hover:text-red-500 transition-colors" /> Save
                  </Button>
               </div>
            </div>
          </div>
        </div>
      </div>

      {showChatbot ? (
        <div className="fixed bottom-10 right-10 z-50 w-[420px] shadow-2xl animate-in slide-in-from-right-10 duration-500">
          <EventChatbot 
            event={{
              id: event.id, title: event.title, description: event.description,
              date: new Date(event.startDate).toLocaleDateString(), location: locationDisplay,
              category: event.category, agenda: event.agenda,
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
