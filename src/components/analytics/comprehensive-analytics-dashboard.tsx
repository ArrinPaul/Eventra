'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  TrendingUp, 
  Sparkles
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Analytics Dashboard</h2><p className="text-gray-400">Track platform performance</p></div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="bg-white/5 border-white/10 text-white">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardContent className="p-6">
              <p className="text-sm text-gray-400">Total Events</p>
              <p className="text-2xl font-bold">12</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 text-white">
            <CardContent className="p-6">
              <p className="text-sm text-gray-400">Active Users</p>
              <p className="text-2xl font-bold">450</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
