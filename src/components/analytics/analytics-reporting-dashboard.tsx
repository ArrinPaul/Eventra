/**
 * EventOS Analytics & Reporting Dashboard
 * Comprehensive analytics with real-time metrics and automated reporting
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Eye,
  MousePointer,
  Clock,
  Target,
  Award,
  Star,
  Heart,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Filter,
  Search,
  Settings,
  FileText,
  Mail,
  Bell,
  Zap,
  Globe,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  BarChart4,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  Building,
  UserCheck,
  Ticket,
  MessageSquare,
  ThumbsUp,
  Flag,
  Wifi,
  WifiOff,
  Signal,
  Database,
  Server,
  Cloud,
  Shield,
  Lock,
  Unlock,
  Key,
  Fingerprint
} from 'lucide-react';
import { EVENTOS_CONFIG } from '@/lib/eventos-config';
import type { Event, User, Organization } from '@/types/eventos';
import { addDays, subDays, format } from 'date-fns';

// Analytics Types
interface AnalyticsMetrics {
  // Event Metrics
  totalEvents: number;
  activeEvents: number;
  completedEvents: number;
  canceledEvents: number;
  
  // Registration Metrics
  totalRegistrations: number;
  confirmedAttendees: number;
  noShows: number;
  checkInRate: number;
  
  // Engagement Metrics
  avgSessionDuration: number;
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  
  // Revenue Metrics
  totalRevenue: number;
  averageTicketPrice: number;
  revenueGrowth: number;
  refunds: number;
  
  // Geographic Data
  topCountries: Array<{ country: string; count: number; percentage: number }>;
  topCities: Array<{ city: string; count: number; percentage: number }>;
  
  // Device & Browser Data
  deviceBreakdown: Array<{ device: string; count: number; percentage: number }>;
  browserBreakdown: Array<{ browser: string; count: number; percentage: number }>;
  
  // Time-based Data
  hourlyActivity: Array<{ hour: number; activity: number }>;
  dailyRegistrations: Array<{ date: string; registrations: number }>;
  weeklyRevenue: Array<{ week: string; revenue: number }>;
  monthlyGrowth: Array<{ month: string; growth: number }>;
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  type: 'scheduled' | 'on_demand';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  filters: {
    dateRange: { start: Date; end: Date };
    eventTypes: string[];
    organizations: string[];
    metrics: string[];
  };
  recipients: string[];
  isActive: boolean;
  lastGenerated?: Date;
  nextGeneration?: Date;
}

interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'heatmap';
  title: string;
  description: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number; w: number; h: number };
  config: {
    metric?: keyof AnalyticsMetrics;
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'radar';
    dataSource: string;
    filters?: Record<string, any>;
    refresh: number; // minutes
  };
  isVisible: boolean;
}

interface EventAnalytics {
  eventId: string;
  eventName: string;
  registrations: {
    total: number;
    confirmed: number;
    pending: number;
    canceled: number;
    timeline: Array<{ date: string; count: number }>;
  };
  attendance: {
    checkIns: number;
    noShows: number;
    rate: number;
    sessions: Array<{ sessionId: string; name: string; attendance: number }>;
  };
  engagement: {
    avgRating: number;
    feedbackCount: number;
    socialShares: number;
    photoUploads: number;
    networkingConnections: number;
  };
  revenue: {
    total: number;
    ticketSales: number;
    sponsorships: number;
    merchandise: number;
    breakdown: Array<{ category: string; amount: number }>;
  };
}

// Color schemes for charts
const CHART_COLORS = {
  primary: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'],
  gradient: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
  success: ['#10b981', '#059669', '#047857'],
  warning: ['#f59e0b', '#d97706', '#b45309'],
  danger: ['#ef4444', '#dc2626', '#b91c1c'],
};

// Form schemas
const reportSchema = z.object({
  name: z.string().min(1, 'Report name required'),
  description: z.string().optional(),
  type: z.enum(['scheduled', 'on_demand']),
  format: z.enum(['pdf', 'excel', 'csv', 'json']),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recipients: z.array(z.string().email()),
});

const widgetSchema = z.object({
  title: z.string().min(1, 'Widget title required'),
  type: z.enum(['metric', 'chart', 'table', 'heatmap']),
  size: z.enum(['small', 'medium', 'large', 'full']),
  dataSource: z.string(),
});

export function AnalyticsReportingDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>([]);
  const [eventAnalytics, setEventAnalytics] = useState<EventAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showWidgetDialog, setShowWidgetDialog] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    eventType: 'all',
    organization: 'all',
    region: 'all',
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const reportForm = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      type: 'on_demand' as const,
      format: 'pdf' as const,
      recipients: [],
    },
  });

  const widgetForm = useForm({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      type: 'metric' as const,
      size: 'medium' as const,
    },
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedFilters]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockMetrics: AnalyticsMetrics = {
        totalEvents: 127,
        activeEvents: 23,
        completedEvents: 98,
        canceledEvents: 6,
        
        totalRegistrations: 8942,
        confirmedAttendees: 7823,
        noShows: 634,
        checkInRate: 87.4,
        
        avgSessionDuration: 2.4, // hours
        pageViews: 45672,
        uniqueVisitors: 12834,
        bounceRate: 23.7,
        
        totalRevenue: 284750,
        averageTicketPrice: 89.50,
        revenueGrowth: 18.6,
        refunds: 3240,
        
        topCountries: [
          { country: 'United States', count: 4234, percentage: 47.4 },
          { country: 'United Kingdom', count: 1823, percentage: 20.4 },
          { country: 'Canada', count: 987, percentage: 11.0 },
          { country: 'Germany', count: 654, percentage: 7.3 },
          { country: 'Australia', count: 432, percentage: 4.8 },
        ],
        
        topCities: [
          { city: 'New York', count: 1567, percentage: 17.5 },
          { city: 'London', count: 1234, percentage: 13.8 },
          { city: 'San Francisco', count: 987, percentage: 11.0 },
          { city: 'Toronto', count: 765, percentage: 8.6 },
          { city: 'Berlin', count: 543, percentage: 6.1 },
        ],
        
        deviceBreakdown: [
          { device: 'Desktop', count: 5234, percentage: 58.5 },
          { device: 'Mobile', count: 2987, percentage: 33.4 },
          { device: 'Tablet', count: 721, percentage: 8.1 },
        ],
        
        browserBreakdown: [
          { browser: 'Chrome', count: 6234, percentage: 69.7 },
          { browser: 'Safari', count: 1567, percentage: 17.5 },
          { browser: 'Firefox', count: 789, percentage: 8.8 },
          { browser: 'Edge', count: 352, percentage: 3.9 },
        ],
        
        hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          activity: Math.floor(Math.random() * 100) + 20,
        })),
        
        dailyRegistrations: Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'MMM dd'),
          registrations: Math.floor(Math.random() * 200) + 50,
        })),
        
        weeklyRevenue: Array.from({ length: 12 }, (_, i) => ({
          week: `Week ${i + 1}`,
          revenue: Math.floor(Math.random() * 25000) + 15000,
        })),
        
        monthlyGrowth: [
          { month: 'Jan', growth: 12 },
          { month: 'Feb', growth: 18 },
          { month: 'Mar', growth: 24 },
          { month: 'Apr', growth: 15 },
          { month: 'May', growth: 32 },
          { month: 'Jun', growth: 28 },
        ],
      };

      const mockReports: CustomReport[] = [
        {
          id: 'report_1',
          name: 'Monthly Revenue Report',
          description: 'Comprehensive revenue analysis and projections',
          type: 'scheduled',
          format: 'pdf',
          schedule: {
            frequency: 'monthly',
            time: '09:00',
            dayOfMonth: 1,
          },
          filters: {
            dateRange: { start: subDays(new Date(), 30), end: new Date() },
            eventTypes: ['conference', 'workshop'],
            organizations: [],
            metrics: ['revenue', 'registrations', 'attendance'],
          },
          recipients: ['admin@company.com', 'finance@company.com'],
          isActive: true,
          lastGenerated: subDays(new Date(), 3),
          nextGeneration: addDays(new Date(), 27),
        },
      ];

      const mockWidgets: DashboardWidget[] = [
        {
          id: 'widget_1',
          type: 'metric',
          title: 'Total Revenue',
          description: 'Total revenue across all events',
          size: 'small',
          position: { x: 0, y: 0, w: 3, h: 2 },
          config: {
            metric: 'totalRevenue',
            dataSource: 'events',
            refresh: 5,
          },
          isVisible: true,
        },
        {
          id: 'widget_2',
          type: 'chart',
          title: 'Registration Trends',
          description: 'Daily registration patterns',
          size: 'large',
          position: { x: 3, y: 0, w: 9, h: 4 },
          config: {
            chartType: 'line',
            dataSource: 'registrations',
            refresh: 15,
          },
          isVisible: true,
        },
      ];

      const mockEventAnalytics: EventAnalytics[] = [
        {
          eventId: 'event_1',
          eventName: 'Tech Conference 2024',
          registrations: {
            total: 1250,
            confirmed: 1087,
            pending: 89,
            canceled: 74,
            timeline: Array.from({ length: 14 }, (_, i) => ({
              date: format(subDays(new Date(), 13 - i), 'MMM dd'),
              count: Math.floor(Math.random() * 100) + 20,
            })),
          },
          attendance: {
            checkIns: 967,
            noShows: 120,
            rate: 89.0,
            sessions: [
              { sessionId: 'session_1', name: 'Opening Keynote', attendance: 945 },
              { sessionId: 'session_2', name: 'AI Panel Discussion', attendance: 734 },
              { sessionId: 'session_3', name: 'Networking Lunch', attendance: 823 },
            ],
          },
          engagement: {
            avgRating: 4.6,
            feedbackCount: 567,
            socialShares: 234,
            photoUploads: 89,
            networkingConnections: 456,
          },
          revenue: {
            total: 87500,
            ticketSales: 75000,
            sponsorships: 10000,
            merchandise: 2500,
            breakdown: [
              { category: 'Early Bird', amount: 35000 },
              { category: 'Regular', amount: 40000 },
              { category: 'VIP', amount: 12500 },
            ],
          },
        },
      ];

      setMetrics(mockMetrics);
      setCustomReports(mockReports);
      setDashboardWidgets(mockWidgets);
      setEventAnalytics(mockEventAnalytics);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast({
        title: 'Error Loading Data',
        description: 'Unable to load analytics data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createReport = async (data: any) => {
    try {
      const newReport: CustomReport = {
        id: `report_${Date.now()}`,
        name: data.name,
        description: data.description || '',
        type: data.type,
        format: data.format,
        schedule: data.type === 'scheduled' ? {
          frequency: data.frequency,
          time: '09:00',
        } : undefined,
        filters: {
          dateRange: dateRange,
          eventTypes: [],
          organizations: [],
          metrics: ['revenue', 'registrations'],
        },
        recipients: data.recipients || [],
        isActive: true,
      };

      setCustomReports(prev => [newReport, ...prev]);
      setShowReportDialog(false);
      reportForm.reset();

      toast({
        title: 'Report Created',
        description: 'Custom report has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Unable to create report.',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +{formatPercentage(metrics.revenueGrowth)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{metrics.totalEvents}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
                    {metrics.activeEvents} active
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Registrations</p>
                  <p className="text-2xl font-bold">{metrics.totalRegistrations.toLocaleString()}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-1" />
                    {formatPercentage(metrics.checkInRate)} check-in rate
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Ticket Price</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.averageTicketPrice)}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Ticket className="w-4 h-4 mr-1" />
                    {metrics.uniqueVisitors.toLocaleString()} visitors
                  </div>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row 1 */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Registration Trends</CardTitle>
              <CardDescription>Daily registrations over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.dailyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="registrations" 
                    stroke={CHART_COLORS.primary[0]} 
                    fill={CHART_COLORS.primary[0]}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth</CardTitle>
              <CardDescription>Weekly revenue trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.weeklyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill={CHART_COLORS.primary[1]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row 2 */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
              <CardDescription>User device preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={metrics.deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ device, percentage }) => `${device}: ${percentage}%`}
                  >
                    {metrics.deviceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.primary[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
              <CardDescription>Registration by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topCountries.slice(0, 5).map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <span className="font-medium">{country.country}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${country.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {country.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hourly Activity</CardTitle>
              <CardDescription>Activity by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={metrics.hourlyActivity}>
                  <XAxis dataKey="hour" />
                  <YAxis hide />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="activity" 
                    stroke={CHART_COLORS.primary[2]}
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS.primary[2] }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderEventAnalytics = () => (
    <div className="space-y-6">
      {eventAnalytics.map((event) => (
        <Card key={event.eventId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{event.eventName}</CardTitle>
                <CardDescription>
                  {event.registrations.total.toLocaleString()} total registrations • 
                  {formatPercentage(event.attendance.rate)} attendance rate
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <FileText className="w-4 h-4 mr-1" />
                  Export
                </Button>
                <Button size="sm" variant="outline">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Event
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="registrations">Registrations</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{event.registrations.total}</p>
                    <p className="text-sm text-muted-foreground">Total Registrations</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{formatPercentage(event.attendance.rate)}</p>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{event.engagement.avgRating}</p>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{formatCurrency(event.revenue.total)}</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={event.registrations.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke={CHART_COLORS.primary[0]}
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="registrations" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg bg-green-50">
                    <p className="text-xl font-bold text-green-700">{event.registrations.confirmed}</p>
                    <p className="text-sm text-green-600">Confirmed</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-yellow-50">
                    <p className="text-xl font-bold text-yellow-700">{event.registrations.pending}</p>
                    <p className="text-sm text-yellow-600">Pending</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-red-50">
                    <p className="text-xl font-bold text-red-700">{event.registrations.canceled}</p>
                    <p className="text-sm text-red-600">Canceled</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-xl font-bold">{event.registrations.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="attendance" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-semibold">Session Attendance</h4>
                  {event.attendance.sessions.map((session) => (
                    <div key={session.sessionId} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{session.name}</span>
                      <div className="flex items-center space-x-3">
                        <Progress 
                          value={(session.attendance / event.registrations.confirmed) * 100} 
                          className="w-24"
                        />
                        <span className="text-sm font-medium">{session.attendance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="revenue" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Revenue Breakdown</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={event.revenue.breakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="amount"
                          label={({ category, amount }) => `${category}: ${formatCurrency(amount)}`}
                        >
                          {event.revenue.breakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS.primary[index]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Revenue Sources</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>Ticket Sales</span>
                        <span className="font-semibold">{formatCurrency(event.revenue.ticketSales)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>Sponsorships</span>
                        <span className="font-semibold">{formatCurrency(event.revenue.sponsorships)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>Merchandise</span>
                        <span className="font-semibold">{formatCurrency(event.revenue.merchandise)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Reports Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Reports</h3>
          <p className="text-sm text-muted-foreground">
            Create and schedule automated reports
          </p>
        </div>
        <Button onClick={() => setShowReportDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {customReports.map((report) => (
          <Card key={report.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold">{report.name}</h4>
                    <Badge variant={report.type === 'scheduled' ? 'default' : 'secondary'}>
                      {report.type}
                    </Badge>
                    <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                    <div className={`w-2 h-2 rounded-full ${report.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Schedule:</span>
                      <p className="font-medium">
                        {report.schedule?.frequency ? `${report.schedule.frequency} at ${report.schedule.time}` : 'On demand'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recipients:</span>
                      <p className="font-medium">{report.recipients.length} email(s)</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Generated:</span>
                      <p className="font-medium">
                        {report.lastGenerated ? report.lastGenerated.toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Analytics & Reporting</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics with real-time metrics and automated reporting
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <BarChart3 className="w-4 h-4 mr-1" />
            Export Dashboard
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={selectedFilters.eventType} onValueChange={(value) => 
              setSelectedFilters(prev => ({ ...prev, eventType: value }))
            }>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="webinar">Webinar</SelectItem>
                <SelectItem value="meetup">Meetup</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedFilters.organization} onValueChange={(value) => 
              setSelectedFilters(prev => ({ ...prev, organization: value }))
            }>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                <SelectItem value="org1">Tech Corp</SelectItem>
                <SelectItem value="org2">Innovation Labs</SelectItem>
                <SelectItem value="org3">Global Events</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedFilters.region} onValueChange={(value) => 
              setSelectedFilters(prev => ({ ...prev, region: value }))
            }>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="north-america">North America</SelectItem>
                <SelectItem value="europe">Europe</SelectItem>
                <SelectItem value="asia">Asia Pacific</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedFilters({ eventType: 'all', organization: 'all', region: 'all' })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Event Analytics</TabsTrigger>
          <TabsTrigger value="reports">Custom Reports</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="events">
          {renderEventAnalytics()}
        </TabsContent>

        <TabsContent value="reports">
          {renderReports()}
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Real-time Activity</span>
              </CardTitle>
              <CardDescription>
                Live metrics and user activity across your events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Real-time dashboard will be implemented here with WebSocket connections.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Report</DialogTitle>
            <DialogDescription>
              Set up automated or on-demand reporting
            </DialogDescription>
          </DialogHeader>
          
          <Form {...reportForm}>
            <form onSubmit={reportForm.handleSubmit(createReport)} className="space-y-4">
              <FormField
                control={reportForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Monthly Analytics Report" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reportForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="on_demand">On Demand</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reportForm.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Export Format</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowReportDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  Create Report
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}