'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  MapPin,
  Clock,
  Zap,
  Target,
  Brain,
  Activity,
  PieChart,
  LineChart,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Share2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '../../hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  Bar,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';

interface AnalyticsData {
  attendance: {
    historical: any[];
    prediction: any[];
    trends: any[];
  };
  engagement: {
    metrics: any[];
    scores: any[];
    patterns: any[];
  };
  demographics: {
    roles: any[];
    locations: any[];
    interests: any[];
  };
  events: {
    performance: any[];
    feedback: any[];
    completion: any[];
  };
  predictions: {
    nextEvent: any;
    attendanceForecasting: any[];
    engagementTrends: any[];
    recommendations: any[];
  };
}

interface AIInsightsDashboardProps {
  eventId?: string;
  eventTitle?: string;
  userRole: 'student' | 'professional' | 'organizer';
}

export default function AIInsightsDashboard({ eventId, eventTitle, userRole }: AIInsightsDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['attendance', 'engagement']);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, eventId]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-insights/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          timeRange,
          eventId,
          metrics: selectedMetrics,
          userRole,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.analytics);
      } else {
        throw new Error(data.error || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been updated with the latest information.",
    });
  };

  const exportReport = async (format: 'pdf' | 'csv' | 'xlsx') => {
    try {
      const response = await fetch('/api/ai-insights/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          format,
          timeRange,
          eventId,
          metrics: selectedMetrics,
        }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cis-sap-analytics-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `Analytics report exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export analytics report.",
        variant: "destructive",
      });
    }
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  const MetricCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className={`flex items-center gap-1 text-sm ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : 
                 trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                {change}
              </div>
            )}
          </div>
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  const InsightCard = ({ title, description, type, confidence, actions }: any) => (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{title}</span>
              <Badge variant={confidence > 80 ? 'default' : confidence > 60 ? 'secondary' : 'outline'}>
                {confidence}% confidence
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            {actions && actions.length > 0 && (
              <div className="flex gap-2">
                {actions.map((action: any, idx: number) => (
                  <Button key={idx} variant="outline" size="sm">
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className={`w-3 h-3 rounded-full ${
            type === 'opportunity' ? 'bg-green-500' : 
            type === 'warning' ? 'bg-yellow-500' : 
            type === 'critical' ? 'bg-red-500' : 'bg-blue-500'
          }`} />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Insights Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading analytics data...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Insights Dashboard
              {eventTitle && (
                <Badge variant="outline">
                  {eventTitle}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={refreshData} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button variant="outline" onClick={() => exportReport('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Attendees"
                  value={analyticsData?.attendance.historical.reduce((sum, item) => sum + item.value, 0) || 0}
                  change="+12.5%"
                  trend="up"
                  icon={Users}
                />
                <MetricCard
                  title="Avg Engagement"
                  value="87.3%"
                  change="+5.2%"
                  trend="up"
                  icon={Activity}
                />
                <MetricCard
                  title="Events Completed"
                  value={analyticsData?.events.completion.length || 0}
                  change="+8"
                  trend="up"
                  icon={CheckCircle}
                />
                <MetricCard
                  title="Satisfaction Score"
                  value="4.6/5"
                  change="+0.3"
                  trend="up"
                  icon={Target}
                />
              </div>

              {/* Overview Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analyticsData?.attendance.historical || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Demographics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={analyticsData?.demographics.roles || []}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                        >
                          {analyticsData?.demographics.roles?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="attendance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Historical Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsLineChart data={analyticsData?.attendance.historical || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="registered" stroke="#8884d8" name="Registered" />
                        <Line type="monotone" dataKey="attended" stroke="#82ca9d" name="Attended" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Attendance by Event Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsBarChart data={analyticsData?.events.performance || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="attendance" fill="#8884d8" />
                        <Bar dataKey="satisfaction" fill="#82ca9d" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Patterns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsLineChart data={analyticsData?.engagement.patterns || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="interactions" stroke="#8884d8" name="Interactions" />
                        <Line type="monotone" dataKey="feedback" stroke="#82ca9d" name="Feedback" />
                        <Line type="monotone" dataKey="networking" stroke="#ffc658" name="Networking" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Feature Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsBarChart layout="horizontal" data={analyticsData?.engagement.metrics || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="feature" type="category" />
                        <Tooltip />
                        <Bar dataKey="usage" fill="#8884d8" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="predictions" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Forecasting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RechartsLineChart data={analyticsData?.predictions.attendanceForecasting || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="predicted" stroke="#8884d8" strokeDasharray="5 5" name="Predicted" />
                        <Line type="monotone" dataKey="confidence_upper" stroke="#82ca9d" strokeDasharray="3 3" name="Upper Bound" />
                        <Line type="monotone" dataKey="confidence_lower" stroke="#82ca9d" strokeDasharray="3 3" name="Lower Bound" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={analyticsData?.predictions.engagementTrends || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="trend" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Next Event Prediction */}
              {analyticsData?.predictions.nextEvent && (
                <Card>
                  <CardHeader>
                    <CardTitle>Next Event Predictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold text-lg">Expected Attendance</h3>
                        <p className="text-3xl font-bold text-blue-600">
                          {analyticsData.predictions.nextEvent.attendance}
                        </p>
                        <p className="text-sm text-muted-foreground">±15% confidence</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold text-lg">Optimal Capacity</h3>
                        <p className="text-3xl font-bold text-green-600">
                          {analyticsData.predictions.nextEvent.capacity}
                        </p>
                        <p className="text-sm text-muted-foreground">Recommended</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold text-lg">Success Probability</h3>
                        <p className="text-3xl font-bold text-purple-600">
                          {analyticsData.predictions.nextEvent.success}%
                        </p>
                        <p className="text-sm text-muted-foreground">Based on trends</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-6">
              <div className="space-y-4">
                <InsightCard
                  title="High Engagement Opportunity"
                  description="Professional networking events show 23% higher engagement rates. Consider scheduling more professional-focused sessions during peak hours (2-4 PM)."
                  type="opportunity"
                  confidence={87}
                  actions={[
                    { label: 'Schedule Professional Event', action: 'schedule' },
                    { label: 'View Details', action: 'details' }
                  ]}
                />
                
                <InsightCard
                  title="Attendance Drop Warning"
                  description="Friday afternoon events consistently show 35% lower attendance. Consider moving these to Tuesday-Thursday for better engagement."
                  type="warning"
                  confidence={92}
                  actions={[
                    { label: 'Reschedule Events', action: 'reschedule' },
                    { label: 'Analyze Pattern', action: 'analyze' }
                  ]}
                />
                
                <InsightCard
                  title="Demographic Shift Detected"
                  description="Student participation has increased 45% in technical workshops. This trend suggests growing interest in hands-on learning experiences."
                  type="insight"
                  confidence={78}
                  actions={[
                    { label: 'Create More Workshops', action: 'create' },
                    { label: 'Survey Students', action: 'survey' }
                  ]}
                />
                
                <InsightCard
                  title="Optimal Event Duration"
                  description="Events lasting 90-120 minutes receive the highest satisfaction scores (4.7/5). Consider adjusting longer events to fit this timeframe."
                  type="recommendation"
                  confidence={85}
                  actions={[
                    { label: 'Update Guidelines', action: 'guidelines' },
                    { label: 'Review Events', action: 'review' }
                  ]}
                />
              </div>

              {/* AI Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData?.predictions.recommendations?.map((rec: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">Impact: {rec.impact}</Badge>
                            <Badge variant="outline">Effort: {rec.effort}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}