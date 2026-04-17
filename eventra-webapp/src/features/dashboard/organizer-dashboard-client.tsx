'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import {
  Plus,
  Calendar,
  Users,
  Ticket,
  ArrowUpRight,
  Search,
  Loader2,
  Trash2,
  Edit,
  Copy,
  BrainCircuit,
  ChevronRight,
  Award,
  MessageSquare,
  Clock,
  Activity,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueDashboard } from '@/features/organizer/revenue-dashboard';
import { getEvents, deleteEvent } from '@/app/actions/events';
import type { EventraEvent } from '@/types';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/core/utils/utils';

function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  tone,
}: {
  icon: any;
  label: string;
  value: string | number;
  trend?: string;
  tone: 'primary' | 'info' | 'success' | 'warning';
}) {
  const tones: Record<string, string> = {
    primary: 'bg-primary/12 text-primary',
    info: 'bg-info/12 text-info',
    success: 'bg-success/12 text-success',
    warning: 'bg-warning/12 text-warning',
  };
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-6">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <Badge variant="success" size="sm" className="gap-1">
              <TrendingUp className="h-3 w-3" /> {trend}
            </Badge>
          )}
        </div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl md:text-3xl font-display font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [managedEvents, setManagedEvents] = useState<EventraEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('events');
  const [isCloning, setIsCloning] = useState<string | null>(null);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getEvents({
        organizerId: user.id,
        status: 'published',
      });
      setManagedEvents(data as any);
    } catch {
      toast({ title: 'Error', description: 'Failed to load events.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredEvents = managedEvents.filter((e: EventraEvent) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRegistrations = managedEvents.reduce(
    (sum, e) => sum + (e.registeredCount || 0),
    0
  );
  const activeEvents = managedEvents.filter((e) => e.status === 'published').length;
  const totalRevenue = managedEvents.reduce(
    (sum, e) =>
      sum + (e.isPaid ? Number(e.price || 0) * (e.registeredCount || 0) : 0),
    0
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id);
      toast({ title: 'Event deleted' });
      loadData();
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleClone = async (id: string) => {
    setIsCloning(id);
    try {
      toast({ title: 'Cloning coming soon', description: 'This feature is being ported.' });
    } catch {
      toast({ title: 'Failed to clone event', variant: 'destructive' });
    } finally {
      setIsCloning(null);
    }
  };

  return (
    <div className="page-container py-8 md:py-10 space-y-8 animate-fade-in-up" data-testid="organizer-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="section-eyebrow mb-1.5">Organizer</p>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your events and track performance at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" data-testid="dashboard-scanner">
            <Link href="/check-in-scanner">Open scanner</Link>
          </Button>
          <Button asChild className="gap-2" data-testid="dashboard-create-event">
            <Link href="/events/create">
              <Plus className="h-4 w-4" /> Create event
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Calendar} label="Total events" value={managedEvents.length} trend={`${activeEvents} active`} tone="primary" />
        <KpiCard icon={Users} label="Attendees" value={totalRegistrations.toLocaleString()} trend="+12%" tone="info" />
        <KpiCard icon={Ticket} label="Tickets sold" value={totalRegistrations.toLocaleString()} tone="success" />
        <KpiCard icon={DollarSign} label="Revenue" value={`$${totalRevenue.toLocaleString()}`} trend="+8%" tone="warning" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl border border-border">
          {[
            { v: 'events', l: 'My events' },
            { v: 'revenue', l: 'Revenue' },
            { v: 'insights', l: 'AI insights' },
            { v: 'feedback', l: 'Feedback' },
            { v: 'team', l: 'Team' },
            { v: 'waitlist', l: 'Waitlist' },
            { v: 'sponsors', l: 'Sponsors' },
            { v: 'pulse', l: 'Live pulse' },
          ].map((tab) => (
            <TabsTrigger
              key={tab.v}
              value={tab.v}
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft data-[state=active]:text-foreground px-3 py-1.5"
            >
              {tab.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>My events</CardTitle>
                  <CardDescription>
                    You are managing {managedEvents.length}{' '}
                    {managedEvents.length === 1 ? 'event' : 'events'}.
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events…"
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="organizer-search-input"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No events yet"
                  description="Start by creating your first event to build your community."
                  actionLabel="Create event"
                  actionHref="/events/create"
                />
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((event: any) => {
                    const isOwner =
                      event.organizerId === (user?._id || user?.id);
                    return (
                      <div
                        key={event._id || event.id}
                        className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/40 transition-all"
                        data-testid={`event-row-${event._id || event.id}`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="flex-shrink-0 w-14 text-center rounded-lg bg-primary/10 py-1.5">
                            <span className="block text-[10px] font-semibold uppercase text-primary">
                              {format(new Date(event.startDate), 'MMM')}
                            </span>
                            <span className="block text-xl font-display font-semibold">
                              {format(new Date(event.startDate), 'dd')}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">
                                {event.title}
                              </h3>
                              {!isOwner && (
                                <Badge variant="purple" size="sm">
                                  Co-organizer
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />{' '}
                                {event.registeredCount || 0}
                              </span>
                              <Badge variant="outline" size="sm">
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleClone(event._id || event.id)}
                            disabled={isCloning === (event._id || event.id)}
                            aria-label="Clone event"
                          >
                            {isCloning === (event._id || event.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon-sm" asChild aria-label="Open event">
                            <Link href={`/events/${event._id || event.id}`}>
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon-sm" asChild aria-label="Edit event">
                            <Link href={`/events/${event._id || event.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(event._id || event.id)}
                              aria-label="Delete event"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueDashboard />
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Event intelligence</CardTitle>
              <CardDescription>
                Select an event to view deep AI insights and predictions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {managedEvents.length === 0 ? (
                <EmptyState
                  icon={BrainCircuit}
                  title="No events to analyze yet"
                  description="Create an event to unlock AI-powered insights and forecasts."
                  actionLabel="Create event"
                  actionHref="/events/create"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {managedEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="group hover:border-primary/40 transition-colors cursor-pointer"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-3">
                          <CardTitle className="text-sm truncate">
                            {event.title}
                          </CardTitle>
                          <BrainCircuit className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardHeader>
                      <CardFooter>
                        <Button variant="link" size="sm" asChild>
                          <Link href={`/organizer/insights/${event.id}`}>
                            View deep insights{' '}
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {['feedback', 'team', 'waitlist', 'sponsors', 'pulse'].map((tabKey) => {
          const config: Record<string, { title: string; desc: string; icon: any; tone: string; href: (id: string) => string; cta: string }> = {
            feedback: { title: 'Feedback system', desc: 'Manage custom questionnaires and view satisfaction trends.', icon: MessageSquare, tone: 'bg-primary/10 text-primary', href: (id) => `/organizer/feedback/analytics/${id}`, cta: 'View analytics' },
            team: { title: 'Team & collaboration', desc: 'Manage event-specific staff, volunteers, and speakers.', icon: Users, tone: 'bg-success/10 text-success', href: (id) => `/organizer/collab/${id}`, cta: 'Manage team' },
            waitlist: { title: 'Waitlist & promotion', desc: 'Monitor event queues and auto-promoted attendees.', icon: Clock, tone: 'bg-warning/10 text-warning', href: (id) => `/organizer/waitlist/${id}`, cta: 'View queue' },
            sponsors: { title: 'Sponsors & partners', desc: 'Manage event sponsors and their display tiers.', icon: Award, tone: 'bg-info/10 text-info', href: (id) => `/organizer/sponsors/${id}`, cta: 'Manage sponsors' },
            pulse: { title: 'Real-time event pulse', desc: 'Live velocity tracking for registrations and check-ins.', icon: Activity, tone: 'bg-primary/10 text-primary', href: (id) => `/organizer/pulse/${id}`, cta: 'View live pulse' },
          };
          const { title, desc, icon: Icon, tone, href, cta } = config[tabKey];
          return (
            <TabsContent key={tabKey} value={tabKey}>
              <Card>
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  {managedEvents.length === 0 ? (
                    <EmptyState
                      icon={Icon}
                      title="No events to manage"
                      description="Create your first event to enable this workflow."
                      actionLabel="Create event"
                      actionHref="/events/create"
                    />
                  ) : (
                    <div className="space-y-2">
                      {managedEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0', tone)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold truncate">
                                {event.title}
                              </h3>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                                {event.status}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={href(event.id)}>{cta}</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
