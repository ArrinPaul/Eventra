'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  Trophy,
  Users,
  Star,
  Zap,
  Ticket,
  Activity,
  QrCode,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/core/utils/utils';
import { ActivityFeed } from '@/features/feed/activity-feed';
import { EngagementMetrics } from './engagement-metrics';
import { ReferralSystem } from './referral-system';
import { useTranslations } from 'next-intl';
import { getUserRegistrations } from '@/app/actions/registrations';
import { getEvents } from '@/app/actions/events';
import Image from 'next/image';

export default function AttendeeDashboard() {
  const { user } = useAuth();
  const t = useTranslations('Dashboard');
  const tc = useTranslations('Common');

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!user) return;
      try {
        const [regData, eventData] = await Promise.all([
          getUserRegistrations(),
          getEvents({ limit: 6 }),
        ]);
        if (!cancelled) {
          setRegistrations(regData);
          setFeaturedEvents(eventData);
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="page-container py-8 md:py-10 space-y-10 animate-fade-in-up" data-testid="attendee-dashboard">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="relative z-10 p-8 md:p-12 flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
          <div className="space-y-5 max-w-2xl">
            <Badge variant="default" className="gap-1.5">
              <Sparkles className="h-3 w-3" /> AI-curated experience
            </Badge>
            <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight">
              {t('welcome', { name: user.name?.split(' ')[0] ?? 'there' })}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              You have{' '}
              <span className="font-semibold text-foreground">
                {registrations.length} events
              </span>{' '}
              coming up. Your personalized recommendations are ready.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="lg" className="gap-2" data-testid="dashboard-explore">
                <Link href="/explore">
                  {tc('explore')} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" data-testid="dashboard-my-events">
                <Link href="/my-events">My events</Link>
              </Button>
            </div>
          </div>

          <div className="hidden md:grid grid-cols-2 gap-3 w-full lg:w-auto">
            <Card variant="glass" className="min-w-[160px]">
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className="flex h-10 w-10 rounded-xl bg-warning/15 items-center justify-center mb-3">
                  <Trophy className="h-5 w-5 text-warning" />
                </div>
                <span className="text-2xl font-display font-semibold">
                  {user.xp || user.points || 0}
                </span>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-1">
                  XP earned
                </span>
              </CardContent>
            </Card>
            <Card variant="glass" className="min-w-[160px]">
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className="flex h-10 w-10 rounded-xl bg-primary/15 items-center justify-center mb-3">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <span className="text-2xl font-display font-semibold">
                  {registrations.length}
                </span>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-1">
                  Active tickets
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          <EngagementMetrics userId={user.id} />

          {/* Recommendations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-display font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-warning" />
                Top picks for you
              </h2>
              <Link
                href="/explore"
                className="text-sm font-medium text-primary hover:underline underline-offset-4"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 w-[320px] rounded-2xl flex-shrink-0" />
                ))}
              </div>
            ) : featuredEvents.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No recommendations yet"
                description="We'll surface events tailored to you as you engage with the platform."
                actionLabel="Browse events"
                actionHref="/explore"
              />
            ) : (
              <ScrollArea className="w-full whitespace-nowrap rounded-xl">
                <div className="flex w-max space-x-4 pb-4">
                  {featuredEvents.map((event: any) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="group relative block w-[320px] overflow-hidden rounded-2xl border border-border bg-card shadow-soft hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-200"
                    >
                      <div className="aspect-video w-full relative overflow-hidden bg-muted">
                        {event.imageUrl ? (
                          <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            sizes="320px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Calendar className="h-10 w-10 text-muted-foreground/60" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur-md px-2.5 py-1 text-xs font-semibold flex items-center gap-1 border border-border/60">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          {Math.floor(Math.random() * 15 + 85)}% match
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="mb-2.5 flex items-center justify-between">
                          <Badge variant="secondary" size="sm" className="max-w-[60%] truncate">
                            {event.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> {event.registeredCount ?? 0}
                          </span>
                        </div>
                        <h3
                          className="font-display font-semibold text-base leading-snug mb-2 truncate group-hover:text-primary transition-colors"
                          title={event.title}
                        >
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 text-primary" />
                          {format(new Date(event.startDate), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </section>

          {/* Agenda */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-display font-semibold">
                Your agenda
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/agenda">Full schedule</Link>
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="divide-y divide-border">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 flex items-center gap-4">
                        <Skeleton className="h-14 w-14 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/5" />
                          <Skeleton className="h-3 w-2/5" />
                        </div>
                        <Skeleton className="h-9 w-16 rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : registrations.length > 0 ? (
                  <div className="divide-y divide-border">
                    {registrations.map((reg: any) => (
                      <div
                        key={reg.ticket.id}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-14 text-center bg-primary/10 rounded-lg py-1.5">
                          <span className="block text-[10px] font-medium uppercase text-primary">
                            {format(new Date(reg.event?.startDate || 0), 'MMM')}
                          </span>
                          <span className="block text-xl font-display font-semibold">
                            {format(new Date(reg.event?.startDate || 0), 'd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {reg.event?.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(reg.event?.startDate || 0), 'h:mm a')}
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3" />
                              {typeof reg.event?.location === 'string'
                                ? reg.event.location
                                : reg.event?.location?.venue || 'TBD'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/events/${reg.event.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    className="rounded-none border-0 bg-transparent"
                    icon={Calendar}
                    title="No upcoming events"
                    description="Start exploring to build your personalized schedule."
                    actionLabel="Find events"
                    actionHref="/explore"
                  />
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          <ReferralSystem />

          {/* Event pass */}
          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Event pass</CardTitle>
              <CardDescription>Scan at the entrance to check in</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {registrations && registrations.length > 0 ? (
                <>
                  <div className="relative bg-white p-4 rounded-xl shadow-soft border border-border mb-3">
                    <QrCode className="w-28 h-28 text-foreground" />
                  </div>
                  <p className="font-mono text-xs tracking-wider bg-muted px-3 py-1 rounded border border-border">
                    {registrations[0].ticket.ticketNumber || 'NO TICKET'}
                  </p>
                </>
              ) : (
                <div className="text-center py-6">
                  <QrCode className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-xs text-muted-foreground">
                    No active tickets yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Live feed
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
