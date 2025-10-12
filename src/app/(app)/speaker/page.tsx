'use client';

import React from 'react';
import { Mic, Calendar, Users, Award, TrendingUp, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function SpeakerDashboard() {
  const speakerStats = {
    totalSessions: 5,
    upcomingSessions: 2,
    completedSessions: 3,
    totalAttendees: 450,
    averageRating: 4.6,
    materialsUploaded: 12,
  };

  const upcomingSessions = [
    {
      id: 'session_1',
      title: 'Introduction to SAP Cloud Platform',
      date: '2024-03-15',
      time: '10:00 AM',
      venue: 'Main Auditorium',
      attendees: 120,
      status: 'scheduled',
    },
    {
      id: 'session_2',
      title: 'Advanced SAP Integration Patterns',
      date: '2024-03-16',
      time: '2:00 PM',
      venue: 'Workshop Room A',
      attendees: 45,
      status: 'approved',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'feedback',
      message: 'New feedback received for "SAP Cloud Platform" session',
      time: '2 hours ago',
    },
    {
      id: 2,
      type: 'material',
      message: 'Presentation slides uploaded successfully',
      time: '1 day ago',
    },
    {
      id: 3,
      type: 'approval',
      message: 'Session "Integration Patterns" approved by organizers',
      time: '2 days ago',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Speaker Dashboard</h1>
            <p className="text-gray-600">Welcome back! Manage your sessions and track your impact.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/speaker/sessions">
              <Button>
                <Mic className="w-4 h-4 mr-2" />
                Manage Sessions
              </Button>
            </Link>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Calendar className="text-blue-500" size={24} />
              <div>
                <p className="text-2xl font-bold text-blue-600">{speakerStats.totalSessions}</p>
                <p className="text-sm text-gray-600">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Mic className="text-green-500" size={24} />
              <div>
                <p className="text-2xl font-bold text-green-600">{speakerStats.upcomingSessions}</p>
                <p className="text-sm text-gray-600">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Award className="text-purple-500" size={24} />
              <div>
                <p className="text-2xl font-bold text-purple-600">{speakerStats.completedSessions}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Users className="text-orange-500" size={24} />
              <div>
                <p className="text-2xl font-bold text-orange-600">{speakerStats.totalAttendees}</p>
                <p className="text-sm text-gray-600">Total Attendees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="text-yellow-500" size={24} />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{speakerStats.averageRating}★</p>
                <p className="text-sm text-gray-600">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Calendar className="text-red-500" size={24} />
              <div>
                <p className="text-2xl font-bold text-red-600">{speakerStats.materialsUploaded}</p>
                <p className="text-sm text-gray-600">Materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span>Upcoming Sessions</span>
            </CardTitle>
            <CardDescription>Your scheduled presentations and workshops</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{session.title}</h3>
                    <Badge 
                      variant={session.status === 'scheduled' ? 'default' : 'secondary'}
                    >
                      {session.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(session.date).toLocaleDateString()}
                      </p>
                      <p className="flex items-center mt-1">
                        <span className="w-4 h-4 mr-1 flex items-center justify-center">🕐</span>
                        {session.time}
                      </p>
                    </div>
                    <div>
                      <p className="flex items-center">
                        <span className="w-4 h-4 mr-1 flex items-center justify-center">📍</span>
                        {session.venue}
                      </p>
                      <p className="flex items-center mt-1">
                        <Users className="w-4 h-4 mr-1" />
                        {session.attendees} registered
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end mt-3">
                    <Link href={`/speaker/sessions?edit=${session.id}`}>
                      <Button variant="outline" size="sm">
                        Manage Session
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              
              {upcomingSessions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No upcoming sessions</p>
                  <Link href="/speaker/sessions">
                    <Button variant="outline" className="mt-2">
                      Create New Session
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'feedback' && <Award className="w-5 h-5 text-yellow-500" />}
                    {activity.type === 'material' && <Calendar className="w-5 h-5 text-blue-500" />}
                    {activity.type === 'approval' && <Award className="w-5 h-5 text-green-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Commonly used speaker functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/speaker/sessions?new=true">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Mic className="w-6 h-6 mb-2" />
                  New Session
                </Button>
              </Link>

              <Link href="/speaker/sessions?tab=materials">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Calendar className="w-6 h-6 mb-2" />
                  Upload Materials
                </Button>
              </Link>

              <Link href="/speaker/sessions?tab=profile">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Users className="w-6 h-6 mb-2" />
                  Update Profile
                </Button>
              </Link>

              <Link href="/analytics">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <TrendingUp className="w-6 h-6 mb-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}