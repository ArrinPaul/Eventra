'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { 
  Plus, 
  Calendar, 
  Users, 
  Ticket, 
  ArrowUpRight, 
  Search,
  MoreVertical,
  Loader2,
  Trash2,
  Edit,
  Copy
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueDashboard } from '@/features/organizer/revenue-dashboard';
import { useRouter } from 'next/navigation';
import { getEvents, deleteEvent } from '@/app/actions/events';
import type { EventraEvent } from '@/types';

import { EmptyState } from '@/components/shared/empty-state';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [managedEvents, setManagedEvents] = useState<EventraEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('events');
  const [isCloning, setIsCloning] = useState<string | null>(null);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getEvents({ 
        organizerId: user.id,
        status: 'published' // Organizer might want to see drafts too in future
      });
      setManagedEvents(data as any);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load events.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  const filteredEvents = managedEvents.filter((e: EventraEvent) => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRegistrations = managedEvents.reduce((sum: number, e: EventraEvent) => sum + (e.registeredCount || 0), 0);
  const activeEvents = managedEvents.filter((e: EventraEvent) => e.status === 'published').length;
  const totalRevenue = managedEvents.reduce((sum: number, e: EventraEvent) => sum + (e.isPaid ? Number(e.price || 0) * (e.registeredCount || 0) : 0), 0);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id);
      toast({ title: 'Event deleted' });
      loadData();
    } catch (e) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleClone = async (id: string) => {
    setIsCloning(id);
    try {
      // TODO: Implement actual clone logic in events action
      toast({ title: 'Cloning coming soon', description: 'This feature is being ported.' });
    } catch (e) {
      toast({ title: 'Failed to clone event', variant: 'destructive' });
    } finally {
      setIsCloning(null);
    }
  };

  return (
    <div className="container py-8 space-y-8 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Organizer Dashboard</h1>
          <p className="text-gray-400">Manage your events and track performance</p>
        </div>
        <Button asChild className="bg-cyan-600 hover:bg-cyan-500">
          <Link href="/events/create"><Plus className="mr-2 h-4 w-4" /> Create Event</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Calendar className="text-blue-400" /></div>
              <Badge className="bg-blue-500/20 text-blue-400 border-0">Events</Badge>
            </div>
            <p className="text-3xl font-bold">{managedEvents.length}</p>
            <p className="text-xs text-gray-400 mt-1">{activeEvents} active events</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg"><Users className="text-green-400" /></div>
              <Badge className="bg-green-500/20 text-green-400 border-0">Attendees</Badge>
            </div>
            <p className="text-3xl font-bold">{totalRegistrations}</p>
            <p className="text-xs text-gray-400 mt-1">Total across all events</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg"><Ticket className="text-purple-400" /></div>
              <Badge className="bg-purple-500/20 text-purple-400 border-0">Revenue</Badge>
            </div>
            <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">From ticket sales</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="events" className="data-[state=active]:bg-cyan-600">My Events</TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-cyan-600">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-cyan-600">Deep Insights (AI)</TabsTrigger>
          <TabsTrigger value="feedback" className="data-[state=active]:bg-cyan-600">Feedback System</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-cyan-600">Team & Collab</TabsTrigger>
          <TabsTrigger value="waitlist" className="data-[state=active]:bg-cyan-600">Waitlist</TabsTrigger>
          <TabsTrigger value="sponsors" className="data-[state=active]:bg-cyan-600">Sponsors</TabsTrigger>
          <TabsTrigger value="pulse" className="data-[state=active]:bg-cyan-600">Event Pulse</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>My Events</CardTitle>
                  <CardDescription className="text-gray-400">You are managing {managedEvents.length} events</CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Search events..." 
                    className="pl-9 bg-white/5 border-white/10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEvents.map((event: any) => {
                  const isOwner = event.organizerId === (user?._id || user?.id);
                  return (
                    <div key={event._id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 group hover:border-cyan-500/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-cyan-900/20 flex flex-col items-center justify-center text-cyan-400 border border-cyan-500/20">
                          <span className="text-[10px] font-bold uppercase">{format(event.startDate, 'MMM')}</span>
                          <span className="text-lg font-bold leading-none">{format(event.startDate, 'dd')}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold">{event.title}</h3>
                            {!isOwner && <Badge variant="secondary" className="text-[8px] h-4 py-0 bg-purple-500/20 text-purple-400 border-purple-500/30">CO-ORG</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            <span className="flex items-center gap-1"><Users size={12} /> {event.registeredCount || 0}</span>
                            <span className="flex items-center gap-1"><Badge variant="outline" className="text-[10px] py-0">{event.status}</Badge></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handleClone(event._id)}
                          disabled={isCloning === event._id}
                        >
                          {isCloning === event._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy size={16} />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/events/${event._id}`}><ArrowUpRight size={16} /></Link></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/events/${event._id}/edit`}><Edit size={16} /></Link></Button>
                        {isOwner && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleDelete(event._id)}><Trash2 size={16} /></Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredEvents.length === 0 && (
                  <EmptyState 
                    icon={Calendar}
                    title="No events found"
                    description="You haven't created any events yet. Start by creating your first event to build your community!"
                    actionLabel="Create New Event"
                    actionHref="/events/create"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueDashboard />
        </TabsContent>

        <TabsContent value="insights">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Event Intelligence</CardTitle>
              <CardDescription>Select an event to view deep AI insights and predictions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {managedEvents.map(event => (
                  <Card key={event.id} className="bg-white/5 border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer overflow-hidden group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-bold truncate pr-4">{event.title}</CardTitle>
                        <BrainCircuit size={16} className="text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardHeader>
                    <CardFooter>
                      <Button variant="link" className="text-cyan-400 p-0 h-auto text-xs" asChild>
                        <Link href={`/organizer/insights/${event.id}`}>View Deep Insights <ChevronRight size={12} /></Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Interactive Feedback System</CardTitle>
                  <CardDescription>Manage custom questionnaires and view attendee satisfaction trends.</CardDescription>
                </div>
                <Button asChild variant="outline" className="border-white/10">
                  <Link href="/organizer/certificates"><Award className="mr-2 h-4 w-4" /> Certificates</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {managedEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 group hover:border-purple-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{event.title}</h3>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{event.status}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-xs hover:bg-white/5" asChild>
                         <Link href={`/organizer/feedback/builder/${event.id}`}>Edit Form</Link>
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs border-white/10" asChild>
                         <Link href={`/organizer/feedback/analytics/${event.id}`}>Analytics</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Team & Collaboration</CardTitle>
              <CardDescription>Manage event-specific staff, volunteers, and speakers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {managedEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Users size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{event.title}</h3>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{event.status}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs border-white/10" asChild>
                       <Link href={`/organizer/collab/${event.id}`}>Manage Team</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="waitlist">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Waitlist & Intelligent Promotion</CardTitle>
              <CardDescription>Monitor event queues and manage auto-promoted attendees.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {managedEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 group hover:border-amber-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Clock size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{event.title}</h3>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{event.registeredCount}/{event.capacity} Filled</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs border-white/10" asChild>
                       <Link href={`/organizer/waitlist/${event.id}`}>View Queue</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sponsors">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Sponsors & Partners</CardTitle>
              <CardDescription>Manage event sponsors and their display tiers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {managedEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 group hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <Award size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{event.title}</h3>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{event.status}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs border-white/10" asChild>
                       <Link href={`/organizer/sponsors/${event.id}`}>Manage Sponsors</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pulse">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Real-time Event Pulse</CardTitle>
              <CardDescription>Live velocity tracking for registrations and check-ins.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {managedEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 group hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <Activity size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{event.title}</h3>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{event.status}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs border-white/10" asChild>
                       <Link href={`/organizer/pulse/${event.id}`}>View Live Pulse</Link>
                    </Button>
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


