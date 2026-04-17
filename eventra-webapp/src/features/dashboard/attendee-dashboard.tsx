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
          getEvents({ limit: 5 })
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome Section */}
      <motion.section
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              {t('welcome', { name: user.name?.split(' ')[0] ?? 'there' })}
            </h1>
            <p className="text-muted-foreground">
              You have <span className="font-medium text-foreground">{registrations.length} events</span> coming up.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="rounded-xl">
              <Link href="/explore">
                {tc('explore')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/my-events">My Events</Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{registrations.length}</p>
                <p className="text-xs text-muted-foreground">Active Tickets</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{user.xp || user.points || 0}</p>
                <p className="text-xs text-muted-foreground">XP Points</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{user.level || 1}</p>
                <p className="text-xs text-muted-foreground">Level</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{registrations.filter((r: any) => r.ticket.status === 'checked-in').length}</p>
                <p className="text-xs text-muted-foreground">Events Attended</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <EngagementMetrics userId={user.id} />

          {/* Recommended Events */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                {t('recommended')}
              </h2>
              <Link href="/explore" className="text-sm font-medium text-primary hover:underline">
                {t('viewAll')}
              </Link>
            </div>

            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max space-x-4 pb-4">
                {featuredEvents.map((event: any) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="group block w-[300px]">
                    <Card className="overflow-hidden border-border hover:shadow-card-hover hover:border-primary/20 transition-all duration-200">
                      <div className="aspect-video w-full relative overflow-hidden bg-muted">
                        {event.imageUrl ? (
                          <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            sizes="300px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                            <Calendar size={40} className="text-primary/20" />
                          </div>
                        )}
                        <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground text-xs">{event.category}</Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors mb-1.5">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(event.startDate), 'MMM d, h:mm a')}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> {event.registeredCount ?? 0}
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {event.type === 'physical' ? 'In Person' : event.type}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </motion.section>

          {/* Upcoming Schedule */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">{t('upcomingEvents')}</h2>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/agenda">Full Schedule</Link>
              </Button>
            </div>

            <Card className="border-border">
              <CardContent className="p-0">
                {registrations.length > 0 ? (
                  <div className="divide-y divide-border">
                    {registrations.map((reg: any) => (
                      <div key={reg.ticket.id} className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex-shrink-0 w-14 text-center bg-primary/5 border border-border rounded-xl p-2">
                          <span className="block text-xs font-medium uppercase text-primary">
                            {format(new Date(reg.event?.startDate || 0), 'MMM')}
                          </span>
                          <span className="block text-lg font-bold text-foreground">
                            {format(new Date(reg.event?.startDate || 0), 'd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{reg.event?.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(reg.event?.startDate || 0), 'h:mm a')}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {typeof reg.event?.location === 'string' ? reg.event.location : reg.event?.location?.venue || 'TBD'}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild className="rounded-lg flex-shrink-0">
                          <Link href={`/events/${reg.event.id}`}>{tc('view')}</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <h3 className="font-medium text-foreground mb-1">{t('noUpcoming')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">Start exploring to build your schedule.</p>
                    <Button asChild className="rounded-xl">
                      <Link href="/explore">{tc('explore')} Events</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ReferralSystem />

          {/* Event Pass / QR */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground">Event Pass</CardTitle>
              <CardDescription className="text-sm">Your latest ticket QR</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {registrations && registrations.length > 0 ? (
                <>
                  <div className="bg-white p-3 rounded-xl mb-3">
                    <QrCode className="w-28 h-28 text-foreground" />
                  </div>
                  <p className="font-mono text-xs font-medium tracking-wider bg-accent text-foreground px-3 py-1.5 rounded-lg">
                    {registrations[0].ticket.ticketNumber || 'NO TICKET'}
                  </p>
                </>
              ) : (
                <div className="text-center py-6">
                  <QrCode className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No active tickets</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Live Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <ActivityFeed userId={user.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
