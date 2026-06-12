'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/core/utils/utils';
import {
  Plus, Calendar, Users, Search,
  Loader2, Trash2, Edit, Copy, BrainCircuit, ChevronRight,
  Activity, MapPin, ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { getEvents, deleteEvent, cloneEvent } from '@/app/actions/events';
import type { EventraEvent } from '@/types';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

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
      if (!result.success) throw new Error(result.error);
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
        toast({ title: 'Event cloned' });
        loadData();
      }
    } catch (e) {
      toast({ title: 'Failed to clone', variant: 'destructive' });
    } finally {
      setIsCloning(null);
    }
  };

  const totalRegistrations = managedEvents.reduce((sum: number, e: EventraEvent) => sum + (e.registeredCount || 0), 0);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-40">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-notion-hairline border-t-notion-primary animate-spin" />
          <p className="text-body-sm text-notion-ink-muted">Syncing mission control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-notion-hairline pb-8">
        <div className="space-y-4">
           <Badge variant="outline" className="text-notion-primary border-notion-primary/20 bg-notion-primary/5">
             Command Center
           </Badge>
           <h1 className="text-display-2 leading-none">
             Mission <span className="text-notion-primary italic">Control.</span>
           </h1>
           <p className="text-body-md text-notion-ink-secondary max-w-xl">
             Manage your active campaigns, analyze reach, and coordinate operations.
           </p>
        </div>
        <Button asChild variant="primary" size="lg" className="h-12 shadow-notion-elevated">
          <Link href="/events/create"><Plus className="mr-2 h-4 w-4" /> New Mission</Link>
        </Button>
      </div>

      {/* KPI STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { label: 'Active Campaigns', value: managedEvents.length, icon: Calendar, color: 'text-notion-primary' },
          { label: 'Total Reach', value: totalRegistrations.toLocaleString(), icon: Users, color: 'text-notion-accent-teal' },
        ].map((stat, i) => (
          <Card key={i} className="p-8 hover:shadow-notion-soft transition-shadow border-notion-hairline relative overflow-hidden bg-notion-surface">
            <div className="absolute top-0 right-0 w-32 h-32 bg-notion-primary/5 blur-[40px] rounded-full -mr-16 -mt-16" />
            <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
               <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-lg bg-notion-canvas-soft flex items-center justify-center">
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <Badge variant="secondary" className="bg-notion-canvas-soft text-notion-ink-muted border-none">
                    <Activity size={12} className="mr-1.5" /> Live
                  </Badge>
               </div>
               <div>
                  <p className="text-display-1 font-bold text-notion-ink leading-none mb-2">{stat.value}</p>
                  <p className="text-eyebrow uppercase font-bold text-notion-ink-muted">{stat.label}</p>
               </div>
            </div>
          </Card>
        ))}
      </div>

      {/* TABS INTERFACE */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-transparent border-b border-notion-hairline w-full justify-start rounded-none h-auto p-0 gap-8">
          {['events', 'insights', 'feedback', 'team'].map(tab => (
            <TabsTrigger 
              key={tab} 
              value={tab} 
              className="bg-transparent border-none rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-notion-primary data-[state=active]:text-notion-ink text-notion-ink-muted text-body-sm font-medium pb-3 px-0 transition-all capitalize shadow-none hover:text-notion-ink"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="events" className="m-0 space-y-6">
          <Card className="overflow-hidden border-notion-hairline bg-notion-surface">
            <div className="p-6 border-b border-notion-hairline bg-notion-canvas-soft/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-title font-bold">Active Nodes</h3>
                  <p className="text-body-sm text-notion-ink-muted">{managedEvents.length} distinct experiences</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-notion-ink-faint" />
                  <Input
                    placeholder="Search mission codes..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-notion-hairline">
              {filteredEvents.map((event: any) => (
                <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-notion-canvas-soft/50 transition-colors group">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-lg bg-notion-canvas-soft flex flex-col items-center justify-center flex-shrink-0 border border-notion-hairline">
                      <span className="text-[10px] font-bold uppercase text-notion-primary leading-none mb-1">{format(new Date(event.startDate), 'MMM')}</span>
                      <span className="text-title font-bold text-notion-ink leading-none">{format(new Date(event.startDate), 'dd')}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h3 className="text-body-md font-bold text-notion-ink group-hover:text-notion-primary transition-colors">{event.title}</h3>
                        {event.organizerId !== user?.id && <Badge variant="secondary" className="text-[10px] py-0">Partner</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-caption text-notion-ink-muted">
                        <span className="flex items-center gap-1.5"><Users size={12} className="text-notion-primary" /> {event.registeredCount || 0} Syncs</span>
                        <span className="flex items-center gap-1.5"><MapPin size={12} className="text-notion-primary" /> {typeof event.location === 'string' ? event.location : event.location?.venue || 'Virtual'}</span>
                        <Badge variant="secondary" className={cn(
                           "text-[10px] py-0 px-2 border-none",
                           event.status === 'published' ? "bg-notion-accent-green/10 text-notion-accent-green" : "bg-notion-canvas-soft text-notion-ink-muted"
                        )}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-6 md:mt-0 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-notion-canvas-soft" onClick={() => handleClone(event.id)} disabled={isCloning === event.id}>
                      {isCloning === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy size={16} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-notion-canvas-soft text-notion-primary" asChild><Link href={`/events/${event.id}`}><ExternalLink size={16} /></Link></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-notion-canvas-soft" asChild><Link href={`/events/${event.id}/edit`}><Edit size={16} /></Link></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-red-50 text-red-500 hover:text-red-600" onClick={() => handleDelete(event.id)}><Trash2 size={16} /></Button>
                  </div>
                </div>
              ))}
              
              {filteredEvents.length === 0 && (
                <div className="p-20 text-center space-y-6">
                  <div className="w-16 h-16 bg-notion-canvas-soft rounded-lg flex items-center justify-center mx-auto border border-notion-hairline shadow-notion-soft">
                     <Calendar className="w-8 h-8 text-notion-ink-faint" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-title font-bold">No missions found.</h3>
                     <p className="text-body-sm text-notion-ink-muted max-w-xs mx-auto">Your search didn't match any active nodes or you haven't initialized any yet.</p>
                  </div>
                  <Button asChild variant="primary" className="mt-4">
                    <Link href="/events/create">Initialize First Node</Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {managedEvents.map(event => (
              <Card key={event.id} className="p-8 border-notion-hairline hover:shadow-notion-soft transition-all cursor-pointer group flex flex-col justify-between min-h-[280px] bg-notion-surface">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-lg bg-notion-accent-purple/10 flex items-center justify-center text-notion-accent-purple group-hover:scale-110 transition-transform">
                      <BrainCircuit size={24} />
                    </div>
                    <Badge variant="sticker">Neural Link Ready</Badge>
                  </div>
                  <h3 className="text-title font-bold truncate text-notion-ink group-hover:text-notion-primary transition-colors">{event.title}</h3>
                  <p className="text-caption text-notion-ink-muted uppercase font-bold">Predictive Analytics Stream Active</p>
                </div>
                <div className="pt-6 mt-auto border-t border-notion-hairline">
                  <Button variant="link" className="text-notion-primary font-bold p-0 h-auto text-eyebrow uppercase group-hover:translate-x-1 transition-transform" asChild>
                    <Link href={`/organizer/insights/${event.id}`}>Analyze Intel <ChevronRight size={12} className="ml-1" /></Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
