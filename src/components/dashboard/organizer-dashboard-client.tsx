'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Calendar,
  Users,
  Ticket,
  BarChart3,
  Settings,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { eventService } from '@/core/services/firestore-services';
import { useToast } from '@/hooks/use-toast';
import type { Event } from '@/types';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

function StatCard({ title, value, change, icon: Icon, trend, description }: StatCardProps) {
  return (
    <Card className="group bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
            <Icon className="h-7 w-7 text-cyan-400" />
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full",
              trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' : trend === 'down' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-400'
            )}>
              {trend === 'up' && <TrendingUp className="h-4 w-4" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4" />}
              {change > 0 ? '+' : ''}{change}%
            </div>
          )}
        </div>
        <div className="mt-5">
          <p className="text-4xl font-bold tracking-tight text-white">{value}</p>
          <p className="text-sm font-medium text-gray-400 mt-2">{title}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface EventRowProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onDuplicate: (event: Event) => void;
}

function EventRow({ event, onEdit, onDelete, onDuplicate }: EventRowProps) {
  const displayDate = event.startDate ? new Date(event.startDate) : new Date(event.date || '');
  const isUpcoming = displayDate > new Date();
  const isPast = displayDate < new Date();

  const getStatusColor = () => {
    if (event.status === 'cancelled') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (event.status === 'draft') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (isPast) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  const getStatusText = () => {
    if (event.status === 'cancelled') return 'Cancelled';
    if (event.status === 'draft') return 'Draft';
    if (isPast) return 'Completed';
    return 'Active';
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all duration-200 group border border-transparent hover:border-white/10">
      {/* Date Column */}
      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 flex flex-col items-center justify-center group-hover:shadow-md transition-all duration-300">
        <span className="text-xs text-cyan-400 font-bold uppercase">
          {displayDate.toLocaleDateString('en-US', { month: 'short' })}
        </span>
        <span className="text-2xl font-bold text-white leading-none">
          {displayDate.getDate()}
        </span>
      </div>

      {/* Event Info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="font-bold text-base truncate text-white group-hover:text-cyan-300 transition-colors">{event.title}</h3>
          <Badge className={cn("text-xs font-semibold border", getStatusColor())}>
            {getStatusText()}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            {displayDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
            {typeof event.location === 'string'
              ? event.location
              : event.location?.venue?.name || 'Virtual'}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            {(event.registeredCount || event.registeredUsers?.length || 0)} / {event.capacity || '∞'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" asChild className="hover:bg-white/10">
          <Link href={`/events/${event.id}`}>
            <Eye className="h-4 w-4 text-gray-400" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(event)} className="hover:bg-white/10">
          <Edit className="h-4 w-4 text-gray-400" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-white/10">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-900 border-white/10">
            <DropdownMenuItem onClick={() => onDuplicate(event)} className="text-gray-300 hover:text-white focus:bg-white/10">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-gray-300 hover:text-white focus:bg-white/10">
              <Link href={`/analytics?event=${event.id}`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
              onClick={() => onDelete(event.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const allEvents = await eventService.getEvents();
        // Filter to only show events created by this organizer
        const organizerEvents = allEvents.filter(
          e => e.organizerId === user?.uid || e.organizers?.includes(user?.uid || '') || e.organizationId === user?.organizationId
        );
        setEvents(organizerEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: 'Error',
          description: 'Failed to load events.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchEvents();
  }, [user, toast]);

  const handleEdit = (event: Event) => {
    router.push(`/events/${event.id}/edit`);
  };

  const handleDelete = async (eventId: string) => {
    try {
      await eventService.deleteEvent(eventId);
      setEvents(events.filter(e => e.id !== eventId));
      toast({ title: 'Event Deleted' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete event.',
        variant: 'destructive'
      });
    }
  };

  const handleDuplicate = async (event: Event) => {
    try {
      // Create a copy without the id field
      const { id: _id, ...eventWithoutId } = event;
      const duplicatedEvent: Omit<Event, 'id'> = {
        ...eventWithoutId,
        title: `${event.title} (Copy)`,
        status: 'draft',
        registeredCount: 0,
      };

      const newId = await eventService.createEvent(duplicatedEvent);
      setEvents([...events, { ...duplicatedEvent, id: newId } as Event]);
      toast({ title: 'Event Duplicated', description: 'A copy has been created as a draft.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate event.',
        variant: 'destructive'
      });
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const displayDate = event.startDate ? new Date(event.startDate) : new Date(event.date || '');
    const isUpcoming = displayDate > new Date();
    const isPast = displayDate < new Date();

    switch (activeTab) {
      case 'upcoming':
        return matchesSearch && isUpcoming && event.status !== 'draft' && event.status !== 'cancelled';
      case 'past':
        return matchesSearch && isPast;
      case 'draft':
        return matchesSearch && event.status === 'draft';
      default:
        return matchesSearch;
    }
  });

  // Calculate stats and trends
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const monthBeforeLast = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

  const eventsThisMonth = events.filter(e => e.createdAt?.toDate ? e.createdAt.toDate() >= lastMonth : true).length;
  const eventsLastMonth = events.filter(e => e.createdAt?.toDate ? (e.createdAt.toDate() >= monthBeforeLast && e.createdAt.toDate() < lastMonth) : false).length;

  const eventTrend = eventsLastMonth > 0
    ? Math.round(((eventsThisMonth - eventsLastMonth) / eventsLastMonth) * 100)
    : 0;

  const totalAttendees = events.reduce((sum, e) => sum + (e.registeredCount || e.registeredUsers?.length || 0), 0);
  // Simulating registration trend based on recent events
  const regTrend = 15; // Assume 15% for now as registration timestamps are harder to aggregate without a sub-query

  const stats = {
    totalEvents: events.length,
    activeEvents: events.filter(e => {
      const date = e.startDate ? new Date(e.startDate) : new Date(e.date || '');
      return date > new Date() && e.status !== 'draft' && e.status !== 'cancelled';
    }).length,
    totalAttendees,
    totalCapacity: events.reduce((sum, e) => sum + (e.capacity || 0), 0),
  };

  // Get upcoming events for quick view
  const upcomingEventsList = events
    .filter(e => {
      const date = e.startDate ? new Date(e.startDate) : new Date(e.date || '');
      return date > new Date() && e.status !== 'draft' && e.status !== 'cancelled';
    })
    .sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate) : new Date(a.date || '');
      const dateB = b.startDate ? new Date(b.startDate) : new Date(b.date || '');
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0a0b14]">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Welcome back, {user?.name?.split(' ')[0] || 'Organizer'}!
            </p>
          </div>
          <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-gray-900 font-semibold border-0 rounded-full">
            <Link href="/events/create">
              <Plus className="h-5 w-5" />
              Create Event
            </Link>
          </Button>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          icon={Calendar}
          change={eventTrend}
          trend={eventTrend >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Active Events"
          value={stats.activeEvents}
          icon={CheckCircle2}
          description="Currently running"
        />
        <StatCard
          title="Total Registrations"
          value={stats.totalAttendees}
          icon={Users}
          change={regTrend}
          trend="up"
        />
        <StatCard
          title="Avg. Fill Rate"
          value={stats.totalCapacity > 0
            ? `${Math.round((stats.totalAttendees / stats.totalCapacity) * 100)}%`
            : '0%'}
          icon={BarChart3}
          trend="neutral"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Events List */}
        <div className="lg:col-span-2">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-white">Your Events</CardTitle>
                  <CardDescription className="text-gray-400">Manage and track all your events</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search events..."
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 bg-white/5 border border-white/10">
                  <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-gray-900 text-gray-400">All</TabsTrigger>
                  <TabsTrigger value="upcoming" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-gray-900 text-gray-400">Upcoming</TabsTrigger>
                  <TabsTrigger value="past" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-gray-900 text-gray-400">Past</TabsTrigger>
                  <TabsTrigger value="draft" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-gray-900 text-gray-400">Drafts</TabsTrigger>
                </TabsList>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2 text-white">No events found</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      {activeTab === 'all'
                        ? "You haven't created any events yet."
                        : `No ${activeTab} events.`}
                    </p>
                    <Button asChild className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-gray-900 font-semibold border-0 rounded-full">
                      <Link href="/events/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Event
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredEvents.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                      />
                    ))}
                  </div>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events Preview */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <CalendarDays className="h-5 w-5 text-cyan-400" />
                Coming Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEventsList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No upcoming events
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingEventsList.map((event) => {
                    const date = event.startDate ? new Date(event.startDate) : new Date(event.date || '');
                    return (
                      <Link
                        key={event.id}
                        href={`/events/${event.id}`}
                        className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 flex flex-col items-center justify-center text-xs">
                          <span className="text-cyan-400 font-medium uppercase">
                            {date.toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="font-bold text-white leading-none">
                            {date.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-white group-hover:text-cyan-300 transition-colors">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(event.registeredCount || event.registeredUsers?.length || 0)} registered
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start border-white/10 text-gray-300 hover:text-white hover:bg-white/10" asChild>
                <Link href="/events/create">
                  <Plus className="h-4 w-4 mr-2 text-cyan-400" />
                  Create New Event
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-white/10 text-gray-300 hover:text-white hover:bg-white/10" asChild>
                <Link href="/analytics">
                  <BarChart3 className="h-4 w-4 mr-2 text-cyan-400" />
                  View Analytics
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-white/10 text-gray-300 hover:text-white hover:bg-white/10" asChild>
                <Link href="/check-in-scanner">
                  <Ticket className="h-4 w-4 mr-2 text-cyan-400" />
                  Check-in Scanner
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-white/10 text-gray-300 hover:text-white hover:bg-white/10" asChild>
                <Link href="/preferences">
                  <Settings className="h-4 w-4 mr-2 text-cyan-400" />
                  Settings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tip */}
          <Card className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border border-cyan-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600/30 to-blue-600/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-white">Pro Tip</h4>
                  <p className="text-sm text-gray-400">
                    Use our AI-powered event wizard to create compelling descriptions
                    and agendas automatically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
}
