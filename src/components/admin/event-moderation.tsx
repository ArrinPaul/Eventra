'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flag, Clock, MessageSquare } from 'lucide-react';

export default function EventModeration() {
  const [activeTab, setActiveTab] = useState('reports');

  return (
    <div className="space-y-6 text-white">
      <div><h2 className="text-2xl font-bold">Event Moderation</h2><p className="text-gray-400">Review and moderate platform content</p></div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border-white/10 text-white">
          <TabsTrigger value="reports" className="gap-2"><Flag size={16} /> Reports</TabsTrigger>
          <TabsTrigger value="pending" className="gap-2"><Clock size={16} /> Pending</TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="py-20 text-center text-gray-500 border border-white/10 rounded-lg">Moderation features coming soon</TabsContent>
      </Tabs>
    </div>
  );
}