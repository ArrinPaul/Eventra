'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
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
  Star
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ActivityFeed } from '@/features/feed/activity-feed';
import { EngagementMetrics } from './engagement-metrics';
import { ReferralSystem } from './referral-system';
import { useTranslations } from 'next-intl';
import { getUserRegistrations } from '@/app/actions/registrations';
import { getEvents } from '@/app/actions/events';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function AttendeeDashboard() {
  const { user } = useAuth();
  const t = useTranslations('Dashboard');
  const tc = useTranslations('Common');

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [regData, eventData] = await Promise.all([
          getUserRegistrations(),
          getEvents({ limit: 6 })
        ]);
        setRegistrations(regData);
        setFeaturedEvents(eventData);
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
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse">Synchronizing your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Welcome Section */}
      <motion.section
        className="relative overflow-hidden rounded-[2.5rem] bg-card border border-border p-8 md:p-12 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">
              {t('welcome', { name: user.name?.split(' ')[0] ?? 'Explorer' })}
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              You're registered for <span className="text-primary font-bold">{registrations.length} upcoming</span> events.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild className="rounded-2xl px-8 shadow-glow">
              <Link href="/explore">
                {tc('explore')} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-2xl px-8 border-2">
              <Link href="/my-events">Manage Tickets</Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats Overlay */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
          {[
            { label: 'Active Passes', value: registrations.length, icon: Ticket, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Experience Points', value: user.xp || user.points || 0, icon: Trophy, color: 'text-warning', bg: 'bg-warning/10' },
            { label: 'Platform Level', value: user.level || 1, icon: Zap, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Total Check-ins', value: registrations.filter((r: any) => r.ticket.status === 'checked-in').length, icon: Star, color: 'text-info', bg: 'bg-info/10' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-1 p-4 rounded-2xl bg-muted/30 border border-border/50">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <p className="text-3xl font-black text-foreground leading-none">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <EngagementMetrics userId={user.id} />

          {/* Recommended Events */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Recommended for You
                </h2>
                <p className="text-sm font-medium text-muted-foreground">Based on your interests and past attendance</p>
              </div>
              <Button variant="ghost" className="font-bold text-primary group" asChild>
                <Link href="/explore">
                  {t('viewAll')} <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max space-x-6 pb-6 px-1">
                {featuredEvents.map((event: any) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="group block w-[320px]">
                    <Card variant="default" className="overflow-hidden border-border/50 group-hover:border-primary/40 group-hover:shadow-elevated transition-all duration-500 rounded-[2rem]">
                      <div className="aspect-[16/10] w-full relative overflow-hidden bg-muted">
                        {event.imageUrl ? (
                          <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            sizes="320px"
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-info/10 group-hover:from-primary/10 transition-colors">
                            <Calendar size={48} className="text-primary/10" />
                          </div>
                        )}
                        <Badge variant="glass" className="absolute top-4 left-4 z-10 backdrop-blur-md border-white/20">
                          {event.category}
                        </Badge>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-black text-foreground truncate group-hover:text-primary transition-colors mb-2">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          {format(new Date(event.startDate), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center justify-between mt-6 pt-5 border-t border-border/50">
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-2">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] font-bold">
                                  {String.fromCharCode(64 + i)}
                                </div>
                              ))}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                              +{event.registeredCount ?? 0}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black border-border/50">
                            {event.type === 'physical' ? 'Physical' : 'Digital'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-2" />
            </ScrollArea>
          </motion.section>

          {/* Upcoming Schedule */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-foreground">Your Event Schedule</h2>
              <Button variant="ghost" size="sm" asChild className="font-bold text-muted-foreground hover:text-foreground">
                <Link href="/agenda">View Full Agenda</Link>
              </Button>
            </div>

            <Card className="overflow-hidden border-border/50 rounded-[2rem] shadow-xl">
              <CardContent className="p-0">
                {registrations.length > 0 ? (
                  <div className="divide-y divide-border/30">
                    {registrations.map((reg: any) => (
                      <div key={reg.ticket.id} className="flex items-center gap-6 p-6 hover:bg-primary/[0.02] transition-colors group">
                        <div className="flex-shrink-0 w-16 text-center bg-card border border-border rounded-2xl p-3 group-hover:border-primary/30 transition-colors">
                          <span className="block text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                            {format(new Date(reg.event?.startDate || 0), 'MMM')}
                          </span>
                          <span className="block text-2xl font-black text-foreground leading-none">
                            {format(new Date(reg.event?.startDate || 0), 'd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">{reg.event?.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-muted-foreground mt-1.5">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-primary" />
                              {format(new Date(reg.event?.startDate || 0), 'h:mm a')}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-primary" />
                              {typeof reg.event?.location === 'string' ? reg.event.location : reg.event?.location?.venue || 'Virtual Event'}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild className="rounded-xl flex-shrink-0 border-2 font-bold px-6">
                          <Link href={`/events/${reg.event.id}`}>{tc('view')}</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 px-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-muted/30 flex items-center justify-center mx-auto mb-6">
                      <Calendar className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-2">{t('noUpcoming')}</h3>
                    <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">Build your dream schedule by exploring our curated selection of upcoming experiences.</p>
                    <Button asChild size="lg" className="rounded-2xl px-10 shadow-glow font-black">
                      <Link href="/explore">Start Exploring</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <ReferralSystem />

          {/* Event Pass / QR */}
          <Card className="border-border/50 rounded-[2rem] shadow-xl overflow-hidden group">
            <div className="bg-primary/5 p-6 border-b border-border/50">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                Your Digital Pass
              </h3>
              <p className="text-xs font-bold text-muted-foreground mt-1">Ready for instant check-in</p>
            </div>
            <CardContent className="flex flex-col items-center p-8">
              {registrations && registrations.length > 0 ? (
                <>
                  <div className="bg-white p-5 rounded-3xl mb-6 shadow-2xl group-hover:scale-105 transition-transform duration-500 border-8 border-primary/5">
                    <QrCode className="w-32 h-32 text-slate-900" />
                  </div>
                  <div className="w-full space-y-4">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Verification Code</p>
                      <p className="font-mono text-base font-black tracking-widest bg-muted/50 text-foreground px-4 py-2 rounded-xl">
                        {registrations[0].ticket.ticketNumber || 'EV-000-000'}
                      </p>
                    </div>
                    <Button variant="outline" className="w-full rounded-xl border-2 font-bold" asChild>
                      <Link href="/tickets">View All Passes</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 opacity-50">
                  <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-sm font-bold text-muted-foreground">No active passes found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="border-border/50 rounded-[2rem] shadow-xl overflow-hidden">
            <div className="bg-primary/5 p-6 border-b border-border/50">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Live Network Feed
              </h3>
            </div>
            <CardContent className="p-0">
              <ActivityFeed userId={user.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
