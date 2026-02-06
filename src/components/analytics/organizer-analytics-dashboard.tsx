'use client';

import React, { useState } from 'react';
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
  Share2
} from 'lucide-react';

export default function OrganizerAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('performance');

  return (
    <div className="space-y-6 text-white">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Organizer Analytics</h1><p className="text-gray-400">Track your event performance</p></div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/10"><RefreshCw size={16} /></Button>
          <Button><Share2 className="mr-2" size={16} /> Share</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-4">
            <Calendar className="text-cyan-400 mb-2" size={20} />
            <p className="text-2xl font-bold">8</p>
            <p className="text-xs text-gray-400">Events</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="p-4">
            <Users className="text-cyan-400 mb-2" size={20} />
            <p className="text-2xl font-bold">156</p>
            <p className="text-xs text-gray-400">Registrations</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border-white/10 text-white">
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="performance" className="py-20 text-center text-gray-500 border border-white/10 rounded-lg">Performance charts coming soon</TabsContent>
      </Tabs>
    </div>
  );
}