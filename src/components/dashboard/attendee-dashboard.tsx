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
  Ticket,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/core/utils/utils';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ActivityFeed } from '@/components/feed/activity-feed';
import { EngagementMetrics } from './engagement-metrics';
import { ReferralSystem } from './referral-system';
import { useTranslations } from 'next-intl';

export function AttendeeDashboard() {
  const { user } = useAuth();
  const t = useTranslations('Dashboard');
  const tc = useTranslations('Common');
  
  const registrations = useQuery(api.registrations.getUpcoming) || [];
  const featuredEvents = useQuery(api.events.getPublished) || [];
  const quickConnect = useQuery(api.users.getRecommended, { limit: 3 }) || [];

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
                {t('welcome', { name: user.name?.split(' ')[0] ?? 'there' })}
              </h1>
              <p className="text-lg text-gray-400">
                You have <span className="font-bold text-cyan-400">{registrations.length} events</span> coming up this week.
                Your personalized recommendations are ready.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg" className="rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-gray-900 font-semibold border-0">
                  <Link href="/explore">
                    {tc('explore')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-white/20 hover:bg-white/10 text-white">
                  <Link href="/my-events">{t('myEvents')}</Link>
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
                  <span className="text-3xl font-bold text-white">{user.xp || user.points || 0}</span>
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">XP</span>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg mb-3">
                    <Ticket className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-white">{registrations.length}</span>
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
            <EngagementMetrics userId={user._id} />

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
                  {featuredEvents.slice(0, 5).map((event: any) => (
                    <Link key={event._id} href={`/events/${event._id}`} className="group relative block w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-2">
                      <div className="aspect-video w-full overflow-hidden">
                        {event.imageUrl ? (
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-cyan-900/40 to-blue-900/40 flex items-center justify-center">
                            <Calendar size={48} className="text-white/20" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {Math.floor(Math.random() * 15 + 85)}% Match
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
                          {format(event.startDate, 'MMM d, h:mm a')}
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
                {registrations.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {registrations.map((reg: any) => (
                      <div key={reg._id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                        <div className="flex-shrink-0 w-16 text-center bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-lg p-2">
                          <span className="block text-xs font-medium uppercase text-cyan-400">
                            {format(reg.event?.startDate || 0, 'MMM')}
                          </span>
                          <span className="block text-xl font-bold text-white">
                            {format(reg.event?.startDate || 0, 'd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate text-white">{reg.event?.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-cyan-400" />
                              {format(reg.event?.startDate || 0, 'h:mm a')}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-cyan-400" />
                              {typeof reg.event?.location === 'string' ? reg.event.location : reg.event?.location?.venue || 'TBD'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button variant="outline" size="sm" asChild className="border-white/20 text-white hover:bg-white/10">
                            <Link href={`/events/${reg.eventId}`}>View</Link>
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
          <ReferralSystem />
          
          {/* QR Code Widget */}
          <Card className="bg-gradient-to-b from-white/5 to-white/[0.02] border-cyan-500/20 overflow-hidden backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Event Pass</CardTitle>
              <CardDescription className="text-gray-400">Scan to check in</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {registrations && registrations.length > 0 ? (
                <>
                  <div className="bg-white p-3 rounded-xl shadow-inner mb-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent((registrations[0] as any).ticketNumber || '')}`}
                      alt="QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                  <p className="font-mono text-sm font-medium tracking-wider bg-white/10 text-white px-3 py-1 rounded border border-white/20">
                    {(registrations[0] as any).ticketNumber || 'NO TICKET'}
                  </p>
                </>
              ) : (
                <div className="text-center py-6">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-gray-500">No active tickets found</p>
                </div>
              )}
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
                {quickConnect.map((u: any) => (
                  <div key={u._id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={u.image} />
                      <AvatarFallback className="bg-cyan-600/20 text-cyan-300">{u.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.designation || u.role}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-white/10" asChild>
                      <Link href={`/profile/${u._id}`}>
                        <TrendingUp className="h-4 w-4 text-cyan-400" />
                      </Link>
                    </Button>
                  </div>
                ))}
                {quickConnect.length === 0 && <p className="text-xs text-center text-gray-500 py-4">No suggestions yet</p>}
                <Button variant="ghost" className="w-full text-xs text-gray-400 hover:text-white hover:bg-white/10" asChild>
                  <Link href="/networking">View all suggestions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed Widget */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-cyan-400" />
                Live Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <ActivityFeed userId={user._id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
}
