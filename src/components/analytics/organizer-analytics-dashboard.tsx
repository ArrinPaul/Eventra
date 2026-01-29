'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { StakeholderShareDialog } from '@/components/analytics/stakeholder-share-view';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar, 
  DollarSign,
  Eye,
  Clock,
  MapPin,
  Target,
  Zap,
  Download,
  Share2,
  Filter,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Ticket,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PieChart,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  Mail,
  Link2,
  Search,
  Copy,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for Organizer Analytics
interface EventPerformance {
  eventId: string;
  eventName: string;
  date: Date;
  category: string;
  status: 'draft' | 'published' | 'live' | 'completed' | 'cancelled';
  capacity: number;
  registrations: number;
  checkIns: number;
  revenue: number;
  viewCount: number;
  conversionRate: number;
  satisfactionScore: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  dropoffRate: number;
  color: string;
}

interface DemographicData {
  ageGroups: Array<{ range: string; count: number; percentage: number }>;
  departments: Array<{ name: string; count: number; percentage: number }>;
  years: Array<{ year: string; count: number; percentage: number }>;
  locations: Array<{ city: string; count: number; percentage: number }>;
  devices: Array<{ type: string; count: number; percentage: number }>;
  sources: Array<{ source: string; count: number; percentage: number }>;
}

interface RevenueData {
  totalRevenue: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
  byTicketType: Array<{ type: string; revenue: number; sold: number }>;
  byEvent: Array<{ eventName: string; revenue: number; date: string }>;
  projectedRevenue: number;
  averageTicketPrice: number;
  refunds: number;
  netRevenue: number;
}

interface OrganizerAnalyticsProps {
  organizerId?: string;
}

export default function OrganizerAnalyticsDashboard({ organizerId }: OrganizerAnalyticsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('performance');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEventId, setShareEventId] = useState<string>('');
  const [shareEventName, setShareEventName] = useState<string>('');

  // Data from Firestore
  const [events, setEvents] = useState<EventPerformance[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [demographics, setDemographics] = useState<DemographicData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, selectedEvent, organizerId]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    
    try {
      // Import analytics service
      const { analyticsService } = await import('@/lib/analytics-service');
      
      // Fetch real data from Firestore
      const [eventsData, funnelDataResult, demographicsData, revenueData] = await Promise.all([
        analyticsService.getOrganizerEvents(organizerId),
        analyticsService.getOrganizerFunnelData(organizerId),
        analyticsService.getOrganizerDemographics(organizerId),
        analyticsService.getOrganizerRevenue(organizerId)
      ]);
      
      // Map to component's expected format
      setEvents(eventsData.map(e => ({
        eventId: e.eventId,
        eventName: e.eventName,
        date: e.date,
        category: e.category,
        status: e.status,
        capacity: e.capacity,
        registrations: e.registrations,
        checkIns: e.checkIns,
        revenue: e.revenue,
        viewCount: e.viewCount,
        conversionRate: e.conversionRate,
        satisfactionScore: e.satisfactionScore
      })));
      
      setFunnelData(funnelDataResult);
      setDemographics(demographicsData);
      setRevenue(revenueData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalRegistrations = events.reduce((sum, e) => sum + e.registrations, 0);
    const totalCheckIns = events.reduce((sum, e) => sum + e.checkIns, 0);
    const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0);
    const totalViews = events.reduce((sum, e) => sum + e.viewCount, 0);
    const avgConversion = events.length > 0 
      ? events.reduce((sum, e) => sum + e.conversionRate, 0) / events.length 
      : 0;
    const avgSatisfaction = events.filter(e => e.satisfactionScore > 0).length > 0
      ? events.filter(e => e.satisfactionScore > 0).reduce((sum, e) => sum + e.satisfactionScore, 0) / events.filter(e => e.satisfactionScore > 0).length
      : 0;

    return {
      totalEvents: events.length,
      totalRegistrations,
      totalCheckIns,
      fillRate: totalCapacity > 0 ? (totalRegistrations / totalCapacity * 100).toFixed(1) : 0,
      checkInRate: totalRegistrations > 0 ? (totalCheckIns / totalRegistrations * 100).toFixed(1) : 0,
      totalViews,
      avgConversion: avgConversion.toFixed(1),
      avgSatisfaction: avgSatisfaction.toFixed(1)
    };
  }, [events]);

  const handleExportData = () => {
    toast({
      title: 'Export Started',
      description: 'Your analytics report is being generated...'
    });
    // In production, generate and download CSV/PDF
  };

  const handleShareReport = (eventId?: string, eventName?: string) => {
    // If sharing a specific event, use those details
    if (eventId && eventName) {
      setShareEventId(eventId);
      setShareEventName(eventName);
    } else if (selectedEvent !== 'all') {
      // If a specific event is selected in the dropdown, use that
      const event = events.find(e => e.eventId === selectedEvent);
      if (event) {
        setShareEventId(event.eventId);
        setShareEventName(event.eventName);
      } else {
        setShareEventId('all');
        setShareEventName('All Events Analytics');
      }
    } else {
      // Default to all events
      setShareEventId('all');
      setShareEventName('All Events Analytics');
    }
    setShowShareDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'live': return 'bg-red-100 text-red-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Organizer Analytics</h1>
          <p className="text-muted-foreground">Track your event performance and audience insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => loadAnalyticsData()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => handleShareReport()}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{summaryMetrics.totalEvents}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registrations</p>
                <p className="text-2xl font-bold">{summaryMetrics.totalRegistrations}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {summaryMetrics.fillRate}% fill rate
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Check-ins</p>
                <p className="text-2xl font-bold">{summaryMetrics.totalCheckIns}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {summaryMetrics.checkInRate}% rate
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${revenue?.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +{revenue?.growth}% vs last month
                </p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-[600px]">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Event Performance</CardTitle>
                  <CardDescription>Overview of all your events and their metrics</CardDescription>
                </div>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.eventId} value={event.eventId}>
                        {event.eventName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event, index) => (
                  <motion.div
                    key={event.eventId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{event.eventName}</h3>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                          <Badge variant="outline">{event.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {event.date.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        
                        {/* Progress bars */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Registrations</span>
                              <span className="font-medium">{event.registrations}/{event.capacity}</span>
                            </div>
                            <Progress 
                              value={(event.registrations / event.capacity) * 100} 
                              className="h-2"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Check-ins</span>
                              <span className="font-medium">{event.checkIns}/{event.registrations}</span>
                            </div>
                            <Progress 
                              value={event.registrations > 0 ? (event.checkIns / event.registrations) * 100 : 0} 
                              className="h-2"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Views</span>
                              <span className="font-medium">{event.viewCount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="w-3 h-3" />
                              {event.conversionRate}% conversion
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Revenue</span>
                              <span className="font-medium">${event.revenue.toLocaleString()}</span>
                            </div>
                            {event.satisfactionScore > 0 && (
                              <div className="flex items-center gap-1 text-xs text-amber-600">
                                ⭐ {event.satisfactionScore}/5 rating
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration Funnel Analysis</CardTitle>
              <CardDescription>Track user journey from discovery to check-in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Visual Funnel */}
                <div className="relative">
                  {funnelData.map((stage, index) => (
                    <motion.div
                      key={stage.stage}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="mb-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-32 text-right">
                          <p className="font-medium text-sm">{stage.stage}</p>
                          <p className="text-xs text-muted-foreground">{stage.percentage}%</p>
                        </div>
                        <div className="flex-1 relative">
                          <div 
                            className="h-12 rounded-r-lg flex items-center justify-between px-4 transition-all"
                            style={{ 
                              width: `${stage.percentage}%`,
                              backgroundColor: stage.color,
                              minWidth: '100px'
                            }}
                          >
                            <span className="font-bold text-white">{stage.count.toLocaleString()}</span>
                            {index > 0 && (
                              <span className="text-xs text-white/80">
                                -{stage.dropoffRate}% dropoff
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Separator />

                {/* Funnel Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">Biggest Drop-off</p>
                          <p className="text-sm text-amber-700">
                            70.4% users leave after viewing event details without starting registration
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800">Best Conversion</p>
                          <p className="text-sm text-green-700">
                            74.2% of registered users actually check in at events
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800">Recommendation</p>
                          <p className="text-sm text-blue-700">
                            Add compelling CTAs and simplify registration form
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-4">
          {demographics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Age Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Age Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {demographics.ageGroups.map((group, index) => (
                      <div key={group.range}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{group.range}</span>
                          <span className="font-medium">{group.count} ({group.percentage}%)</span>
                        </div>
                        <Progress value={group.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Department Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Department Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {demographics.departments.map((dept, index) => (
                      <div key={dept.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{dept.name}</span>
                          <span className="font-medium">{dept.count} ({dept.percentage}%)</span>
                        </div>
                        <Progress value={dept.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Year Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Academic Year</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {demographics.years.map((year) => (
                      <div key={year.year}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{year.year}</span>
                          <span className="font-medium">{year.count} ({year.percentage}%)</span>
                        </div>
                        <Progress value={year.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Device & Source */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">By Device</p>
                      <div className="space-y-2">
                        {demographics.devices.map((device) => (
                          <div key={device.type} className="flex items-center gap-2">
                            {device.type === 'Mobile' && <Smartphone className="w-4 h-4" />}
                            {device.type === 'Desktop' && <Monitor className="w-4 h-4" />}
                            {device.type === 'Tablet' && <Monitor className="w-4 h-4" />}
                            <span className="text-sm">{device.type}</span>
                            <span className="text-sm text-muted-foreground ml-auto">
                              {device.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">By Source</p>
                      <div className="space-y-2">
                        {demographics.sources.map((source) => (
                          <div key={source.source} className="flex items-center gap-2">
                            {source.source === 'Email' && <Mail className="w-4 h-4" />}
                            {source.source === 'Social Media' && <Globe className="w-4 h-4" />}
                            {source.source === 'Direct' && <Link2 className="w-4 h-4" />}
                            {source.source === 'Referral' && <Users className="w-4 h-4" />}
                            {source.source === 'Search' && <Search className="w-4 h-4" />}
                            <span className="text-sm">{source.source}</span>
                            <span className="text-sm text-muted-foreground ml-auto">
                              {source.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          {revenue && (
            <>
              {/* Revenue Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Net Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${revenue.netRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      After ${revenue.refunds} refunds
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">${revenue.thisMonth.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +{revenue.growth}% vs last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Avg Ticket Price</p>
                    <p className="text-2xl font-bold">${revenue.averageTicketPrice.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Projected</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${revenue.projectedRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">This quarter</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Revenue by Ticket Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue by Ticket Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {revenue.byTicketType.map((ticket, index) => (
                        <div key={ticket.type}>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <Ticket className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{ticket.type}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">${ticket.revenue.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">{ticket.sold} sold</p>
                            </div>
                          </div>
                          <Progress 
                            value={(ticket.revenue / revenue.totalRevenue) * 100} 
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue by Event */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue by Event</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {revenue.byEvent.map((event, index) => (
                        <div 
                          key={event.eventName}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <p className="font-medium">{event.eventName}</p>
                            <p className="text-xs text-muted-foreground">{event.date}</p>
                          </div>
                          <p className="font-bold text-green-600">
                            ${event.revenue.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Stakeholder Share Dialog */}
      <StakeholderShareDialog
        eventId={shareEventId}
        eventName={shareEventName}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </div>
  );
}
