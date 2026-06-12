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
  Award, MessageSquare, Clock, Activity, DollarSign, Sparkles, MapPin
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-40">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border-4 border-primary/10 border-t-primary animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Ops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-4">
           <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em]">
             Command Center
           </Badge>
           <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter leading-none">
             Mission <span className="text-primary italic">Control.</span>
           </h1>
           <p className="text-lg text-muted-foreground font-medium max-w-xl">
             Manage your active campaigns, analyze reach, and coordinate operations.
           </p>
        </div>
        <Button asChild size="lg" className="rounded-2xl h-14 px-8 bg-primary text-primary-foreground shadow-glow shadow-primary/20 font-black uppercase tracking-widest text-[11px] border-none">
          <Link href="/events/create"><Plus className="mr-3 h-4 w-4" /> New Mission</Link>
        </Button>
      </div>

      {/* KPI STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {[
          { label: 'Active Campaigns', value: managedEvents.length, sub: `${activeEvents} currently live`, icon: Calendar, color: 'text-primary' },
          { label: 'Total Reach', value: totalRegistrations.toLocaleString(), sub: 'Attendees across all nodes', icon: Users, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <Card key={i} className="p-10 group relative overflow-hidden border-none shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.02] blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="relative z-10 flex flex-col justify-between h-full space-y-12">
               <div className="flex justify-between items-start">
                  <div className={cn("w-16 h-16 rounded-2xl bg-muted flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm")}>
                    <stat.icon className={cn("w-8 h-8", stat.color)} />
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                    <Activity size={18} className="text-muted-foreground" />
                  </div>
               </div>
               <div>
                  <p className="text-6xl font-display font-bold text-foreground leading-none mb-4 tracking-tighter">{stat.value}</p>
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4 opacity-60">{stat.label}</p>
                  <p className="text-xs font-bold text-primary/60">{stat.sub}</p>
               </div>
            </div>
          </Card>
        ))}
      </div>

      {/* TABS INTERFACE */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
        <TabsList className="bg-transparent border-b border-border/60 w-full justify-start rounded-none h-auto p-0 gap-10">
          {['events', 'insights', 'feedback', 'team'].map(tab => (
            <TabsTrigger 
              key={tab} 
              value={tab} 
              className="bg-transparent border-none rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground font-black uppercase tracking-[0.2em] text-[11px] pb-4 px-0 transition-all capitalize shadow-none hover:text-foreground"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="events" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
          <Card className="overflow-hidden border-none shadow-2xl">
            <div className="p-10 border-b border-border/60 bg-muted/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-display font-bold tracking-tight">Active Nodes</h3>
                  <p className="text-sm font-medium text-muted-foreground">Direct control over {managedEvents.length} distinct experiences</p>
                </div>
                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search mission codes..."
                    className="pl-14"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-border/60">
              {filteredEvents.map((event: any) => (
                <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between p-10 hover:bg-muted/10 transition-all group">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-muted flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-background transition-colors border border-transparent group-hover:border-border/60">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">{format(new Date(event.startDate), 'MMM')}</span>
                      <span className="text-3xl font-display font-bold text-foreground leading-none">{format(new Date(event.startDate), 'dd')}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">{event.title}</h3>
                        {event.organizerId !== user?.id && <Badge variant="secondary" className="bg-muted text-[9px] font-black uppercase tracking-widest px-2">CO-ORG</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        <span className="flex items-center gap-2"><Users size={14} className="text-primary" /> {event.registeredCount || 0} Syncs</span>
                        <span className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {typeof event.location === 'string' ? event.location : event.location?.venue || 'Virtual'}</span>
                        <Badge className={cn(
                           "text-[9px] font-black px-3 py-0.5 rounded-full border-none",
                           event.status === 'published' ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                        )}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-8 md:mt-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2 hover:bg-muted" onClick={() => handleClone(event.id)} disabled={isCloning === event.id}>
                      {isCloning === event.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Copy size={20} />}
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2 hover:bg-muted text-primary" asChild><Link href={`/events/${event.id}`}><ArrowUpRight size={20} /></Link></Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2 hover:bg-muted" asChild><Link href={`/events/${event.id}/edit`}><Edit size={20} /></Link></Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2 hover:bg-destructive/10 text-red-500 hover:text-red-600" onClick={() => handleDelete(event.id)}><Trash2 size={20} /></Button>
                  </div>
                </div>
              ))}
              
              {filteredEvents.length === 0 && (
                <div className="p-20 text-center space-y-8">
                  <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                     <Calendar className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-2xl font-display font-bold">No missions found.</h3>
                     <p className="text-muted-foreground font-medium max-w-xs mx-auto">Your search didn't match any active nodes or you haven't initialized any yet.</p>
                  </div>
                  <Button asChild size="lg" className="rounded-2xl px-10 shadow-glow font-black h-14">
                    <Link href="/events/create">Initialize First Node</Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* insights, feedback, team content would follow same patterns ... */}
        <TabsContent value="insights" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {managedEvents.map(event => (
              <div key={event.id} className="p-8 rounded-[2.5rem] bg-background border border-border/80 shadow-xl hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between min-h-[300px]">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <BrainCircuit size={28} />
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] uppercase tracking-widest px-3">Neural Link Ready</Badge>
                  </div>
                  <h3 className="text-2xl font-display font-bold truncate text-foreground group-hover:text-primary transition-colors tracking-tight">{event.title}</h3>
                  <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Predictive Analytics Stream Active</p>
                </div>
                <div className="pt-8 mt-auto border-t border-border/40">
                  <Button variant="link" className="text-primary font-black p-0 h-auto text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform" asChild>
                    <Link href={`/organizer/insights/${event.id}`}>Analyze Intel <ChevronRight size={14} /></Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
