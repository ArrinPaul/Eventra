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
import { cn } from '@/lib/utils';
import { eventService } from '@/lib/firestore-services';
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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {trend === 'up' && <TrendingUp className="h-4 w-4" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4" />}
              {change > 0 ? '+' : ''}{change}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
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
    if (event.status === 'cancelled') return 'bg-red-500/10 text-red-500';
    if (event.status === 'draft') return 'bg-yellow-500/10 text-yellow-500';
    if (isPast) return 'bg-gray-500/10 text-gray-500';
    return 'bg-green-500/10 text-green-500';
  };

  const getStatusText = () => {
    if (event.status === 'cancelled') return 'Cancelled';
    if (event.status === 'draft') return 'Draft';
    if (isPast) return 'Completed';
    return 'Active';
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors group">
      {/* Date Column */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
        <span className="text-xs text-primary font-medium uppercase">
          {displayDate.toLocaleDateString('en-US', { month: 'short' })}
        </span>
        <span className="text-xl font-bold text-primary leading-none">
          {displayDate.getDate()}
        </span>
      </div>

      {/* Event Info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold truncate">{event.title}</h3>
          <Badge variant="secondary" className={cn("text-xs", getStatusColor())}>
            {getStatusText()}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {displayDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {typeof event.location === 'string' 
              ? event.location 
              : event.location?.venue?.name || 'Virtual'}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {(event.registeredCount || event.registeredUsers?.length || 0)} / {event.capacity || '∞'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/events/${event.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(event)}>
          <Edit className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDuplicate(event)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/analytics?event=${event.id}`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
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
      const duplicatedEvent = {
        ...event,
        title: `${event.title} (Copy)`,
        status: 'draft',
        registeredCount: 0,
      };
      delete (duplicatedEvent as any).id;
      
      const newId = await eventService.createEvent(duplicatedEvent as any);
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

  // Calculate stats
  const stats = {
    totalEvents: events.length,
    activeEvents: events.filter(e => {
      const date = e.startDate ? new Date(e.startDate) : new Date(e.date || '');
      return date > new Date() && e.status !== 'draft' && e.status !== 'cancelled';
    }).length,
    totalAttendees: events.reduce((sum, e) => sum + (e.registeredCount || e.registeredUsers?.length || 0), 0),
    totalCapacity: events.reduce((sum, e) => sum + (e.capacity || 0), 0),
  };

  // Get upcoming events for quick view
  const upcomingEvents = events
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
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name?.split(' ')[0] || 'Organizer'}!
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
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
          change={12}
          trend="up"
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
          change={8}
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
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Your Events</CardTitle>
                  <CardDescription>Manage and track all your events</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                  <TabsTrigger value="draft">Drafts</TabsTrigger>
                </TabsList>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No events found</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {activeTab === 'all' 
                        ? "You haven't created any events yet." 
                        : `No ${activeTab} events.`}
                    </p>
                    <Button asChild>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Coming Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming events
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => {
                    const date = event.startDate ? new Date(event.startDate) : new Date(event.date || '');
                    return (
                      <Link
                        key={event.id}
                        href={`/events/${event.id}`}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-xs">
                          <span className="text-primary font-medium uppercase">
                            {date.toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="font-bold text-primary leading-none">
                            {date.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {event.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(event.registeredCount || event.registeredUsers?.length || 0)} registered
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/events/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Event
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/check-in-scanner">
                  <Ticket className="h-4 w-4 mr-2" />
                  Check-in Scanner
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/preferences">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tip */}
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-0">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Pro Tip</h4>
                  <p className="text-sm text-muted-foreground">
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
  );
}
