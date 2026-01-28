'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  MessageCircle, 
  Award,
  Eye,
  Clock,
  MapPin,
  Tag,
  ChevronUp,
  ChevronDown,
  Filter,
  Download,
  Share
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AnalyticsData {
  eventMetrics: {
    totalEvents: number;
    totalAttendees: number;
    averageAttendance: number;
    upcomingEvents: number;
    popularCategories: Array<{ category: string; count: number }>;
    attendanceByMonth: Array<{ month: string; attendees: number }>;
    eventsByStatus: Array<{ status: string; count: number }>;
  };
  communityMetrics: {
    totalCommunities: number;
    totalMembers: number;
    activeDiscussions: number;
    engagementRate: number;
    topCommunities: Array<{ name: string; members: number; activity: number }>;
    membershipGrowth: Array<{ month: string; newMembers: number }>;
  };
  networkingMetrics: {
    totalConnections: number;
    connectionRequests: number;
    acceptanceRate: number;
    networkGrowth: number;
    topSkills: Array<{ skill: string; count: number }>;
    connectionsByMonth: Array<{ month: string; connections: number }>;
  };
  engagementMetrics: {
    totalMessages: number;
    activeUsers: number;
    averageSessionTime: number;
    dailyActiveUsers: number;
    messagesByHour: Array<{ hour: number; count: number }>;
    userRetention: Array<{ week: number; retention: number }>;
  };
}

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30');
  const [selectedTab, setSelectedTab] = useState('overview');

  const timeRanges: TimeRange[] = [
    { label: 'Last 7 days', value: '7', days: 7 },
    { label: 'Last 30 days', value: '30', days: 30 },
    { label: 'Last 90 days', value: '90', days: 90 },
    { label: 'Last year', value: '365', days: 365 },
    { label: 'All time', value: 'all', days: 0 }
  ];

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, timeRange]);

  const loadAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const startDate = timeRange === 'all' ? null : new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
      
      const [eventMetrics, communityMetrics, networkingMetrics, engagementMetrics] = await Promise.all([
        loadEventMetrics(startDate),
        loadCommunityMetrics(startDate),
        loadNetworkingMetrics(startDate),
        loadEngagementMetrics(startDate)
      ]);

      setAnalytics({
        eventMetrics,
        communityMetrics,
        networkingMetrics,
        engagementMetrics
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventMetrics = async (startDate: Date | null) => {
    // Mock implementation - in real app, these would be actual Firestore queries
    const eventsQuery = startDate 
      ? query(collection(db, 'events'), where('createdAt', '>=', startDate))
      : query(collection(db, 'events'));
    
    const eventsSnapshot = await getDocs(eventsQuery);
    const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const totalEvents = events.length;
    const totalAttendees = events.reduce((sum: number, event: any) => sum + (event.attendeeCount || 0), 0);
    const averageAttendance = totalEvents > 0 ? totalAttendees / totalEvents : 0;
    const upcomingEvents = events.filter((event: any) => 
      event.startTime && event.startTime.toDate() > new Date()
    ).length;

    // Group by categories
    const categoryMap = new Map();
    events.forEach((event: any) => {
      const category = event.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    const popularCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Mock monthly data
    const attendanceByMonth = [
      { month: 'Jan', attendees: 120 },
      { month: 'Feb', attendees: 150 },
      { month: 'Mar', attendees: 180 },
      { month: 'Apr', attendees: 200 },
      { month: 'May', attendees: 250 },
      { month: 'Jun', attendees: 220 }
    ];

    const eventsByStatus = [
      { status: 'Upcoming', count: upcomingEvents },
      { status: 'Completed', count: totalEvents - upcomingEvents },
      { status: 'Cancelled', count: Math.floor(totalEvents * 0.05) }
    ];

    return {
      totalEvents,
      totalAttendees,
      averageAttendance,
      upcomingEvents,
      popularCategories,
      attendanceByMonth,
      eventsByStatus
    };
  };

  const loadCommunityMetrics = async (startDate: Date | null) => {
    const communitiesSnapshot = await getDocs(collection(db, 'communities'));
    const communities = communitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const totalCommunities = communities.length;
    const totalMembers = communities.reduce((sum: number, community: any) => sum + (community.memberCount || 0), 0);
    const activeDiscussions = 45; // Mock data
    const engagementRate = 78.5; // Mock data

    const topCommunities = communities
      .sort((a: any, b: any) => (b.memberCount || 0) - (a.memberCount || 0))
      .slice(0, 5)
      .map((community: any) => ({
        name: community.name,
        members: community.memberCount || 0,
        activity: Math.floor(Math.random() * 100) // Mock activity score
      }));

    const membershipGrowth = [
      { month: 'Jan', newMembers: 25 },
      { month: 'Feb', newMembers: 35 },
      { month: 'Mar', newMembers: 42 },
      { month: 'Apr', newMembers: 38 },
      { month: 'May', newMembers: 55 },
      { month: 'Jun', newMembers: 48 }
    ];

    return {
      totalCommunities,
      totalMembers,
      activeDiscussions,
      engagementRate,
      topCommunities,
      membershipGrowth
    };
  };

  const loadNetworkingMetrics = async (startDate: Date | null) => {
    const connectionsSnapshot = await getDocs(collection(db, 'connections'));
    const connections = connectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const totalConnections = connections.length;
    const connectionRequests = connections.filter((conn: any) => conn.status === 'pending').length;
    const acceptedConnections = connections.filter((conn: any) => conn.status === 'accepted').length;
    const acceptanceRate = totalConnections > 0 ? (acceptedConnections / totalConnections) * 100 : 0;
    const networkGrowth = 15.2; // Mock percentage growth

    const topSkills = [
      { skill: 'JavaScript', count: 156 },
      { skill: 'React', count: 143 },
      { skill: 'Node.js', count: 128 },
      { skill: 'Python', count: 112 },
      { skill: 'AWS', count: 98 }
    ];

    const connectionsByMonth = [
      { month: 'Jan', connections: 12 },
      { month: 'Feb', connections: 18 },
      { month: 'Mar', connections: 25 },
      { month: 'Apr', connections: 22 },
      { month: 'May', connections: 31 },
      { month: 'Jun', connections: 28 }
    ];

    return {
      totalConnections,
      connectionRequests,
      acceptanceRate,
      networkGrowth,
      topSkills,
      connectionsByMonth
    };
  };

  const loadEngagementMetrics = async (startDate: Date | null) => {
    // Mock engagement data
    return {
      totalMessages: 2847,
      activeUsers: 156,
      averageSessionTime: 24.5,
      dailyActiveUsers: 89,
      messagesByHour: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor(Math.random() * 50) + 10
      })),
      userRetention: [
        { week: 1, retention: 100 },
        { week: 2, retention: 78 },
        { week: 3, retention: 65 },
        { week: 4, retention: 58 }
      ]
    };
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: { 
    title: string; 
    value: number; 
    change?: number; 
    icon: React.ComponentType<{ className?: string }>; 
    format?: 'number' | 'percentage' | 'duration' 
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'percentage':
          return `${val.toFixed(1)}%`;
        case 'duration':
          return `${val.toFixed(1)}m`;
        default:
          return val.toLocaleString();
      }
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{formatValue(value)}</p>
              {change !== undefined && (
                <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change >= 0 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span>{Math.abs(change).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Track your platform performance and user engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Events"
              value={analytics.eventMetrics.totalEvents}
              change={12.5}
              icon={Calendar}
            />
            <MetricCard
              title="Active Users"
              value={analytics.engagementMetrics.activeUsers}
              change={8.2}
              icon={Users}
            />
            <MetricCard
              title="Communities"
              value={analytics.communityMetrics.totalCommunities}
              change={-2.1}
              icon={Users}
            />
            <MetricCard
              title="Connections Made"
              value={analytics.networkingMetrics.totalConnections}
              change={15.7}
              icon={TrendingUp}
            />
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Event Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.eventMetrics.popularCategories.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <Badge variant="secondary">{category.count} events</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Skills in Network</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.networkingMetrics.topSkills.map((skill, index) => (
                    <div key={skill.skill} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium">{skill.skill}</span>
                      </div>
                      <Badge variant="outline">{skill.count} users</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Events Created"
              value={analytics.eventMetrics.totalEvents}
              change={12.5}
              icon={Calendar}
            />
            <MetricCard
              title="Total Attendees"
              value={analytics.eventMetrics.totalAttendees}
              change={18.3}
              icon={Users}
            />
            <MetricCard
              title="Average Attendance"
              value={analytics.eventMetrics.averageAttendance}
              change={5.7}
              icon={BarChart3}
            />
            <MetricCard
              title="Upcoming Events"
              value={analytics.eventMetrics.upcomingEvents}
              icon={Clock}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Events by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.eventMetrics.eventsByStatus.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <span className="font-medium">{status.status}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ 
                              width: `${(status.count / analytics.eventMetrics.totalEvents) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{status.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Attendance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.eventMetrics.attendanceByMonth.map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="font-medium">{month.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ 
                              width: `${(month.attendees / Math.max(...analytics.eventMetrics.attendanceByMonth.map(m => m.attendees))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{month.attendees}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Communities"
              value={analytics.communityMetrics.totalCommunities}
              change={-2.1}
              icon={Users}
            />
            <MetricCard
              title="Total Members"
              value={analytics.communityMetrics.totalMembers}
              change={14.8}
              icon={Users}
            />
            <MetricCard
              title="Active Discussions"
              value={analytics.communityMetrics.activeDiscussions}
              change={22.3}
              icon={MessageCircle}
            />
            <MetricCard
              title="Engagement Rate"
              value={analytics.communityMetrics.engagementRate}
              change={3.1}
              icon={TrendingUp}
              format="percentage"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Communities by Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.communityMetrics.topCommunities.map((community, index) => (
                    <div key={community.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{community.name}</p>
                          <p className="text-sm text-muted-foreground">{community.members} members</p>
                        </div>
                      </div>
                      <Badge variant="outline">{community.activity}% active</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Membership Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.communityMetrics.membershipGrowth.map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="font-medium">{month.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ 
                              width: `${(month.newMembers / Math.max(...analytics.communityMetrics.membershipGrowth.map(m => m.newMembers))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">+{month.newMembers}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Messages"
              value={analytics.engagementMetrics.totalMessages}
              change={25.6}
              icon={MessageCircle}
            />
            <MetricCard
              title="Daily Active Users"
              value={analytics.engagementMetrics.dailyActiveUsers}
              change={8.2}
              icon={Users}
            />
            <MetricCard
              title="Avg Session Time"
              value={analytics.engagementMetrics.averageSessionTime}
              change={12.1}
              icon={Clock}
              format="duration"
            />
            <MetricCard
              title="User Retention"
              value={analytics.engagementMetrics.userRetention[3].retention}
              change={-5.3}
              icon={TrendingUp}
              format="percentage"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Retention Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.engagementMetrics.userRetention.map((week) => (
                  <div key={week.week} className="flex items-center justify-between">
                    <span className="font-medium">Week {week.week}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full" 
                          style={{ width: `${week.retention}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{week.retention}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}