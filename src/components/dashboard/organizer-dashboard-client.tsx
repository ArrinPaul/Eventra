'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
import { RevenueDashboard } from '@/components/organizer/revenue-dashboard';
import { useRouter } from 'next/navigation';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const managedEvents = useQuery(api.events.getManagedEvents, user ? { userId: (user._id || user.id) as any } : "skip") || [];
  const deleteEventMutation = useMutation(api.events.deleteEvent);
  const cloneEventMutation = useMutation(api.events.cloneEvent);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('events');
  const [isCloning, setIsCloning] = useState<string | null>(null);

  const filteredEvents = managedEvents.filter((e: any) => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRegistrations = managedEvents.reduce((sum: number, e: any) => sum + (e.registeredCount || 0), 0);
  const activeEvents = managedEvents.filter((e: any) => e.status === 'published').length;
  // Fallback for revenue if stats hasn't loaded in RevenueDashboard yet
  const totalRevenue = managedEvents.reduce((sum: number, e: any) => sum + (e.isPaid ? (e.price || 0) * (e.registeredCount || 0) : 0), 0);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEventMutation({ id: id as any });
      toast({ title: 'Event deleted' });
    } catch (e) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleClone = async (id: string) => {
    setIsCloning(id);
    try {
      const newId = await cloneEventMutation({ id: id as any });
      toast({ title: 'Event cloned successfully!', description: 'Opening the new event editor.' });
      router.push(`/events/${newId}/edit`);
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
                  <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-lg">
                    <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No events found. Start by creating your first event!</p>
                    <Button variant="link" asChild className="text-cyan-400 mt-2">
                      <Link href="/events/create">Create New Event</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
