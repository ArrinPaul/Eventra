'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Trophy, 
  Users, 
  TrendingUp,
  Star,
  Zap,
  Ticket
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/core/utils/utils';

// Placeholder data - in a real app, this would come from props or API
const FEATURED_EVENTS = [
  {
    id: '1',
    title: 'Future of AI Conference',
    date: new Date(2026, 2, 15, 9, 0),
    location: 'Tech Hub Auditorium',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000',
    category: 'Technology',
    attendees: 450,
    matchScore: 98
  },
  {
    id: '2',
    title: 'Design Systems Workshop',
    date: new Date(2026, 2, 18, 14, 0),
    location: 'Virtual',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=1000',
    category: 'Design',
    attendees: 120,
    matchScore: 92
  },
  {
    id: '3',
    title: 'Startup Networking Night',
    date: new Date(2026, 2, 20, 18, 0),
    location: 'Downtown Loft',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=1000',
    category: 'Business',
    attendees: 85,
    matchScore: 88
  }
];

const MY_UPCOMING = [
  {
    id: '101',
    title: 'Web Dev Bootcamp',
    date: new Date(2026, 2, 10, 10, 0),
    location: 'Lab 3',
    status: 'confirmed'
  },
  {
    id: '102',
    title: 'Career Fair 2026',
    date: new Date(2026, 2, 12, 9, 0),
    location: 'Main Hall',
    status: 'waitlist'
  }
];

export function AttendeeDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container py-8 space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border border-white/10 p-8 md:p-12">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center rounded-full bg-background/50 backdrop-blur px-3 py-1 text-sm font-medium text-primary border border-primary/20">
              <Sparkles className="mr-2 h-4 w-4" />
              <span>AI-Curated Experience</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline">
              Hello, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-lg text-muted-foreground">
              You have <span className="font-bold text-foreground">{MY_UPCOMING.length} events</span> coming up this week. 
              Your personalized recommendations are ready.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20">
                <Link href="/explore">
                  Explore Events <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full bg-background/50 backdrop-blur hover:bg-background/80">
                <Link href="/my-events">View Schedule</Link>
              </Button>
            </div>
          </div>
          
          {/* Quick Stats Widget */}
          <div className="hidden md:grid grid-cols-2 gap-4">
            <Card className="bg-background/60 backdrop-blur border-none shadow-xl">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Trophy className="h-8 w-8 text-yellow-500 mb-2" />
                <span className="text-2xl font-bold">{user.points || 0}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Points</span>
              </CardContent>
            </Card>
            <Card className="bg-background/60 backdrop-blur border-none shadow-xl">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Ticket className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-2xl font-bold">{MY_UPCOMING.length}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Tickets</span>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Background Decor */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl opacity-50" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Recommendations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                Top Picks for You
              </h2>
              <Link href="/ai-recommendations" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            
            <ScrollArea className="w-full whitespace-nowrap rounded-xl">
              <div className="flex w-max space-x-4 pb-4">
                {FEATURED_EVENTS.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="group relative block w-[300px] overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-1">
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={event.image} 
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 rounded-full bg-black/70 backdrop-blur px-2 py-1 text-xs font-medium text-white flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {event.matchScore}% Match
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">{event.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> {event.attendees}
                        </span>
                      </div>
                      <h3 className="font-semibold leading-tight mb-2 truncate" title={event.title}>
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(event.date, 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>

          {/* Upcoming Schedule */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Your Agenda</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/agenda">Full Schedule</Link>
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {MY_UPCOMING.length > 0 ? (
                  <div className="divide-y">
                    {MY_UPCOMING.map((event) => (
                      <div key={event.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 w-16 text-center bg-muted rounded-lg p-2">
                          <span className="block text-xs font-medium uppercase text-muted-foreground">
                            {format(event.date, 'MMM')}
                          </span>
                          <span className="block text-xl font-bold text-foreground">
                            {format(event.date, 'd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{event.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(event.date, 'h:mm a')}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/events/${event.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold">No upcoming events</h3>
                    <p className="text-muted-foreground text-sm mb-4">Start exploring to build your schedule.</p>
                    <Button asChild>
                      <Link href="/explore">Find Events</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* QR Code Widget */}
          <Card className="bg-gradient-to-b from-card to-muted/50 border-primary/20 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Event Pass</CardTitle>
              <CardDescription>Scan to check in</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-3 rounded-xl shadow-inner mb-4">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({id: user.uid}))}`}
                  alt="QR Code"
                  className="w-32 h-32"
                />
              </div>
              <p className="font-mono text-sm font-medium tracking-wider bg-background/50 px-3 py-1 rounded border">
                {user.registrationId || user.uid.substring(0, 8).toUpperCase()}
              </p>
            </CardContent>
          </Card>

          {/* Quick Connect */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Quick Connect
              </CardTitle>
              <CardDescription>People you should meet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${i}`} />
                      <AvatarFallback>U{i}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Alex Johnson</p>
                      <p className="text-xs text-muted-foreground truncate">Product Designer @ Tech</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-xs" asChild>
                  <Link href="/networking">View all suggestions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
