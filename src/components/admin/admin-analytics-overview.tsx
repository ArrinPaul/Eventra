'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Users,
  Calendar,
  Activity,
  BarChart3,
  RefreshCw,
  Ticket,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminAnalyticsOverview() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const users = useQuery(api.users.list) || [];
  const events = useQuery(api.events.get) || [];
  
  const totalUsers = users.length;
  const totalEvents = events.length;
  const publishedEvents = events.filter((e: any) => e.status === 'published').length;
  const totalRegistrations = events.reduce((sum: number, e: any) => sum + (e.registeredCount || 0), 0);

  return (
    <div className="space-y-6 text-white">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Platform Analytics</h2>
          <p className="text-gray-400">Real-time platform performance insights</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2"><Users size={16} /><span className="text-[10px] uppercase font-bold tracking-wider">Total Users</span></div>
            <p className="text-3xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-400 mb-2"><Calendar size={16} /><span className="text-[10px] uppercase font-bold tracking-wider">Total Events</span></div>
            <p className="text-3xl font-bold">{totalEvents}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2"><Ticket size={16} /><span className="text-[10px] uppercase font-bold tracking-wider">Registrations</span></div>
            <p className="text-3xl font-bold">{totalRegistrations}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-cyan-400 mb-2"><TrendingUp size={16} /><span className="text-[10px] uppercase font-bold tracking-wider">Published</span></div>
            <p className="text-3xl font-bold">{publishedEvents}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white/5 border-white/10 text-white">
          <TabsTrigger value="overview">Growth Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card className="bg-white/5 border-white/10 text-white p-20 text-center text-gray-500 italic">
            Visual charts for user growth and event frequency will appear here as more data is collected.
          </Card>
        </TabsContent>
        <TabsContent value="engagement">
          <Card className="bg-white/5 border-white/10 text-white p-20 text-center text-gray-500 italic">
            Engagement metrics such as chat activity and badge earnings will appear here.
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
