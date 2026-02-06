'use client';

import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Mic,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from 'convex/react';
import { api } from "../../../../../convex/_generated/api";

export default function SpeakerSessionDashboard() {
  const { user } = useAuth();
  const allEventsRaw = useQuery(api.events.get);
  const { toast } = useToast();

  const loading = allEventsRaw === undefined;
  const events = (allEventsRaw || []).map((e: any) => ({ ...e, id: e._id }));
  
  const speakerSessions = events.filter((event: any) => 
    event.speakers && event.speakers.some((s: any) => (typeof s === 'string' ? s === user?._id : s.id === user?._id))
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-white">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 text-white">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Mic className="text-cyan-400" size={32} />
          <h1 className="text-3xl font-bold">Speaker Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <h2 className="text-2xl font-bold">My Sessions</h2>
        {speakerSessions.map((session: any) => (
          <Card key={session.id} className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{session.title}</CardTitle>
                  <CardDescription className="text-gray-400">{session.category}</CardDescription>
                </div>
                <Badge>{session.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">{session.description}</p>
              <div className="flex gap-4 mt-4 text-sm text-gray-400">
                <span className="flex items-center gap-1"><Users size={14} /> {session.registeredCount} attendees</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(session.startDate).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {speakerSessions.length === 0 && <p className="text-gray-500 text-center py-10">No sessions assigned yet.</p>}
      </div>
    </div>
  );
}