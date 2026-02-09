'use client';

import React from 'react';
import { Mic, Calendar, Users, Award, TrendingUp, Settings, Loader2, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { format, isPast, isFuture } from 'date-fns';

export default function SpeakerDashboard() {
  const { user } = useAuth();
  
  const sessions = useQuery(api.events.getBySpeaker, user?.name ? { speakerName: user.name } : "skip" as any) || [];
  const notifications = useQuery(api.notifications.get) || [];

  const stats = {
    totalSessions: sessions.length,
    upcomingSessions: sessions.filter(s => isFuture(new Date(s.startDate))).length,
    completedSessions: sessions.filter(s => isPast(new Date(s.startDate)) || s.status === 'completed').length,
    totalAttendees: sessions.reduce((sum, s) => sum + (s.registeredCount || 0), 0),
    averageRating: 4.8, // Fallback as we don't have per-speaker rating aggregation yet
  };

  const upcomingSessions = sessions
    .filter(s => isFuture(new Date(s.startDate)) && s.status === 'published')
    .sort((a, b) => a.startDate - b.startDate);

  const speakerActivity = notifications
    .filter(n => n.message.toLowerCase().includes('session') || n.message.toLowerCase().includes('event'))
    .slice(0, 5);

  if (!user) return <div className="p-20 text-center text-white">Please sign in to view your speaker dashboard.</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 text-white space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Speaker Hub</h1>
          <p className="text-gray-400 mt-2 text-lg">Manage your presentations and track your audience impact.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/speaker/sessions">
            <Button className="bg-cyan-600 hover:bg-cyan-500 text-white">
              <Mic className="w-4 h-4 mr-2" />
              My Sessions
            </Button>
          </Link>
          <Button variant="outline" className="border-white/10 hover:bg-white/5">
            <Settings className="w-4 h-4 mr-2" />
            Profile
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: stats.totalSessions, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Upcoming', value: stats.upcomingSessions, icon: Mic, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Attendees', value: stats.totalAttendees, icon: Users, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Avg Rating', value: `${stats.averageRating}★`, icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map((stat, i) => (
          <Card key={i} className="bg-white/5 border-white/10 overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-110", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Sessions */}
        <Card className="lg:col-span-2 bg-white/5 border-white/10 overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Upcoming Engagements
            </CardTitle>
            <CardDescription className="text-gray-500">Your scheduled presentations and workshops</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <Mic className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No upcoming sessions found.</p>
                </div>
              ) : (
                upcomingSessions.map((session) => (
                  <div key={session._id} className="p-6 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-0 text-[10px]">{session.category}</Badge>
                          <h3 className="font-bold text-lg group-hover:text-cyan-400 transition-colors">{session.title}</h3>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          <p className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-600" /> {format(session.startDate, 'PPP')}</p>
                          <p className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-600" /> {typeof session.location === 'string' ? session.location : session.location?.venue?.name || 'TBD'}</p>
                          <p className="flex items-center gap-1.5"><Users size={14} className="text-gray-600" /> {session.registeredCount} registered</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild className="border-white/10 hover:bg-white/5 shrink-0 self-start">
                        <Link href={`/events/${session._id}`}>View Event</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/5 border-white/10 h-fit">
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Latest Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {speakerActivity.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-sm italic">No recent activity</div>
              ) : (
                speakerActivity.map((activity) => (
                  <div key={activity._id} className="p-4 hover:bg-white/[0.01]">
                    <p className="text-sm text-gray-300 font-medium">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{activity.message}</p>
                    <p className="text-[10px] text-gray-600 mt-2 font-mono uppercase">{format(activity.createdAt, 'MMM d, h:mm a')}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border-cyan-500/30 overflow-hidden">
        <CardHeader>
          <CardTitle>Quick Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Upload Slides', icon: Award, href: '#' },
              { label: 'Feedback', icon: Users, href: '/analytics' },
              { label: 'Schedule', icon: Calendar, href: '/calendar' },
              { label: 'New Session', icon: Mic, href: '/events/create' },
            ].map((action, i) => (
              <Link key={i} href={action.href}>
                <Button variant="outline" className="w-full h-24 flex-col gap-2 bg-white/5 border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/50 group transition-all">
                  <action.icon className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-xs uppercase font-bold tracking-widest text-gray-500 group-hover:text-white">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
