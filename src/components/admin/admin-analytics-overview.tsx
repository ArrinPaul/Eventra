'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Calendar,
  Activity,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

export default function AdminAnalyticsOverview() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6 text-white">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold">Platform Analytics</h2><p className="text-gray-400">Real-time insights</p></div>
        <Button variant="outline" className="border-white/10"><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-4">
            <Users className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">1,240</p>
            <p className="text-xs text-gray-400">Total Users</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-4">
            <Calendar className="w-5 h-5 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">42</p>
            <p className="text-xs text-gray-400">Total Events</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border-white/10 text-white">
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card className="bg-white/5 border-white/10 text-white p-20 text-center text-gray-500">Analytics charts coming soon</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Button({ children, variant, className, ...props }: any) {
    return <button className={`px-4 py-2 rounded-md ${className}`} {...props}>{children}</button>;
}