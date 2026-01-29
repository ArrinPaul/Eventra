'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  Activity,
  UserPlus,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Award,
  Zap,
  MapPin,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays, startOfWeek, eachDayOfInterval, formatDistanceToNow } from 'date-fns';

// Types
interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalEvents: number;
  activeEvents: number;
  eventsThisMonth: number;
  totalRegistrations: number;
  averageAttendance: number;
  totalRevenue: number;
  revenueThisMonth: number;
}

interface EngagementMetrics {
  dailyActiveUsers: number[];
  weeklyActiveUsers: number[];
  monthlyActiveUsers: number[];
  averageSessionDuration: number;
  pageViews: number;
  bounceRate: number;
  retentionRate: number;
}

interface EventMetrics {
  eventsByCategory: { category: string; count: number; percentage: number }[];
  eventsByStatus: { status: string; count: number }[];
  topEvents: { id: string; title: string; registrations: number; attendance: number }[];
  popularLocations: { location: string; eventCount: number }[];
}

interface UserGrowthData {
  date: string;
  users: number;
  growth: number;
}

interface RealtimeMetrics {
  activeNow: number;
  recentSignups: { id: string; name: string; time: Date }[];
  recentRegistrations: { eventTitle: string; userName: string; time: Date }[];
  systemHealth: { service: string; status: 'healthy' | 'degraded' | 'down' }[];
}

export default function AdminAnalyticsOverview() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  // Stats state
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
  const [eventMetrics, setEventMetrics] = useState<EventMetrics | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);

  useEffect(() => {
    loadAnalytics();
    
    // Simulate realtime updates
    const interval = setInterval(() => {
      updateRealtimeMetrics();
    }, 10000);

    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock platform stats
    setPlatformStats({
      totalUsers: 12847,
      activeUsers: 8432,
      newUsersToday: 127,
      newUsersThisWeek: 892,
      totalEvents: 1284,
      activeEvents: 156,
      eventsThisMonth: 89,
      totalRegistrations: 45892,
      averageAttendance: 78.5,
      totalRevenue: 125780,
      revenueThisMonth: 18450
    });

    // Mock engagement metrics
    setEngagementMetrics({
      dailyActiveUsers: [4532, 4821, 5012, 4892, 5234, 5421, 5189],
      weeklyActiveUsers: [7823, 8012, 8234, 8432],
      monthlyActiveUsers: [10234, 10892, 11234, 12847],
      averageSessionDuration: 12.5,
      pageViews: 892456,
      bounceRate: 32.4,
      retentionRate: 68.7
    });

    // Mock event metrics
    setEventMetrics({
      eventsByCategory: [
        { category: 'Technology', count: 345, percentage: 26.9 },
        { category: 'Networking', count: 278, percentage: 21.6 },
        { category: 'Academic', count: 234, percentage: 18.2 },
        { category: 'Social', count: 189, percentage: 14.7 },
        { category: 'Career', count: 156, percentage: 12.1 },
        { category: 'Sports', count: 82, percentage: 6.5 }
      ],
      eventsByStatus: [
        { status: 'Upcoming', count: 156 },
        { status: 'Ongoing', count: 23 },
        { status: 'Completed', count: 1089 },
        { status: 'Cancelled', count: 16 }
      ],
      topEvents: [
        { id: '1', title: 'Tech Innovation Summit 2026', registrations: 892, attendance: 756 },
        { id: '2', title: 'Career Fair Spring', registrations: 678, attendance: 612 },
        { id: '3', title: 'AI Workshop Series', registrations: 456, attendance: 423 },
        { id: '4', title: 'Networking Night', registrations: 345, attendance: 298 },
        { id: '5', title: 'Startup Pitch Competition', registrations: 234, attendance: 201 }
      ],
      popularLocations: [
        { location: 'Student Center', eventCount: 234 },
        { location: 'Engineering Building', eventCount: 189 },
        { location: 'Library Auditorium', eventCount: 156 },
        { location: 'Sports Complex', eventCount: 89 },
        { location: 'Online/Virtual', eventCount: 278 }
      ]
    });

    // Mock user growth data
    const growthData: UserGrowthData[] = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      growthData.push({
        date: format(date, 'MMM dd'),
        users: Math.floor(Math.random() * 200) + 50,
        growth: Math.random() * 10 - 2
      });
    }
    setUserGrowth(growthData);

    // Mock realtime metrics
    setRealtimeMetrics({
      activeNow: 487,
      recentSignups: [
        { id: '1', name: 'Alice Johnson', time: new Date(Date.now() - 120000) },
        { id: '2', name: 'Bob Smith', time: new Date(Date.now() - 300000) },
        { id: '3', name: 'Carol Williams', time: new Date(Date.now() - 540000) }
      ],
      recentRegistrations: [
        { eventTitle: 'AI Workshop', userName: 'David Lee', time: new Date(Date.now() - 60000) },
        { eventTitle: 'Career Fair', userName: 'Emma Brown', time: new Date(Date.now() - 180000) },
        { eventTitle: 'Tech Summit', userName: 'Frank Davis', time: new Date(Date.now() - 420000) }
      ],
      systemHealth: [
        { service: 'API Server', status: 'healthy' },
        { service: 'Database', status: 'healthy' },
        { service: 'File Storage', status: 'healthy' },
        { service: 'Email Service', status: 'healthy' },
        { service: 'Push Notifications', status: 'healthy' }
      ]
    });

    setLoading(false);
  };

  const updateRealtimeMetrics = () => {
    if (realtimeMetrics) {
      setRealtimeMetrics(prev => ({
        ...prev!,
        activeNow: prev!.activeNow + Math.floor(Math.random() * 20) - 10
      }));
    }
  };

  const getChangeIndicator = (value: number, isPositiveGood: boolean = true) => {
    const isPositive = value > 0;
    const isGood = isPositiveGood ? isPositive : !isPositive;
    
    return (
      <span className={`flex items-center text-sm ${isGood ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Platform Analytics</h2>
          <p className="text-muted-foreground">Real-time insights and metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Realtime Banner */}
      {realtimeMetrics && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Activity className="w-6 h-6 text-primary" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Right Now</p>
                  <p className="text-2xl font-bold">{realtimeMetrics.activeNow} users</p>
                </div>
              </div>
              <div className="flex gap-6">
                {realtimeMetrics.systemHealth.map((service) => (
                  <div key={service.service} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getHealthStatusColor(service.status)}`} />
                    <span className="text-sm text-muted-foreground">{service.service}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      {platformStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-500" />
                {getChangeIndicator(7.2)}
              </div>
              <p className="text-2xl font-bold">{platformStats.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-green-500" />
                {getChangeIndicator(12.5)}
              </div>
              <p className="text-2xl font-bold">{platformStats.activeUsers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <UserPlus className="w-5 h-5 text-purple-500" />
                {getChangeIndicator(23.1)}
              </div>
              <p className="text-2xl font-bold">+{platformStats.newUsersToday}</p>
              <p className="text-xs text-muted-foreground">New Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                {getChangeIndicator(5.8)}
              </div>
              <p className="text-2xl font-bold">{platformStats.totalEvents.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-5 h-5 text-teal-500" />
                {getChangeIndicator(3.2)}
              </div>
              <p className="text-2xl font-bold">{platformStats.averageAttendance}%</p>
              <p className="text-xs text-muted-foreground">Avg Attendance</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
                {getChangeIndicator(15.7)}
              </div>
              <p className="text-2xl font-bold">${(platformStats.revenueThisMonth / 1000).toFixed(1)}k</p>
              <p className="text-xs text-muted-foreground">Revenue (Month)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="w-4 h-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-2">
            <Activity className="w-4 h-4" />
            Engagement
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  User Growth
                </CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-end gap-1">
                  {userGrowth.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors"
                        style={{ height: `${(day.users / 250) * 100}%` }}
                      />
                      {index % Math.ceil(userGrowth.length / 7) === 0 && (
                        <span className="text-[10px] text-muted-foreground">{day.date}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Events by Category */}
            {eventMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Events by Category
                  </CardTitle>
                  <CardDescription>Distribution of event types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {eventMetrics.eventsByCategory.map((cat, index) => (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{cat.category}</span>
                          <span className="font-medium">{cat.count} ({cat.percentage}%)</span>
                        </div>
                        <Progress value={cat.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-4">
            {realtimeMetrics && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Recent Signups
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {realtimeMetrics.recentSignups.map((signup) => (
                        <div key={signup.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              {signup.name.charAt(0)}
                            </div>
                            <span className="font-medium">{signup.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(signup.time, { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Recent Registrations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {realtimeMetrics.recentRegistrations.map((reg, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{reg.userName}</p>
                            <p className="text-sm text-muted-foreground">{reg.eventTitle}</p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(reg.time, { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {engagementMetrics && (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {engagementMetrics.dailyActiveUsers[engagementMetrics.dailyActiveUsers.length - 1].toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Daily Active Users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                        <Activity className="w-6 h-6 text-green-600 dark:text-green-300" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {engagementMetrics.weeklyActiveUsers[engagementMetrics.weeklyActiveUsers.length - 1].toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Weekly Active Users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <Clock className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{engagementMetrics.averageSessionDuration} min</p>
                        <p className="text-sm text-muted-foreground">Avg Session Duration</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{engagementMetrics.retentionRate}%</p>
                        <p className="text-sm text-muted-foreground">Retention Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* User Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Active Users Trend</CardTitle>
              <CardDescription>User activity over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              {engagementMetrics && (
                <div className="h-[200px] flex items-end gap-2">
                  {engagementMetrics.dailyActiveUsers.map((users, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-sm font-medium">{users.toLocaleString()}</span>
                      <div 
                        className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t"
                        style={{ height: `${(users / 6000) * 100}%` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {eventMetrics && (
            <>
              {/* Event Status Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                {eventMetrics.eventsByStatus.map((status) => (
                  <Card key={status.status}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">{status.count}</p>
                          <p className="text-sm text-muted-foreground">{status.status}</p>
                        </div>
                        {status.status === 'Upcoming' && <Calendar className="w-5 h-5 text-blue-500" />}
                        {status.status === 'Ongoing' && <Activity className="w-5 h-5 text-green-500" />}
                        {status.status === 'Completed' && <CheckCircle2 className="w-5 h-5 text-gray-500" />}
                        {status.status === 'Cancelled' && <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Top Events & Popular Locations */}
              <div className="grid lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Top Events
                    </CardTitle>
                    <CardDescription>Events with highest registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {eventMetrics.topEvents.map((event, index) => (
                        <div key={event.id} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                            ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'}`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.registrations} registrations • {((event.attendance / event.registrations) * 100).toFixed(0)}% attendance
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Popular Locations
                    </CardTitle>
                    <CardDescription>Most used event venues</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {eventMetrics.popularLocations.map((location, index) => (
                        <div key={location.location} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {location.location === 'Online/Virtual' ? (
                              <Globe className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span>{location.location}</span>
                          </div>
                          <Badge variant="secondary">{location.eventCount} events</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          {engagementMetrics && (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Eye className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                      <p className="text-3xl font-bold">{(engagementMetrics.pageViews / 1000).toFixed(0)}k</p>
                      <p className="text-sm text-muted-foreground">Page Views</p>
                      <p className="text-xs text-green-600 mt-1">+12.5% from last period</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <TrendingDown className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                      <p className="text-3xl font-bold">{engagementMetrics.bounceRate}%</p>
                      <p className="text-sm text-muted-foreground">Bounce Rate</p>
                      <p className="text-xs text-green-600 mt-1">-3.2% from last period</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Zap className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                      <p className="text-3xl font-bold">{engagementMetrics.retentionRate}%</p>
                      <p className="text-sm text-muted-foreground">Retention Rate</p>
                      <p className="text-xs text-green-600 mt-1">+5.1% from last period</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Device & Platform Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Usage</CardTitle>
                  <CardDescription>How users access the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          <span>Mobile</span>
                        </div>
                        <span className="font-medium">58%</span>
                      </div>
                      <Progress value={58} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          <span>Desktop</span>
                        </div>
                        <span className="font-medium">35%</span>
                      </div>
                      <Progress value={35} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          <span>Tablet</span>
                        </div>
                        <span className="font-medium">7%</span>
                      </div>
                      <Progress value={7} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Feature Usage</CardTitle>
                  <CardDescription>Most used platform features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { name: 'Event Discovery', usage: 89, icon: Calendar },
                      { name: 'Chat & Messaging', usage: 76, icon: MessageSquare },
                      { name: 'Networking', usage: 68, icon: Users },
                      { name: 'Gamification', usage: 54, icon: Award },
                      { name: 'AI Recommendations', usage: 47, icon: Zap },
                      { name: 'Check-in', usage: 82, icon: CheckCircle2 }
                    ].map((feature) => (
                      <div key={feature.name} className="flex items-center gap-3 p-3 border rounded-lg">
                        <feature.icon className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{feature.name}</span>
                            <span className="text-sm text-muted-foreground">{feature.usage}%</span>
                          </div>
                          <Progress value={feature.usage} className="h-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
