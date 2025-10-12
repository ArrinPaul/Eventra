/**
 * EventOS Role-Based Dashboard System
 * Three distinct dashboard experiences: Attendee, Speaker, Organizer
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarDays, 
  Users, 
  TrendingUp, 
  Award, 
  Clock,
  MapPin,
  Star,
  MessageSquare,
  Bell,
  Settings,
  Plus,
  Eye,
  BarChart3,
  Mic,
  Building,
  Globe,
  Zap,
  Target,
  Heart,
  CheckCircle2,
  ArrowRight,
  Calendar,
  UserPlus,
  DollarSign,
  Activity
} from 'lucide-react';
import { EventOSRole } from '@/lib/eventos-config';
import type { Event, Session, User, Analytics } from '@/types/eventos';

// Dashboard data interfaces
interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalAttendees?: number;
  totalSpeakers?: number;
  totalRevenue?: number;
  engagementRate?: number;
  npsScore?: number;
}

interface RecentActivity {
  id: string;
  type: 'registration' | 'event_created' | 'session_booked' | 'message' | 'review';
  title: string;
  description: string;
  timestamp: Date;
  icon: any;
  color: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: Date;
  location: string;
  attendees: number;
  status: 'draft' | 'published' | 'live' | 'completed';
  type: 'conference' | 'workshop' | 'networking' | 'webinar';
}

export function EventOSDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockStats: DashboardStats = {
        totalEvents: 24,
        upcomingEvents: 8,
        completedEvents: 16,
        totalAttendees: 1240,
        totalSpeakers: 45,
        totalRevenue: 25000,
        engagementRate: 78,
        npsScore: 8.4,
      };

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'registration',
          title: 'New Event Registration',
          description: 'AI & Future of Work Conference',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          icon: UserPlus,
          color: 'text-blue-500',
        },
        {
          id: '2',
          type: 'session_booked',
          title: 'Session Scheduled',
          description: '1-on-1 with Sarah Chen',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          icon: Calendar,
          color: 'text-green-500',
        },
        {
          id: '3',
          type: 'message',
          title: 'New Message',
          description: 'From Alex Thompson about partnership',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          icon: MessageSquare,
          color: 'text-purple-500',
        },
      ];

      const mockEvents: UpcomingEvent[] = [
        {
          id: '1',
          title: 'AI & Future of Work Conference',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'San Francisco, CA',
          attendees: 450,
          status: 'published',
          type: 'conference',
        },
        {
          id: '2',
          title: 'Product Strategy Workshop',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          location: 'Online',
          attendees: 120,
          status: 'draft',
          type: 'workshop',
        },
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
      setUpcomingEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAttendeeOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-blue-500 text-white text-lg">
                {user?.name?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold font-headline">
                Welcome back, {user?.name?.split(' ')[0]}! 👋
              </h2>
              <p className="text-muted-foreground">
                You have {stats.upcomingEvents} upcoming events and 3 new recommendations
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Join Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Events Attended</p>
                <p className="text-2xl font-bold">{stats.completedEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connections</p>
                <p className="text-2xl font-bold">127</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Points</p>
                <p className="text-2xl font-bold">2,450</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Upcoming Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">{event.date.toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {event.location}
                  </p>
                </div>
                <Button size="sm" variant="ghost">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>AI Recommendations</span>
            </CardTitle>
            <CardDescription>
              Personalized suggestions based on your interests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start space-x-2">
                <Star className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Tech Leadership Summit</h4>
                  <p className="text-xs text-muted-foreground">95% match • Based on your ML interests</p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                    View Details
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-2">
                <Heart className="w-4 h-4 text-pink-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Networking Mixer</h4>
                  <p className="text-xs text-muted-foreground">87% match • Connect with similar professionals</p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                    Join Now
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start space-x-2">
                <Target className="w-4 h-4 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Product Strategy Workshop</h4>
                  <p className="text-xs text-muted-foreground">78% match • Enhance your product skills</p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full bg-accent flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activity.timestamp.toLocaleTimeString()}
                  </p>
                  {index < recentActivity.length - 1 && <Separator className="my-2" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSpeakerOverview = () => (
    <div className="space-y-6">
      {/* Speaker Welcome */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-purple-500 text-white text-lg">
                {user?.name?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold font-headline">
                Speaker Dashboard 🎤
              </h2>
              <p className="text-muted-foreground">
                You have 3 upcoming speaking sessions and 12 new requests
              </p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Mic className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Speaker Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mic className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">42</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Audience Reached</p>
                <p className="text-2xl font-bold">5.2K</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">4.8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Earnings</p>
                <p className="text-2xl font-bold">$12.5K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Speaker-specific content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Upcoming Sessions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">AI in Product Development</h4>
                  <p className="text-sm text-muted-foreground">Dec 15, 2024 • 2:00 PM</p>
                  <p className="text-xs text-muted-foreground">Expected: 150 attendees</p>
                </div>
                <Badge variant="outline">Confirmed</Badge>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">Leadership in Tech</h4>
                  <p className="text-sm text-muted-foreground">Dec 22, 2024 • 10:00 AM</p>
                  <p className="text-xs text-muted-foreground">Expected: 200 attendees</p>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Speaking Requests</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-accent/50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">Tech Startup Conference</h4>
                  <p className="text-sm text-muted-foreground">Innovation in Fintech</p>
                  <p className="text-xs text-muted-foreground">Jan 10, 2025 • $2,500</p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">Decline</Button>
                  <Button size="sm">Accept</Button>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-accent/50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">Global AI Summit</h4>
                  <p className="text-sm text-muted-foreground">Future of AI Ethics</p>
                  <p className="text-xs text-muted-foreground">Feb 5, 2025 • $3,000</p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">Decline</Button>
                  <Button size="sm">Accept</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderOrganizerOverview = () => (
    <div className="space-y-6">
      {/* Organizer Welcome */}
      <Card className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-green-500 text-white text-lg">
                {user?.name?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold font-headline">
                Event Control Center 🎯
              </h2>
              <p className="text-muted-foreground">
                Managing {stats.totalEvents} events with {stats.totalAttendees} total attendees
              </p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organizer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Attendees</p>
                <p className="text-2xl font-bold">{stats.totalAttendees?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
                <p className="text-2xl font-bold">+23%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizer-specific content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Event Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      event.status === 'published' ? 'bg-green-500' :
                      event.status === 'draft' ? 'bg-yellow-500' :
                      event.status === 'live' ? 'bg-blue-500' : 'bg-gray-500'
                    }`} />
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {event.attendees} attendees • {event.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                      {event.status}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create New Event
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Manage Speakers
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Announcement
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Event Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (!user) return null;

    switch (user.role) {
      case 'attendee':
        return renderAttendeeOverview();
      case 'speaker':
        return renderSpeakerOverview();
      case 'organizer':
      case 'admin':
        return renderOrganizerOverview();
      default:
        return renderAttendeeOverview();
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Please sign in</h2>
          <p className="text-muted-foreground">You need to be authenticated to view the dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">EventOS Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your personalized event management experience
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="capitalize">
            {user.role}
          </Badge>
          <Button variant="outline" size="icon">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Role-specific Dashboard Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderTabContent()}
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Management</CardTitle>
              <CardDescription>
                Manage your events, sessions, and attendees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Events management interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>
                Track performance, engagement, and growth metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Advanced analytics dashboard will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your profile information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Profile management interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}