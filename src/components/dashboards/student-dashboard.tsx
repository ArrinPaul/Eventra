'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  Trophy, 
  MessageCircle,
  Bell,
  QrCode,
  FileText,
  TrendingUp,
  Star,
  Clock,
  MapPin,
  Zap,
  User,
  ChevronRight,
  Plus,
  Download,
  Share2,
  Heart,
  Bookmark,
  ExternalLink,
  Camera,
  Gift,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { GoogleWorkspaceDashboard } from '@/components/workspace';
import { NotationClient } from '@/components/notation';

interface StudentDashboardProps {
  className?: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in real app this would come from Firebase
  const studentStats = {
    eventsAttended: 12,
    networksConnected: 28,
    skillPointsEarned: 450,
    certificatesEarned: 3,
    notesCreated: 8,
    upcomingEvents: 5
  };

  const upcomingEvents = [
    {
      id: '1',
      title: 'AI & Machine Learning Summit',
      date: '2024-01-15',
      time: '9:00 AM',
      location: 'Tech Hub',
      registered: true,
      featured: true
    },
    {
      id: '2',
      title: 'Career Development Workshop',
      date: '2024-01-18',
      time: '2:00 PM',
      location: 'Conference Hall A',
      registered: false,
      featured: false
    },
    {
      id: '3',
      title: 'Innovation Showcase',
      date: '2024-01-22',
      time: '10:00 AM',
      location: 'Exhibition Center',
      registered: true,
      featured: true
    }
  ];

  const recentConnections = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Software Engineer at Google',
      avatar: null,
      mutualConnections: 5,
      lastEvent: 'Tech Summit 2024'
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Data Scientist at Meta',
      avatar: null,
      mutualConnections: 3,
      lastEvent: 'AI Workshop'
    },
    {
      id: '3',
      name: 'Emily Davis',
      role: 'UX Designer at Spotify',
      avatar: null,
      mutualConnections: 8,
      lastEvent: 'Design Thinking Session'
    }
  ];

  const achievements = [
    {
      id: '1',
      title: 'Early Bird',
      description: 'Registered for 10 events in advance',
      icon: '🐦',
      earned: true,
      date: '2024-01-10'
    },
    {
      id: '2',
      title: 'Network Builder',
      description: 'Connected with 25+ professionals',
      icon: '🌐',
      earned: true,
      date: '2024-01-08'
    },
    {
      id: '3',
      title: 'Knowledge Seeker',
      description: 'Attended 15 learning sessions',
      icon: '📚',
      earned: false,
      progress: 12
    }
  ];

  const recentNotes = [
    {
      id: '1',
      title: 'AI Trends 2024',
      event: 'AI Summit',
      lastModified: '2 hours ago',
      collaborators: 3
    },
    {
      id: '2',
      title: 'Career Development Tips',
      event: 'Professional Workshop',
      lastModified: '1 day ago',
      collaborators: 1
    }
  ];

  const skills = [
    { name: 'JavaScript', level: 85, category: 'Programming' },
    { name: 'React', level: 78, category: 'Frontend' },
    { name: 'Node.js', level: 65, category: 'Backend' },
    { name: 'Machine Learning', level: 42, category: 'AI/ML' },
    { name: 'Public Speaking', level: 55, category: 'Soft Skills' }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome back, {user?.name || 'Student'}! 🎓
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Continue your learning journey and build meaningful connections
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
              <QrCode className="h-4 w-4 mr-2" />
              My QR Code
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Events Attended</p>
                  <p className="text-3xl font-bold">{studentStats.eventsAttended}</p>
                </div>
                <Calendar className="h-8 w-8 opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Connections</p>
                  <p className="text-3xl font-bold">{studentStats.networksConnected}</p>
                </div>
                <Users className="h-8 w-8 opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Skill Points</p>
                  <p className="text-3xl font-bold">{studentStats.skillPointsEarned}</p>
                </div>
                <Zap className="h-8 w-8 opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Certificates</p>
                  <p className="text-3xl font-bold">{studentStats.certificatesEarned}</p>
                </div>
                <Award className="h-8 w-8 opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Notes Created</p>
                  <p className="text-3xl font-bold">{studentStats.notesCreated}</p>
                </div>
                <FileText className="h-8 w-8 opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Upcoming</p>
                  <p className="text-3xl font-bold">{studentStats.upcomingEvents}</p>
                </div>
                <Clock className="h-8 w-8 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="networking">Network</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Events and Quick Actions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Upcoming Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className={`p-4 rounded-lg border ${event.featured ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{event.title}</h3>
                              {event.featured && <Badge className="text-xs">Featured</Badge>}
                              {event.registered && <Badge variant="outline" className="text-xs">Registered</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {event.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!event.registered ? (
                              <Button size="sm">Register</Button>
                            ) : (
                              <Button size="sm" variant="outline">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      View All Events
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      My Recent Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentNotes.map((note) => (
                      <div key={note.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{note.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">{note.event}</Badge>
                            <span>{note.lastModified}</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {note.collaborators}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Note
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Networking and Skills */}
              <div className="space-y-6">
                {/* Recent Connections */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Recent Connections
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentConnections.slice(0, 3).map((connection) => (
                      <div key={connection.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {connection.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{connection.name}</h4>
                          <p className="text-xs text-muted-foreground">{connection.role}</p>
                          <p className="text-xs text-blue-600">{connection.mutualConnections} mutual connections</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      View All Connections
                    </Button>
                  </CardContent>
                </Card>

                {/* Skills Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      Skills Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {skills.slice(0, 4).map((skill) => (
                      <div key={skill.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{skill.name}</span>
                          <span className="text-muted-foreground">{skill.level}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${skill.level}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{skill.category}</p>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      View Skills Assessment
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="flex-col h-16 gap-1">
                        <QrCode className="h-5 w-5" />
                        <span className="text-xs">Check In</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-col h-16 gap-1">
                        <Users className="h-5 w-5" />
                        <span className="text-xs">Find People</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-col h-16 gap-1">
                        <BookOpen className="h-5 w-5" />
                        <span className="text-xs">Take Notes</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-col h-16 gap-1">
                        <Camera className="h-5 w-5" />
                        <span className="text-xs">Share Story</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>All Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingEvents.map((event) => (
                        <div key={event.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{event.title}</h3>
                              <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {event.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {event.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Bookmark className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Share2 className="h-4 w-4" />
                              </Button>
                              {event.registered ? (
                                <Button>View Details</Button>
                              ) : (
                                <Button>Register Now</Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Event Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Calendar widget would go here */}
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Calendar View</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="networking" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>My Network</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {recentConnections.map((connection) => (
                        <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                              {connection.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold">{connection.name}</h3>
                              <p className="text-sm text-muted-foreground">{connection.role}</p>
                              <p className="text-sm text-blue-600">
                                Connected at {connection.lastEvent} • {connection.mutualConnections} mutual connections
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm">View Profile</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Networking Goals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="font-semibold">Monthly Goal</p>
                        <p className="text-2xl font-bold text-blue-600">28/30</p>
                        <p className="text-sm text-muted-foreground">New Connections</p>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Suggested Connections</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">Alumni from your university</span>
                            <Button size="sm" variant="ghost">Connect</Button>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">People in similar roles</span>
                            <Button size="sm" variant="ghost">Explore</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="learning" className="mt-6">
            <div className="space-y-6">
              <GoogleWorkspaceDashboard />
              <Card>
                <CardHeader>
                  <CardTitle>Learning Resources & Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <NotationClient />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={achievement.earned ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'opacity-60'}>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">{achievement.icon}</div>
                    <h3 className="font-semibold text-lg mb-2">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>
                    {achievement.earned ? (
                      <div className="space-y-2">
                        <Badge className="bg-yellow-500 hover:bg-yellow-600">Earned</Badge>
                        <p className="text-xs text-muted-foreground">Earned on {achievement.date}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full"
                            style={{ width: `${(achievement.progress / 15) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{achievement.progress}/15 progress</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;