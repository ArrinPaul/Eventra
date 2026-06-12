'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/core/utils/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Trophy, 
  Users, 
  Ticket, 
  Activity, 
  QrCode, 
  Loader2, 
  Zap, 
  Star,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ActivityFeed } from '@/features/feed/activity-feed';
import { EngagementMetrics } from './engagement-metrics';
import { ReferralSystem } from './referral-system';
import { useTranslations } from 'next-intl';
import { getUserRegistrations } from '@/app/actions/registrations';
import { getEvents } from '@/app/actions/events';
import { getActivityFeed } from '@/app/actions/feed';
import React from 'react';
import { useAuth } from '@/hooks/use-auth';
...
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
      <div className="flex h-full items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border-4 border-primary/10 border-t-primary animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing Network...</p>
        </div>
      </div>
    );
  }

  const upcomingEvent = registrations.length > 0 ? registrations[0].event : null;

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em]">
            Attendee Console
          </Badge>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter leading-none">
            Welcome back, <br />
            <span className="text-primary italic">{user.name?.split(' ')[0]}</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" size="lg" asChild className="rounded-2xl h-14 px-8 border-2 font-black uppercase tracking-widest text-[11px] hover:bg-muted transition-all">
            <Link href="/my-events">Manage Tickets</Link>
          </Button>
          <Button size="lg" asChild className="rounded-2xl h-14 px-8 bg-primary text-primary-foreground shadow-glow shadow-primary/20 font-black uppercase tracking-widest text-[11px] border-none">
            <Link href="/explore">
              {tc('explore')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* UP NEXT HERO */}
      {upcomingEvent ? (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group cursor-pointer"
        >
          <Link href={`/events/${upcomingEvent.id}`}>
            <div className="relative overflow-hidden rounded-[3rem] bg-background border border-border/80 shadow-2xl hover:border-primary/30 transition-all duration-500">
               <div className="grid md:grid-cols-2">
                  <div className="p-10 md:p-16 flex flex-col justify-between space-y-12">
                     <div className="space-y-6">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                           Incoming Experience
                        </Badge>
                        <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tighter leading-tight group-hover:text-primary transition-colors">
                           {upcomingEvent.title}
                        </h2>
                        <div className="flex flex-col gap-4">
                           <div className="flex items-center gap-4 text-muted-foreground font-bold">
                              <Calendar className="w-5 h-5 text-primary" />
                              <span>{format(new Date(upcomingEvent.startDate), 'MMMM do, yyyy')}</span>
                           </div>
                           <div className="flex items-center gap-4 text-muted-foreground font-bold">
                              <Clock className="w-5 h-5 text-primary" />
                              <span>{format(new Date(upcomingEvent.startDate), 'h:mm a')}</span>
                           </div>
                           <div className="flex items-center gap-4 text-muted-foreground font-bold">
                              <MapPin className="w-5 h-5 text-primary" />
                              <span className="truncate">{upcomingEvent.location?.venue || upcomingEvent.location || 'Virtual Platform'}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="flex -space-x-3">
                           {[1, 2, 3, 4].map(i => (
                             <div key={i} className="w-10 h-10 rounded-full border-4 border-background bg-muted shadow-sm" />
                           ))}
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                           +{upcomingEvent.registeredCount || 0} Attending
                        </span>
                     </div>
                  </div>
                  <div className="relative h-64 md:h-full min-h-[400px] overflow-hidden">
                     {upcomingEvent.imageUrl ? (
                        <Image 
                           src={upcomingEvent.imageUrl} 
                           alt={upcomingEvent.title}
                           fill
                           className="object-cover group-hover:scale-105 transition-transform duration-1000"
                        />
                     ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                           <Sparkles className="w-20 h-20 text-muted-foreground/20" />
                        </div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background hidden md:block" />
                  </div>
               </div>
            </div>
          </Link>
        </motion.section>
      ) : (
        <section className="rounded-[3rem] border-2 border-dashed border-border bg-muted/20 p-20 text-center">
           <div className="max-w-md mx-auto space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                 <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-display font-bold">No upcoming missions.</h3>
              <p className="text-muted-foreground font-medium">Your agenda is currently clear. Explore the network to find your next experience.</p>
              <Button asChild size="lg" className="rounded-2xl px-10 shadow-glow font-black h-14">
                <Link href="/explore">Start Exploring</Link>
              </Button>
           </div>
        </section>
      )}

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: 'Active Passes', value: registrations.length, icon: Ticket, color: 'text-primary' },
          { label: 'Network XP', value: user.xp || user.points || 0, icon: Trophy, color: 'text-amber-500' },
          { label: 'Node Level', value: user.level || 1, icon: Zap, color: 'text-emerald-500' },
          { label: 'Total Syncs', value: registrations.filter((r: any) => r.ticket.status === 'checked-in').length, icon: Activity, color: 'text-cyan-500' },
        ].map((stat, i) => (
          <Card key={i} className="p-8 group border-none shadow-2xl hover:shadow-primary/5">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div className="space-y-1">
               <p className="text-4xl font-display font-bold tracking-tighter leading-none">{stat.value}</p>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          <EngagementMetrics userId={user.id} />

          {/* Recommended Events */}
          <section className="space-y-10">
            <div className="flex items-center justify-between px-2">
              <div className="space-y-2">
                <h2 className="text-3xl font-display font-bold tracking-tighter flex items-center gap-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                  Neural Recommendations
                </h2>
                <p className="text-sm font-medium text-muted-foreground">Based on your activity nodes and interests.</p>
              </div>
              <Button variant="ghost" className="font-black uppercase tracking-widest text-[10px] text-primary group h-auto p-0" asChild>
                <Link href="/explore">
                  View Network <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max space-x-8 pb-8 px-1">
                {featuredEvents.map((event: any) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="group block w-[360px]">
                    <Card className="p-4 border-none shadow-2xl hover:shadow-primary/5">
                      <div className="aspect-[16/10] w-full relative overflow-hidden rounded-[2rem] bg-muted mb-6">
                        {event.imageUrl ? (
                          <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            sizes="360px"
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Calendar size={48} className="text-muted-foreground/20" />
                          </div>
                        )}
                        <Badge className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-md text-foreground border-none font-black text-[9px] uppercase tracking-widest">
                          {event.category}
                        </Badge>
                      </div>
                      <div className="px-4 pb-4">
                        <h3 className="text-2xl font-display font-bold tracking-tight text-foreground truncate group-hover:text-primary transition-colors mb-3">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{format(new Date(event.startDate), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-2" />
            </ScrollArea>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-12">
          <ReferralSystem />

          {/* Digital Pass */}
          <Card className="p-10 space-y-10 border-none shadow-2xl group overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full -mr-16 -mt-16" />
               <div className="space-y-2 relative z-10">
                  <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                     Digital Pass
                  </Badge>
                  <h3 className="text-2xl font-display font-bold tracking-tight">Access Token</h3>
               </div>
               
               <div className="flex flex-col items-center relative z-10">
                  {registrations && registrations.length > 0 ? (
                    <>
                      <div className="bg-foreground p-8 rounded-[2.5rem] mb-10 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                        <QrCode className="w-32 h-32 text-background" />
                      </div>
                      <div className="w-full space-y-6 text-center">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Verification_Key</p>
                          <p className="font-mono text-lg font-bold tracking-[0.2em] text-foreground">
                            {registrations[0].ticket.ticketNumber || 'EV-000-000'}
                          </p>
                        </div>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/tickets">All Access Points</Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 opacity-30">
                      <QrCode className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
                      <p className="text-xs font-black uppercase tracking-widest">No Active tokens</p>
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
