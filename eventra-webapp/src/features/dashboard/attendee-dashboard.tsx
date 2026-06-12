'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Trophy, 
  Ticket, 
  Activity, 
  QrCode, 
  Zap, 
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/core/utils/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ActivityFeed } from '@/features/feed/activity-feed';
import { EngagementMetrics } from './engagement-metrics';
import { ReferralSystem } from './referral-system';
import { getUserRegistrations } from '@/app/actions/registrations';
import { getEvents } from '@/app/actions/events';
import { getActivityFeed } from '@/app/actions/feed';

export default function AttendeeDashboard() {
  const { user } = useAuth();
  const t = useTranslations('Dashboard');
  const tc = useTranslations('Common');

  const [registrations, setRegistrations] = React.useState<any[]>([]);
  const [featuredEvents, setFeaturedEvents] = React.useState<any[]>([]);
  const [activities, setActivities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [regData, eventData, activityData] = await Promise.all([
          getUserRegistrations(),
          getEvents({ limit: 6 }),
          getActivityFeed({ userId: user.id, limit: 10 })
        ]);
        setRegistrations(regData);
        setFeaturedEvents(eventData);
        setActivities(activityData);
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-40">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-notion-hairline border-t-notion-primary animate-spin" />
          <p className="text-body-sm text-notion-ink-muted">Syncing with mesh...</p>
        </div>
      </div>
    );
  }

  const upcomingEvent = registrations.length > 0 ? registrations[0].event : null;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-notion-hairline pb-8">
        <div className="space-y-4">
          <Badge variant="outline" className="text-notion-primary border-notion-primary/20 bg-notion-primary/5">
            Attendee Console
          </Badge>
          <h1 className="text-display-2 leading-none">
            Welcome back, <br />
            <span className="text-notion-primary italic">{user.name?.split(' ')[0]}</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" asChild className="h-12 shadow-notion-soft">
            <Link href="/my-events">Manage Tickets</Link>
          </Button>
          <Button variant="primary" size="lg" asChild className="h-12 shadow-notion-elevated">
            <Link href="/explore">
              Explore events <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Passes', value: registrations.length, icon: Ticket, color: 'text-notion-primary' },
          { label: 'Network XP', value: user.xp || 0, icon: Trophy, color: 'text-notion-accent-orange' },
          { label: 'Node Level', value: user.level || 1, icon: Zap, color: 'text-notion-accent-teal' },
          { label: 'Syncs', value: registrations.filter((r: any) => r.ticket.status === 'checked-in').length, icon: Activity, color: 'text-notion-accent-green' },
        ].map((stat, i) => (
          <Card key={i} className="p-6 hover:shadow-notion-soft transition-shadow border-notion-hairline">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-notion-canvas-soft flex items-center justify-center">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div className="space-y-0.5">
                 <p className="text-title font-bold leading-none">{stat.value}</p>
                 <p className="text-eyebrow text-notion-ink-muted uppercase">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          
          {/* UP NEXT HERO */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
               <h2 className="text-h2">Next mission</h2>
            </div>
            {upcomingEvent ? (
              <Card variant="elevated-hover" className="overflow-hidden group cursor-pointer border-notion-hairline">
                <Link href={`/events/${upcomingEvent.id}`}>
                  <div className="grid md:grid-cols-5 h-full">
                    <div className="md:col-span-3 p-10 flex flex-col justify-between space-y-8">
                       <div className="space-y-6">
                          <Badge variant="secondary" className="bg-notion-accent-green/10 text-notion-accent-green">
                             Incoming Experience
                          </Badge>
                          <h3 className="text-h1 group-hover:text-notion-primary transition-colors">
                             {upcomingEvent.title}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="flex items-center gap-3 text-body-sm text-notion-ink-secondary">
                                <Calendar className="w-4 h-4 text-notion-primary" />
                                <span>{format(new Date(upcomingEvent.startDate), 'MMM do, yyyy')}</span>
                             </div>
                             <div className="flex items-center gap-3 text-body-sm text-notion-ink-secondary">
                                <Clock className="w-4 h-4 text-notion-primary" />
                                <span>{format(new Date(upcomingEvent.startDate), 'h:mm a')}</span>
                             </div>
                             <div className="flex items-center gap-3 text-body-sm text-notion-ink-secondary col-span-full">
                                <MapPin className="w-4 h-4 text-notion-primary" />
                                <span className="truncate">{upcomingEvent.location?.venue || upcomingEvent.location || 'Virtual Platform'}</span>
                             </div>
                          </div>
                       </div>
                       <Button variant="utility" className="w-fit">View full details</Button>
                    </div>
                    <div className="md:col-span-2 relative h-64 md:h-auto min-h-[300px] bg-notion-canvas-soft overflow-hidden">
                       {upcomingEvent.imageUrl ? (
                          <Image 
                             src={upcomingEvent.imageUrl} 
                             alt={upcomingEvent.title}
                             fill
                             className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center">
                             <Sparkles className="w-16 h-16 text-notion-ink-faint/20" />
                          </div>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-l from-transparent to-notion-surface/20 hidden md:block" />
                    </div>
                  </div>
                </Link>
              </Card>
            ) : (
              <Card variant="soft" className="p-20 text-center border-dashed border-2 border-notion-hairline">
                 <div className="max-w-xs mx-auto space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-notion-canvas flex items-center justify-center mx-auto shadow-notion-soft">
                       <Calendar className="w-6 h-6 text-notion-ink-muted" />
                    </div>
                    <h3 className="text-title">Your agenda is clear.</h3>
                    <p className="text-body-sm text-notion-ink-muted">Explore the network to find your next live experience.</p>
                    <Button asChild variant="primary" className="mt-4">
                      <Link href="/explore">Start Exploring</Link>
                    </Button>
                 </div>
              </Card>
            )}
          </section>

          <EngagementMetrics userId={user.id} />

          {/* Recommended Events */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-1">
                <h2 className="text-h2 flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-notion-primary" />
                  Neural Suggestions
                </h2>
                <p className="text-body-sm text-notion-ink-muted">Tailored to your activity nodes.</p>
              </div>
              <Link href="/explore" className="text-eyebrow font-bold text-notion-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <ScrollArea className="w-full pb-4">
              <div className="flex gap-6">
                {featuredEvents.map((event: any) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="group block w-72 shrink-0">
                    <Card className="p-0 overflow-hidden hover:shadow-notion-soft transition-shadow border-notion-hairline">
                      <div className="aspect-video relative overflow-hidden bg-notion-canvas-soft">
                        {event.imageUrl ? (
                          <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Calendar size={32} className="text-notion-ink-faint/30" />
                          </div>
                        )}
                        <Badge variant="secondary" className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-notion-ink border-none">
                          {event.category}
                        </Badge>
                      </div>
                      <div className="p-5 space-y-3">
                        <h3 className="text-title font-bold truncate group-hover:text-notion-primary transition-colors">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 text-body-sm text-notion-ink-secondary">
                          <Calendar className="h-3.5 w-3.5 text-notion-primary" />
                          <span>{format(new Date(event.startDate), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          <ReferralSystem />

          {/* Digital Pass */}
          <Card className="p-8 space-y-8 border-notion-hairline relative overflow-hidden bg-notion-surface">
               <div className="absolute top-0 right-0 w-32 h-32 bg-notion-primary/5 blur-[40px] rounded-full -mr-16 -mt-16" />
               <div className="space-y-2 relative z-10">
                  <Badge variant="outline" className="text-notion-primary border-notion-primary/20">
                     Digital Pass
                  </Badge>
                  <h3 className="text-h3">Access Token</h3>
               </div>
               
               <div className="flex flex-col items-center relative z-10">
                  {registrations && registrations.length > 0 ? (
                    <>
                      <div className="bg-notion-ink p-6 rounded-xl mb-8 shadow-notion-elevated">
                        <QrCode className="w-28 h-28 text-notion-canvas" />
                      </div>
                      <div className="w-full space-y-6 text-center">
                        <div className="space-y-1">
                          <p className="text-eyebrow text-notion-ink-faint uppercase">Verification_Key</p>
                          <p className="font-mono text-body-md font-bold tracking-widest">
                            {registrations[0].ticket.ticketNumber || 'EV-000-000'}
                          </p>
                        </div>
                        <Button variant="utility" className="w-full" asChild>
                          <Link href="/tickets">All access points</Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 opacity-30">
                      <QrCode className="h-16 w-16 mx-auto mb-4 text-notion-ink-muted" />
                      <p className="text-eyebrow uppercase">No tokens found</p>
                    </div>
                  )}
               </div>
          </Card>

          <ActivityFeed initialActivities={activities} userId={user.id} />
        </div>
      </div>
    </div>
  );
}
