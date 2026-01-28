'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Event } from '@/types';
import { eventService } from '@/lib/firestore-services';
import { EventCard } from '@/components/events/event-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Download,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format, isPast, isFuture, isToday } from 'date-fns';

// Helper function to safely parse event date
const getEventDate = (event: Event): Date => {
  // Prefer startDate, fall back to date if available
  const dateValue = event.startDate || event.date;
  if (!dateValue) return new Date();
  
  // Handle Firestore Timestamp
  if (typeof dateValue === 'object' && dateValue !== null && 'toDate' in dateValue) {
    return (dateValue as { toDate: () => Date }).toDate();
  }
  // Handle Date object
  if (dateValue instanceof Date) return dateValue;
  // Handle string
  return new Date(dateValue);
};

export default function MyEventsClient() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [wishlisted, setWishlisted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('registered');

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        // Fetch all events the user is registered for
        const allEvents = await eventService.getEvents();
        
        // Filter events where user is registered
        const userEvents = allEvents.filter(event => 
          event.attendees?.includes(user.uid!) || 
          event.registeredUsers?.includes(user.uid!) ||
          user.myEvents?.includes(event.id)
        );
        
        setEvents(userEvents);
        
        // Load wishlist from localStorage
        const storedWishlist = localStorage.getItem(`wishlist-${user.uid}`);
        if (storedWishlist) {
          setWishlisted(JSON.parse(storedWishlist));
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  // Filter events based on search and tab
  const filterEvents = (events: Event[], tab: string) => {
    let filtered = events;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Tab-based filtering
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
        // Return wishlisted events (would need to fetch these separately in a real app)
        return filtered.filter(event => wishlisted.includes(event.id));
      default:
        return filtered;
    }
  };

  const registeredEvents = filterEvents(events, 'registered');
  const pastEvents = filterEvents(events, 'past');
  const wishlistedEvents = filterEvents(events, 'wishlist');

  // Get next upcoming event
  const nextEvent = registeredEvents
    .filter(e => {
      const eventDate = getEventDate(e);
      return isFuture(eventDate) || isToday(eventDate);
    })
    .sort((a, b) => {
      const dateA = getEventDate(a);
      const dateB = getEventDate(b);
      return dateA.getTime() - dateB.getTime();
    })[0];

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <div className="max-w-md mx-auto">
          <Calendar className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Sign in to see your events</h1>
          <p className="text-muted-foreground mb-6">
            Track your registered events, save favorites to your wishlist, and manage your schedule.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/explore">Explore Events</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Events</h1>
          <p className="text-muted-foreground">
            Manage your registered events and wishlist
          </p>
        </div>
        <Button asChild>
          <Link href="/explore">
            <Plus className="mr-2 h-4 w-4" />
            Find Events
          </Link>
        </Button>
      </div>

      {/* Next Event Card */}
      {nextEvent && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-6 border">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <p className="text-sm font-medium text-primary mb-2">YOUR NEXT EVENT</p>
                <h2 className="text-2xl font-bold mb-2">{nextEvent.title}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {format(getEventDate(nextEvent), 'EEEE, MMMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Ticket className="h-4 w-4" />
                    {typeof nextEvent.location === 'string' 
                      ? nextEvent.location 
                      : nextEvent.location?.venue?.name || 'Online Event'}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Button asChild size="sm">
                    <Link href={`/events/${nextEvent.id}`}>View Details</Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <QrCode className="mr-2 h-4 w-4" />
                    Show Ticket
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                {nextEvent.imageUrl || nextEvent.image ? (
                  <img 
                    src={nextEvent.imageUrl || nextEvent.image} 
                    alt={nextEvent.title}
                    className="w-48 h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-primary/50" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="registered" className="gap-2">
            <Ticket className="h-4 w-4" />
            Registered
            {registeredEvents.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {registeredEvents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <History className="h-4 w-4" />
            Past Events
            {pastEvents.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pastEvents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="gap-2">
            <Heart className="h-4 w-4" />
            Wishlist
            {wishlistedEvents.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {wishlistedEvents.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="registered">
              {registeredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {registeredEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Ticket className="h-12 w-12" />}
                  title="No upcoming events"
                  description="You haven't registered for any upcoming events yet."
                  action={
                    <Button asChild>
                      <Link href="/explore">Browse Events</Link>
                    </Button>
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.map(event => (
                    <EventCard key={event.id} event={event} variant="compact" />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<History className="h-12 w-12" />}
                  title="No past events"
                  description="Events you've attended will appear here."
                />
              )}
            </TabsContent>

            <TabsContent value="wishlist">
              {wishlistedEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistedEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Heart className="h-12 w-12" />}
                  title="Your wishlist is empty"
                  description="Save events you're interested in to find them later."
                  action={
                    <Button asChild>
                      <Link href="/explore">Discover Events</Link>
                    </Button>
                  }
                />
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

// Empty State Component
function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  );
}
