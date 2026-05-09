'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/core/utils/utils';
import {
  Plus, Calendar, Users, Ticket, ArrowUpRight, Search,
  Loader2, Trash2, Edit, Copy, BrainCircuit, ChevronRight,
  Award, MessageSquare, Clock, Activity, DollarSign, Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueDashboard } from '@/features/organizer/revenue-dashboard';
import { useRouter } from 'next/navigation';
import { getEvents, deleteEvent, cloneEvent } from '@/app/actions/events';
import type { EventraEvent } from '@/types';
import { EmptyState } from '@/components/shared/empty-state';
import { motion } from 'framer-motion';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [managedEvents, setManagedEvents] = useState<EventraEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('events');
  const [isCloning, setIsCloning] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getEvents({
        organizerId: user.id,
        status: 'published'
      });
      setManagedEvents(data as any);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load events.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredEvents = managedEvents.filter((e: EventraEvent) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const result = await deleteEvent(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete event.');
      }
      toast({ title: 'Event deleted' });
      loadData();
    } catch (e) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleClone = async (id: string) => {
    setIsCloning(id);
    try {
      const result = await cloneEvent(id);
      if (result.success) {
        toast({ title: 'Event cloned', description: 'A draft clone has been created.' });
        loadData();
      } else {
        toast({ title: 'Clone failed', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Failed to clone event', variant: 'destructive' });
    } finally {
      setIsCloning(null);
    }
  };

  const totalRegistrations = managedEvents.reduce((sum: number, e: EventraEvent) => sum + (e.registeredCount || 0), 0);
  const activeEvents = managedEvents.filter((e: EventraEvent) => e.status === 'published').length;
  const totalRevenue = managedEvents.reduce((sum: number, e: EventraEvent) => sum + (e.isPaid ? Number(e.price || 0) * (e.registeredCount || 0) : 0), 0);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse">Loading command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-foreground tracking-tighter">Organizer Command Center</h1>
          <p className="text-lg text-muted-foreground font-medium">Empowering your experience delivery</p>
        </div>
        <Button asChild size="lg" className="rounded-2xl px-8 shadow-glow font-black">
          <Link href="/events/create"><Plus className="mr-2 h-5 w-5" /> New Event</Link>
        </Button>
      </motion.div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Campaigns', value: managedEvents.length, sub: `${activeEvents} currently live`, icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Total Reach', value: totalRegistrations.toLocaleString(), sub: 'Attendees across all events', icon: Users, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Generated Value', value: `$${totalRevenue.toLocaleString()}`, sub: 'Verified ticketing revenue', icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <Card key={i} variant="elevated" className="border-border/50 overflow-hidden group">
            <CardContent className="p-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
              <div className="flex justify-between items-start mb-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm", stat.bg)}>
                  <stat.icon className={cn("w-7 h-7", stat.color)} />
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <Activity size={16} className="text-muted-foreground" />
                </div>
              </div>
              <p className="text-4xl font-black text-foreground leading-none mb-2 tracking-tighter">{stat.value}</p>
              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              <p className="text-xs font-bold text-muted-foreground/60 mt-4">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <div className="glass p-1.5 rounded-2xl border border-white/10 w-fit">
          <TabsList className="bg-transparent gap-1">
            {['events', 'revenue', 'insights', 'feedback', 'team'].map(tab => (
              <TabsTrigger 
                key={tab} 
                value={tab} 
                className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow capitalize"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="events" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card variant="glass" className="overflow-hidden border-white/10">
            <CardHeader className="p-8 border-b border-white/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black">Managed Experiences</CardTitle>
                  <CardDescription className="font-medium">Direct control over {managedEvents.length} distinct events</CardDescription>
                </div>
                <div className="relative w-full md:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search campaigns..."
                    className="pl-12 h-12 rounded-xl bg-background/50 border-white/10 focus-visible:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {filteredEvents.map((event: any) => (
                  <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between p-8 hover:bg-white/[0.02] transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col items-center justify-center flex-shrink-0 group-hover:border-primary/30 transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{format(event.startDate, 'MMM')}</span>
                        <span className="text-2xl font-black text-foreground leading-none">{format(event.startDate, 'dd')}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{event.title}</h3>
                          {event.organizerId !== user?.id && <Badge variant="secondary" className="text-[9px] font-black">CO-ORG</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Users size={14} className="text-primary" /> {event.registeredCount || 0} Attending</span>
                          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> {typeof event.location === 'string' ? event.location : event.location?.venue || 'Virtual'}</span>
                          <Badge variant={event.status === 'published' ? 'success' : 'muted'} className="text-[9px] px-2 py-0">
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-6 md:mt-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <Button variant="glass" size="icon" className="h-10 w-10" onClick={() => handleClone(event.id)} disabled={isCloning === event.id}>
                        {isCloning === event.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Copy size={18} />}
                      </Button>
                      <Button variant="glass" size="icon" className="h-10 w-10 text-primary" asChild><Link href={`/events/${event.id}`}><ArrowUpRight size={18} /></Link></Button>
                      <Button variant="glass" size="icon" className="h-10 w-10" asChild><Link href={`/events/${event.id}/edit`}><Edit size={18} /></Link></Button>
                      <Button variant="glass" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(event.id)}><Trash2 size={18} /></Button>
                    </div>
                  </div>
                ))}
                
                {filteredEvents.length === 0 && (
                  <div className="p-20 text-center">
                    <EmptyState
                      icon={Calendar}
                      title="No events found"
                      description="Your search didn't match any events or you haven't created any yet."
                      actionLabel="Create Your First Event"
                      actionHref="/events/create"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="animate-in fade-in slide-in-from-bottom-4 duration-500"><RevenueDashboard /></TabsContent>

        <TabsContent value="insights" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managedEvents.map(event => (
              <Card key={event.id} variant="glass" className="hover:border-primary/40 hover:shadow-neon transition-all cursor-pointer group">
                <CardHeader className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <BrainCircuit size={24} />
                    </div>
                    <Badge variant="premium">AI Ready</Badge>
                  </div>
                  <CardTitle className="text-lg font-black truncate text-foreground group-hover:text-primary transition-colors">{event.title}</CardTitle>
                  <CardDescription className="font-bold text-xs mt-2 uppercase tracking-widest">Predictive Analytics Available</CardDescription>
                </CardHeader>
                <CardFooter className="p-6 pt-0">
                  <Button variant="link" className="text-primary font-black p-0 h-auto text-sm group-hover:translate-x-1 transition-transform" asChild>
                    <Link href={`/organizer/insights/${event.id}`}>Analyze Performance <ChevronRight size={16} /></Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Simplified placeholders for other tabs to keep focus on primary UI */}
        <TabsContent value="feedback" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <Card variant="glass" className="p-12 text-center border-dashed">
             <MessageSquare className="w-12 h-12 text-primary/20 mx-auto mb-6" />
             <h3 className="text-xl font-black text-foreground mb-2">Feedback & Sentiments</h3>
             <p className="text-muted-foreground font-medium mb-8">Aggregate attendee satisfaction and NPS scores across your events.</p>
             <Button variant="outline" className="rounded-xl border-2 font-black">Configure Global Survey</Button>
           </Card>
        </TabsContent>

        <TabsContent value="team" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <Card variant="glass" className="p-12 text-center border-dashed">
             <Users className="w-12 h-12 text-primary/20 mx-auto mb-6" />
             <h3 className="text-xl font-black text-foreground mb-2">Team Management</h3>
             <p className="text-muted-foreground font-medium mb-8">Coordinate with co-organizers, staff, and volunteers in one place.</p>
             <Button variant="outline" className="rounded-xl border-2 font-black">Invite Team Member</Button>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
