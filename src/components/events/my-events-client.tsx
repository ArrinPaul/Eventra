'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Event } from '@/types';
import { MyEventCard } from '@/components/events/my-event-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Search, 
  Ticket, 
  Heart, 
  History, 
  Plus,
  Loader2,
  CalendarDays,
  QrCode,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/core/utils/utils';
import { format, isPast, isFuture, isToday } from 'date-fns';

const getEventDate = (event: Event): Date => {
  const dateValue = event.startDate || event.date;
  if (!dateValue) return new Date();
  return new Date(dateValue);
};

export default function MyEventsClient() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const allEventsRaw = useQuery(api.events.get);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('registered');

  const loading = allEventsRaw === undefined;
  
  const events: Event[] = (allEventsRaw || []).map((e: any) => ({
    ...e,
    id: e._id,
  }));

  const userEvents = events.filter(event => 
    false || // Legacy field removed; registration checked via backend
    false ||
    user?.myEvents?.includes(event.id)
  );

  const wishlisted = user?.wishlist || [];

  const filterEvents = (events: Event[], tab: string) => {
    let filtered = events;
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    switch (tab) {
      case 'registered':
        return filtered.filter(event => {
          const eventDate = getEventDate(event);
          return isFuture(eventDate) || isToday(eventDate);
        });
      case 'past':
        return filtered.filter(event => {
          const eventDate = getEventDate(event);
          return isPast(eventDate) && !isToday(eventDate);
        });
      case 'wishlist':
        return events.filter(event => wishlisted.includes(event.id));
      default:
        return filtered;
    }
  };

  const registeredEvents = filterEvents(userEvents, 'registered');
  const pastEvents = filterEvents(userEvents, 'past');
  const wishlistedEvents = filterEvents(events, 'wishlist');

  const handleRemoveWishlist = async (eventId: string) => {
    await updateUser({
      wishlist: wishlisted.filter((id: string) => id !== eventId)
    });
    toast({ title: 'Removed from wishlist' });
  };

  const handleRateEvent = async (eventId: string, rating: number) => {
    const currentRatings = user?.eventRatings || {};
    await updateUser({
      eventRatings: { ...currentRatings, [eventId]: rating }
    });
    toast({ title: 'Rating submitted' });
  };

  const nextEvent = registeredEvents
    .sort((a, b) => getEventDate(a).getTime() - getEventDate(b).getTime())[0];

  if (!user && !loading) {
    return (
      <div className="container py-16 text-center">
        <div className="max-w-md mx-auto">
          <Calendar className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Sign in to see your events</h1>
          <div className="flex gap-4 justify-center">
            <Button asChild><Link href="/login">Sign In</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Events</h1>
          <p className="text-muted-foreground">Manage your registered events and wishlist</p>
        </div>
        <Button asChild>
          <Link href="/explore"><Plus className="mr-2 h-4 w-4" />Find Events</Link>
        </Button>
      </div>

      {nextEvent && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-6 border">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <p className="text-sm font-medium text-primary mb-2">YOUR NEXT EVENT</p>
                <h2 className="text-2xl font-bold mb-2">{nextEvent.title}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />{format(getEventDate(nextEvent), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex gap-3">
                  <Button asChild size="sm"><Link href={`/events/${nextEvent.id}`}>View Details</Link></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search your events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="registered" className="gap-2">
            <Ticket className="h-4 w-4" /> Registered
            {registeredEvents.length > 0 && <Badge variant="secondary" className="ml-1">{registeredEvents.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <History className="h-4 w-4" /> Past Events
            {pastEvents.length > 0 && <Badge variant="secondary" className="ml-1">{pastEvents.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="gap-2">
            <Heart className="h-4 w-4" /> Wishlist
            {wishlistedEvents.length > 0 && <Badge variant="secondary" className="ml-1">{wishlistedEvents.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <TabsContent value="registered">
              {registeredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {registeredEvents.map(event => <MyEventCard key={event.id} event={event} variant="upcoming" />)}
                </div>
              ) : (
                <div className="text-center py-16"><p className="text-muted-foreground">No upcoming events.</p></div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.map(event => <MyEventCard key={event.id} event={event} variant="past" onRate={handleRateEvent} />)}
                </div>
              ) : (
                <div className="text-center py-16"><p className="text-muted-foreground">No past events.</p></div>
              )}
            </TabsContent>

            <TabsContent value="wishlist">
              {wishlistedEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistedEvents.map(event => <MyEventCard key={event.id} event={event} variant="wishlist" onRemoveWishlist={handleRemoveWishlist} />)}
                </div>
              ) : (
                <div className="text-center py-16"><p className="text-muted-foreground">Your wishlist is empty.</p></div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}