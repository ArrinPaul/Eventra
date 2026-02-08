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
    <div className="min-h-screen bg-[#0a0b14]">
      <div className="container py-8 space-y-8 animate-in fade-in duration-500">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-900/20 via-[#0a0b14] to-blue-900/20 border border-white/10 p-8 md:p-12">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-5 max-w-2xl">
              <div className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                <Sparkles className="mr-2 h-4 w-4" />
                <span>AI-Curated Experience</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                Hello, <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{user.name?.split(' ')[0] ?? 'there'}</span>!
              </h1>
              <p className="text-lg text-gray-400">
                You have <span className="font-bold text-cyan-400">{MY_UPCOMING.length} events</span> coming up this week.
                Your personalized recommendations are ready.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg" className="rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-gray-900 font-semibold border-0">
                  <Link href="/explore">
                    Explore Events <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-white/20 hover:bg-white/10 text-white">
                  <Link href="/my-events">View Schedule</Link>
                </Button>
              </div>
            </div>

            {/* Quick Stats Widget */}
            <div className="hidden md:grid grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg mb-3">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-white">{user.points || 0}</span>
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Points</span>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg mb-3">
                    <Ticket className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-white">{MY_UPCOMING.length}</span>
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Tickets</span>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Background Decor */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl opacity-50" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">

            {/* AI Recommendations */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                  <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  Top Picks for You
                </h2>
                <Link href="/ai-recommendations" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                  View all
                </Link>
              </div>

              <ScrollArea className="w-full whitespace-nowrap rounded-xl">
                <div className="flex w-max space-x-4 pb-4">
                  {FEATURED_EVENTS.map((event) => (
                    <Link key={event.id} href={`/events/${event.id}`} className="group relative block w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-2">
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-3 right-3 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {event.matchScore}% Match
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <Badge className="text-xs font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/30">{event.category}</Badge>
                          <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                            <Users className="h-3.5 w-3.5" /> {event.registeredCount ?? 0}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg leading-tight mb-2 truncate text-white group-hover:text-cyan-300 transition-colors" title={event.title}>
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="h-3.5 w-3.5 text-cyan-400" />
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
                <h2 className="text-2xl font-bold text-white">Your Agenda</h2>
                <Button variant="ghost" size="sm" asChild className="text-gray-400 hover:text-white hover:bg-white/10">
                  <Link href="/agenda">Full Schedule</Link>
                </Button>
              </div>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-0">
                {MY_UPCOMING.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {MY_UPCOMING.map((event) => (
                      <div key={event.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                        <div className="flex-shrink-0 w-16 text-center bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-lg p-2">
                          <span className="block text-xs font-medium uppercase text-cyan-400">
                            {format(event.date, 'MMM')}
                          </span>
                          <span className="block text-xl font-bold text-white">
                            {format(event.date, 'd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate text-white">{event.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-cyan-400" />
                              {format(event.date, 'h:mm a')}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-cyan-400" />
                              {event.location}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button variant="outline" size="sm" asChild className="border-white/20 text-white hover:bg-white/10">
                            <Link href={`/events/${event.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-white">No upcoming events</h3>
                    <p className="text-gray-400 text-sm mb-4">Start exploring to build your schedule.</p>
                    <Button asChild className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-gray-900 font-semibold border-0">
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
          <Card className="bg-gradient-to-b from-white/5 to-white/[0.02] border-cyan-500/20 overflow-hidden backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Event Pass</CardTitle>
              <CardDescription className="text-gray-400">Scan to check in</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-3 rounded-xl shadow-inner mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(user.registrationId || user._id || user.id || '')}`}
                  alt="QR Code"
                  className="w-32 h-32"
                />
              </div>
              <p className="font-mono text-sm font-medium tracking-wider bg-white/10 text-white px-3 py-1 rounded border border-white/20">
                {user.registrationId || (user._id || user.id || '').substring(0, 8).toUpperCase()}
              </p>
            </CardContent>
          </Card>

          {/* Quick Connect */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Users className="h-5 w-5 text-cyan-400" />
                Quick Connect
              </CardTitle>
              <CardDescription className="text-gray-400">People you should meet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${i}`} />
                      <AvatarFallback className="bg-cyan-600/20 text-cyan-300">U{i}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white">Alex Johnson</p>
                      <p className="text-xs text-gray-400 truncate">Product Designer @ Tech</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-white/10">
                      <TrendingUp className="h-4 w-4 text-cyan-400" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-xs text-gray-400 hover:text-white hover:bg-white/10" asChild>
                  <Link href="/networking">View all suggestions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
}
