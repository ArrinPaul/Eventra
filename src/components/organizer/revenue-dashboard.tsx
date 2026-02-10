'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Ticket, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ExportButton } from '@/components/shared/export-button';

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function RevenueDashboard() {
  const stats = useQuery(api.analytics.getOrganizerRevenue);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const chartConfig = {
    amount: { label: "Revenue", color: "hsl(var(--primary))" },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Revenue Overview</h2>
        <ExportButton 
          data={stats.revenueByEvent.map(e => ({
            "Event Title": e.title,
            "Total Revenue": e.revenue,
            "Tickets Sold": e.ticketCount,
            "Organizer ID": stats.totalRevenue // just as example
          }))} 
          filename="revenue_report" 
          title="Revenue Report" 
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-400">Total Revenue</p>
              <DollarSign className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1 text-green-400 text-xs">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-400">Total Tickets</p>
              <Ticket className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold">
              {stats.revenueByEvent.reduce((sum, e) => sum + e.ticketCount, 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-1 mt-1 text-green-400 text-xs">
              <ArrowUpRight className="h-3 w-3" />
              <span>+8.2% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-400">Avg. Order Value</p>
              <TrendingUp className="h-4 w-4 text-pink-400" />
            </div>
            <p className="text-2xl font-bold">
              ${stats.totalRevenue > 0 
                ? (stats.totalRevenue / stats.revenueByEvent.reduce((sum, e) => sum + e.ticketCount, 0)).toFixed(2) 
                : '0'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-400">Active Events</p>
              <Users className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold">{stats.revenueByEvent.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription className="text-gray-400">Daily revenue for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#06b6d4" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4, fill: '#06b6d4' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Revenue by Event</CardTitle>
            <CardDescription className="text-gray-400">Top performing events by revenue</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueByEvent.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff10" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} hide />
                  <YAxis 
                    dataKey="title" 
                    type="category" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    width={100}
                    tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 15)}...` : val}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle>Tier Breakdown</CardTitle>
          <CardDescription className="text-gray-400">Revenue distribution by ticket type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(stats.revenueByTier).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {Object.entries(stats.revenueByTier).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {Object.entries(stats.revenueByTier).sort((a, b) => b[1] - a[1]).map(([name, value], index) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${value.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">
                      {((value / stats.totalRevenue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
