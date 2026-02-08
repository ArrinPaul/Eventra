'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  CheckCircle2,
  DollarSign,
  RefreshCw,
  Share2,
  TrendingUp,
  Brain,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getOrganizerAnalytics, OrganizerAnalytics } from '@/app/actions/analytics';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function OrganizerAnalyticsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrganizerAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState('performance');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getOrganizerAnalytics(user._id || user.id);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const chartData = data?.popularEvents.map((e, i) => ({
    name: e.title.length > 15 ? e.title.substring(0, 12) + '...' : e.title,
    count: e.count,
    color: ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][i % 5]
  })) || [];

  return (
    <div className="space-y-6 text-white pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizer Analytics</h1>
          <p className="text-gray-400 mt-1">Real-time insights for your event ecosystem</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-500">
            <Share2 className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10 text-white overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar size={48} />
            </div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-400">Total Events</p>
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-0">Live</Badge>
            </div>
            <p className="text-3xl font-bold">{data?.totalEvents || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 text-white overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users size={48} />
            </div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-400">Total Registrations</p>
              <TrendingUp className="text-green-500 h-4 w-4" />
            </div>
            <p className="text-3xl font-bold">{data?.totalRegistrations || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 text-white overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign size={48} />
            </div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-400">Estimated Revenue</p>
              <Badge className="bg-purple-500/20 text-purple-400 border-0">USD</Badge>
            </div>
            <p className="text-3xl font-bold">${data?.totalRevenue || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 text-white overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 size={48} />
            </div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-400">Avg. Registration Rate</p>
            </div>
            <p className="text-3xl font-bold">{(data?.averageRegistrationRate || 0).toFixed(1)}</p>
            <p className="text-[10px] text-gray-500 mt-1">Attendees per event</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Widget */}
      <Card className="bg-gradient-to-r from-cyan-900/20 via-black to-purple-900/20 border-cyan-500/30 overflow-hidden shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="bg-cyan-500/20 p-4 rounded-2xl ring-1 ring-cyan-500/30">
              <Brain className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  AI Analytics Insights
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                </h3>
                <Badge className="bg-cyan-500 text-black font-bold">SMART ANALYSIS</Badge>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed italic">
                "{data?.aiInsights}"
              </p>
              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-1 text-xs text-cyan-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Real-time tracking
                </div>
                <div className="flex items-center gap-1 text-xs text-purple-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Audience prediction
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Popularity by Event
            </CardTitle>
            <CardDescription className="text-gray-400">Total registrations across your top events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#06b6d4' }}
                    cursor={{ fill: '#ffffff05' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Lists */}
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Top Performing Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.popularEvents.map((event, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-sm">
                      #{i + 1}
                    </div>
                    <p className="font-medium text-sm line-clamp-1">{event.title}</p>
                  </div>
                  <Badge variant="secondary" className="bg-white/10">{event.count} regs</Badge>
                </div>
              ))}
              {(!data || data.popularEvents.length === 0) && (
                <div className="text-center py-10 text-gray-500">
                  No event data yet.
                </div>
              )}
            </div>
            <Button variant="link" className="w-full mt-4 text-cyan-400 hover:text-cyan-300">
              View All Events
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <RefreshCw className={className} />;
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}