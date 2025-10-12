'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  Target, 
  MessageCircle,
  Calendar,
  QrCode,
  FileText,
  Award,
  Building,
  Globe,
  Phone,
  Mail,
  LinkedIn,
  ChevronRight,
  Plus,
  ExternalLink,
  Share2,
  Download,
  Clock,
  MapPin,
  Star,
  BookOpen,
  Network,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Handshake,
  Lightbulb,
  UserCheck,
  Coffee
} from 'lucide-react';
import { GoogleWorkspaceDashboard } from '@/components/workspace';

interface ProfessionalDashboardProps {
  className?: string;
}

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock professional data
  const professionalStats = {
    connectionsThisMonth: 35,
    mentoringSessions: 8,
    businessLeadsGenerated: 12,
    networkingEventsAttended: 6,
    speakingEngagements: 3,
    industryRanking: 15
  };

  const upcomingEvents = [
    {
      id: '1',
      title: 'Industry Leaders Summit 2024',
      date: '2024-01-16',
      time: '9:00 AM',
      location: 'Business Park Convention Center',
      type: 'networking',
      role: 'Attendee',
      expectedContacts: 45,
      priority: 'high'
    },
    {
      id: '2',
      title: 'Digital Transformation Workshop',
      date: '2024-01-20',
      time: '2:00 PM',
      location: 'Tech Innovation Hub',
      type: 'speaking',
      role: 'Keynote Speaker',
      expectedAudience: 200,
      priority: 'high'
    },
    {
      id: '3',
      title: 'Startup Pitch Competition',
      date: '2024-01-25',
      time: '10:00 AM',
      location: 'Entrepreneur Center',
      type: 'mentoring',
      role: 'Judge & Mentor',
      expectedStartups: 15,
      priority: 'medium'
    }
  ];

  const recentConnections = [
    {
      id: '1',
      name: 'Alexandra Rodriguez',
      role: 'VP of Engineering at Tesla',
      company: 'Tesla',
      industry: 'Automotive',
      mutualConnections: 12,
      lastInteraction: '2 days ago',
      connectionValue: 'high',
      businessPotential: 'Partnership'
    },
    {
      id: '2',
      name: 'David Kim',
      role: 'Head of Product at Stripe',
      company: 'Stripe',
      industry: 'FinTech',
      mutualConnections: 8,
      lastInteraction: '1 week ago',
      connectionValue: 'medium',
      businessPotential: 'Client Lead'
    },
    {
      id: '3',
      name: 'Maria Santos',
      role: 'Chief Marketing Officer at Airbnb',
      company: 'Airbnb',
      industry: 'Travel Tech',
      mutualConnections: 15,
      lastInteraction: '3 days ago',
      connectionValue: 'high',
      businessPotential: 'Collaboration'
    }
  ];

  const businessLeads = [
    {
      id: '1',
      company: 'TechCorp Solutions',
      contact: 'Jennifer Walsh',
      value: '$150K',
      probability: 85,
      stage: 'Proposal',
      nextAction: 'Follow-up call',
      dueDate: '2024-01-18'
    },
    {
      id: '2',
      company: 'Global Innovations Ltd',
      contact: 'Robert Chen',
      value: '$75K',
      probability: 60,
      stage: 'Discovery',
      nextAction: 'Send proposal',
      dueDate: '2024-01-22'
    },
    {
      id: '3',
      company: 'StartUp Ventures',
      contact: 'Lisa Anderson',
      value: '$200K',
      probability: 45,
      stage: 'Initial Contact',
      nextAction: 'Schedule demo',
      dueDate: '2024-01-20'
    }
  ];

  const mentoring = {
    activeMentees: 5,
    totalSessions: 32,
    avgRating: 4.8,
    upcomingSessions: [
      {
        name: 'Sarah Mitchell',
        role: 'Junior Developer',
        topic: 'Career Progression Planning',
        date: 'Today, 3:00 PM'
      },
      {
        name: 'James Rodriguez',
        role: 'Product Manager',
        topic: 'Leadership Skills Development',
        date: 'Tomorrow, 11:00 AM'
      }
    ]
  };

  const industryInsights = [
    {
      title: 'AI Market Growth Projections',
      category: 'Market Analysis',
      date: '2024-01-12',
      source: 'McKinsey Report',
      relevance: 'high'
    },
    {
      title: 'Remote Work Policy Changes',
      category: 'HR Trends',
      date: '2024-01-10',
      source: 'Harvard Business Review',
      relevance: 'medium'
    },
    {
      title: 'Cybersecurity Investment Trends',
      category: 'Technology',
      date: '2024-01-08',
      source: 'Gartner Research',
      relevance: 'high'
    }
  ];

  const skillsAndExpertise = [
    { name: 'Strategic Planning', level: 92, endorsements: 28 },
    { name: 'Digital Transformation', level: 88, endorsements: 24 },
    { name: 'Team Leadership', level: 90, endorsements: 32 },
    { name: 'Business Development', level: 85, endorsements: 19 },
    { name: 'Public Speaking', level: 87, endorsements: 21 }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 ${className}`}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent">
              Professional Hub, {user?.name || 'Professional'}! 💼
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Expand your network, grow your business, and share your expertise
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" className="bg-gradient-to-r from-slate-600 to-blue-600">
              <QrCode className="h-4 w-4 mr-2" />
              Digital Business Card
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share Profile
            </Button>
          </div>
        </div>

        {/* Professional Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">New Connections</p>
                  <p className="text-3xl font-bold">{professionalStats.connectionsThisMonth}</p>
                </div>
                <Users className="h-8 w-8 opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Business Leads</p>
                  <p className="text-3xl font-bold">{professionalStats.businessLeadsGenerated}</p>
                </div>
                <Target className="h-8 w-8 opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Mentoring</p>
                  <p className="text-3xl font-bold">{professionalStats.mentoringSessions}</p>
                </div>
                <UserCheck className="h-8 w-8 opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Events</p>
                  <p className="text-3xl font-bold">{professionalStats.networkingEventsAttended}</p>
                </div>
                <Calendar className="h-8 w-8 opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-teal-600 to-teal-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Speaking</p>
                  <p className="text-3xl font-bold">{professionalStats.speakingEngagements}</p>
                </div>
                <Award className="h-8 w-8 opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Industry Rank</p>
                  <p className="text-3xl font-bold">#{professionalStats.industryRanking}</p>
                </div>
                <TrendingUp className="h-8 w-8 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="networking">Network</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="mentoring">Mentoring</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Events and Actions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Upcoming Professional Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Upcoming Professional Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className={`p-4 rounded-lg border ${event.priority === 'high' ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{event.title}</h3>
                              <Badge variant={event.priority === 'high' ? 'default' : 'secondary'}>
                                {event.role}
                              </Badge>
                              {event.priority === 'high' && <Badge className="text-xs">High Priority</Badge>}
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
                            <div className="mt-2 text-sm">
                              <span className="text-blue-600 font-medium">
                                {event.type === 'networking' && `Expected contacts: ${event.expectedContacts}`}
                                {event.type === 'speaking' && `Expected audience: ${event.expectedAudience}`}
                                {event.type === 'mentoring' && `Startups to mentor: ${event.expectedStartups}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              Prep Notes
                            </Button>
                            <Button size="sm">View Details</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule New Event
                    </Button>
                  </CardContent>
                </Card>

                {/* Business Leads Pipeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      Active Business Leads
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {businessLeads.map((lead) => (
                      <div key={lead.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{lead.company}</h4>
                            <p className="text-sm text-muted-foreground">Contact: {lead.contact}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{lead.value}</p>
                            <p className="text-sm text-muted-foreground">{lead.probability}% probability</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{lead.stage}</Badge>
                            <span className="text-sm text-muted-foreground">Next: {lead.nextAction}</span>
                          </div>
                          <span className="text-sm text-orange-600">Due: {lead.dueDate}</span>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Lead
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Network and Skills */}
              <div className="space-y-6">
                {/* High-Value Connections */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="h-5 w-5 text-purple-600" />
                      High-Value Connections
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentConnections.slice(0, 3).map((connection) => (
                      <div key={connection.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-slate-400 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {connection.name.split(' ').map(n => n.charAt(0)).join('')}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{connection.name}</h4>
                            <p className="text-xs text-muted-foreground">{connection.role}</p>
                            <p className="text-xs text-blue-600">{connection.company}</p>
                          </div>
                          <Badge 
                            variant={connection.connectionValue === 'high' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {connection.connectionValue}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{connection.businessPotential}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Coffee className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      View All Connections
                    </Button>
                  </CardContent>
                </Card>

                {/* Skills & Expertise */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-orange-600" />
                      Professional Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {skillsAndExpertise.slice(0, 4).map((skill) => (
                      <div key={skill.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{skill.name}</span>
                          <span className="text-muted-foreground">{skill.level}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div 
                            className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full"
                            style={{ width: `${skill.level}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{skill.endorsements} endorsements</p>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Request Endorsements
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Professional Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="flex-col h-16 gap-1">
                        <QrCode className="h-5 w-5" />
                        <span className="text-xs">Share Card</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-col h-16 gap-1">
                        <Users className="h-5 w-5" />
                        <span className="text-xs">Find Prospects</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-col h-16 gap-1">
                        <Calendar className="h-5 w-5" />
                        <span className="text-xs">Schedule Meeting</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-col h-16 gap-1">
                        <Handshake className="h-5 w-5" />
                        <span className="text-xs">Send Proposal</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="networking" className="mt-6">
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Network</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentConnections.map((connection) => (
                        <div key={connection.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-slate-400 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold">
                                {connection.name.split(' ').map(n => n.charAt(0)).join('')}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{connection.name}</h3>
                                <p className="text-muted-foreground">{connection.role}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {connection.company}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {connection.industry}
                                  </span>
                                  <span>{connection.mutualConnections} mutual connections</span>
                                </div>
                                <p className="text-sm text-blue-600 mt-1">
                                  Business Potential: {connection.businessPotential}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Coffee className="h-4 w-4" />
                              </Button>
                              <Button size="sm">Connect</Button>
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
                    <CardTitle className="text-lg">Network Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Network className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="font-semibold">Network Size</p>
                        <p className="text-2xl font-bold text-blue-600">487</p>
                        <p className="text-sm text-muted-foreground">Active Connections</p>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Industry Breakdown</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Technology</span>
                            <span className="font-medium">35%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Finance</span>
                            <span className="font-medium">25%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Healthcare</span>
                            <span className="font-medium">20%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Other</span>
                            <span className="font-medium">20%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="business" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Business Development Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {businessLeads.map((lead) => (
                        <div key={lead.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{lead.company}</h3>
                              <p className="text-muted-foreground">Primary Contact: {lead.contact}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">{lead.value}</p>
                              <p className="text-sm text-muted-foreground">{lead.probability}% probability</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{lead.stage}</Badge>
                              <span className="text-sm">Next Action: {lead.nextAction}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-orange-600">Due: {lead.dueDate}</span>
                              <Button size="sm">Update</Button>
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
                    <CardTitle className="text-lg">Business Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="font-semibold">Pipeline Value</p>
                        <p className="text-2xl font-bold text-green-600">$425K</p>
                        <p className="text-sm text-muted-foreground">Total Opportunities</p>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold">Stage Breakdown</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>Proposal</span>
                            <span className="font-medium">$150K</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Discovery</span>
                            <span className="font-medium">$75K</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Initial Contact</span>
                            <span className="font-medium">$200K</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mentoring" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Mentoring Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-3xl font-bold text-purple-600">{mentoring.activeMentees}</p>
                        <p className="text-sm text-muted-foreground">Active Mentees</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-600">{mentoring.totalSessions}</p>
                        <p className="text-sm text-muted-foreground">Total Sessions</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-3xl font-bold text-yellow-600">{mentoring.avgRating}</p>
                        <p className="text-sm text-muted-foreground">Avg Rating</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Upcoming Sessions</h4>
                      {mentoring.upcomingSessions.map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h5 className="font-medium">{session.name}</h5>
                            <p className="text-sm text-muted-foreground">{session.role}</p>
                            <p className="text-sm text-blue-600">Topic: {session.topic}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{session.date}</p>
                            <Button size="sm">Join Session</Button>
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
                    <CardTitle className="text-lg">Mentoring Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="font-semibold">Success Stories</p>
                        <p className="text-2xl font-bold text-green-600">12</p>
                        <p className="text-sm text-muted-foreground">Career Advancements</p>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Recent Achievements</h4>
                        <div className="space-y-2 text-sm">
                          <div className="p-2 bg-gray-50 rounded">
                            <p className="font-medium">Sarah M.</p>
                            <p className="text-muted-foreground">Promoted to Senior Developer</p>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <p className="font-medium">James R.</p>
                            <p className="text-muted-foreground">Launched successful startup</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <div className="space-y-6">
              <GoogleWorkspaceDashboard />
              
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      Industry Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {industryInsights.map((insight, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{insight.title}</h4>
                            <Badge variant={insight.relevance === 'high' ? 'default' : 'secondary'}>
                              {insight.relevance}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{insight.category}</span>
                            <span>{insight.date}</span>
                            <span>{insight.source}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Professional Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium">Profile Views</p>
                          <p className="text-2xl font-bold text-blue-600">152</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium">Connection Requests</p>
                          <p className="text-2xl font-bold text-green-600">28</p>
                        </div>
                        <Users className="h-8 w-8 text-green-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div>
                          <p className="font-medium">Speaking Invites</p>
                          <p className="text-2xl font-bold text-purple-600">5</p>
                        </div>
                        <Award className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;