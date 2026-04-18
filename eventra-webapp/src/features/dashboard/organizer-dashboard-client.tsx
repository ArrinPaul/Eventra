'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import {
  Plus, Calendar, Users, Ticket, ArrowUpRight, Search,
  Loader2, Trash2, Edit, Copy, BrainCircuit, ChevronRight,
  Award, MessageSquare, Clock, Activity, DollarSign
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

  const totalRegistrations = managedEvents.reduce((sum: number, e: EventraEvent) => sum + (e.registeredCount || 0), 0);
  const activeEvents = managedEvents.filter((e: EventraEvent) => e.status === 'published').length;
  const totalRevenue = managedEvents.reduce((sum: number, e: EventraEvent) => sum + (e.isPaid ? Number(e.price || 0) * (e.registeredCount || 0) : 0), 0);

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

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Organizer Dashboard</h1>
          <p className="text-muted-foreground">Manage your events and track performance</p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/events/create"><Plus className="mr-2 h-4 w-4" /> Create Event</Link>
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{managedEvents.length}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{activeEvents} active events</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalRegistrations}</p>
            <p className="text-sm text-muted-foreground mt-0.5">Total attendees</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-0.5">From ticket sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="events">My Events</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
            <TabsTrigger value="pulse">Event Pulse</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="events">
          <Card className="border-border">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-foreground">My Events</CardTitle>
                  <CardDescription>Managing {managedEvents.length} events</CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    className="pl-9 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredEvents.map((event: any) => {
                  const isOwner = event.organizerId === (user?._id || user?.id);
                  return (
                    <div key={event.id || event._id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card group hover:border-primary/20 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/5 border border-border flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-semibold uppercase text-primary">{format(event.startDate, 'MMM')}</span>
                          <span className="text-lg font-bold text-foreground leading-none">{format(event.startDate, 'dd')}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{event.title}</h3>
                            {!isOwner && <Badge variant="secondary" className="text-[10px]">CO-ORG</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><Users size={12} /> {event.registeredCount || 0}</span>
                            <Badge variant="outline" className="text-[10px] capitalize">{event.status}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleClone(event.id || event._id)} disabled={isCloning === (event.id || event._id)}>
                          {isCloning === (event.id || event._id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy size={14} />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/events/${event.id || event._id}`}><ArrowUpRight size={14} /></Link></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/events/${event.id || event._id}/edit`}><Edit size={14} /></Link></Button>
                        {isOwner && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(event.id || event._id)}><Trash2 size={14} /></Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredEvents.length === 0 && (
                  <EmptyState
                    icon={Calendar}
                    title="No events found"
                    description="You haven't created any events yet."
                    actionLabel="Create New Event"
                    actionHref="/events/create"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue"><RevenueDashboard /></TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Event Intelligence</CardTitle>
              <CardDescription>Select an event to view deep AI insights and predictions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {managedEvents.map(event => (
                  <Card key={event.id} className="border-border hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-semibold truncate pr-4 text-foreground">{event.title}</CardTitle>
                        <BrainCircuit size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardFooter>
                      <Button variant="link" className="text-primary p-0 h-auto text-xs" asChild>
                        <Link href={`/organizer/insights/${event.id}`}>View Insights <ChevronRight size={12} /></Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <Card className="border-border">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-foreground">Feedback System</CardTitle>
                  <CardDescription>Manage questionnaires and view satisfaction trends.</CardDescription>
                </div>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/organizer/certificates"><Award className="mr-2 h-4 w-4" /> Certificates</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {managedEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 rounded-xl border border-border group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center"><MessageSquare size={18} className="text-purple-600 dark:text-purple-400" /></div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{event.status}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-xs" asChild><Link href={`/organizer/feedback/builder/${event.id}`}>Edit Form</Link></Button>
                      <Button size="sm" variant="outline" className="text-xs rounded-lg" asChild><Link href={`/organizer/feedback/analytics/${event.id}`}>Analytics</Link></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Team & Collaboration</CardTitle>
              <CardDescription>Manage event-specific staff, volunteers, and speakers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {managedEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 rounded-xl border border-border group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center"><Users size={18} className="text-green-600 dark:text-green-400" /></div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{event.status}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs rounded-lg" asChild><Link href={`/organizer/collab/${event.id}`}>Manage Team</Link></Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Waitlist Tab */}
        <TabsContent value="waitlist">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Waitlist Management</CardTitle>
              <CardDescription>Monitor queues and auto-promoted attendees.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {managedEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 rounded-xl border border-border group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><Clock size={18} className="text-amber-600 dark:text-amber-400" /></div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
                        <p className="text-xs text-muted-foreground">{event.registeredCount}/{event.capacity} filled</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs rounded-lg" asChild><Link href={`/organizer/waitlist/${event.id}`}>View Queue</Link></Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sponsors Tab */}
        <TabsContent value="sponsors">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Sponsors & Partners</CardTitle>
              <CardDescription>Manage event sponsors and display tiers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {managedEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 rounded-xl border border-border group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Award size={18} className="text-primary" /></div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{event.status}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs rounded-lg" asChild><Link href={`/organizer/sponsors/${event.id}`}>Manage Sponsors</Link></Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pulse Tab */}
        <TabsContent value="pulse">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Real-time Event Pulse</CardTitle>
              <CardDescription>Live velocity tracking for registrations and check-ins.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {managedEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 rounded-xl border border-border group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Activity size={18} className="text-primary" /></div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{event.status}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs rounded-lg" asChild><Link href={`/organizer/pulse/${event.id}`}>View Live Pulse</Link></Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
