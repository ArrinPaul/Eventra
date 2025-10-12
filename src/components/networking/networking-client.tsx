/**'use client';

 * Networking Client Component

 * Professional networking and matchmaking for eventsimport React, { useState, useEffect } from 'react';

 */import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

'use client';import { Input } from '@/components/ui/input';

import { Badge } from '@/components/ui/badge';

import React from 'react';import { Textarea } from '@/components/ui/textarea';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { Users, MessageSquare, Star, Settings } from 'lucide-react';import { ScrollArea } from '@/components/ui/scroll-area';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NetworkingClient() {import { Progress } from '@/components/ui/progress';

  return (import { 

    <div className="container mx-auto px-4 py-8 max-w-6xl">  UserPlus, 

      <div className="flex items-center justify-between mb-8">  UserCheck, 

        <div>  UserX, 

          <h1 className="text-3xl font-bold">Networking Hub</h1>  MessageCircle, 

          <p className="text-muted-foreground mt-2">  Mail, 

            Connect with attendees, speakers, and professionals at your events  Phone, 

          </p>  Calendar, 

        </div>  MapPin, 

        <Badge variant="secondary">Beta</Badge>  Building, 

      </div>  Briefcase,

  GraduationCap,

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">  Award,

        {/* Main Content */}  Star,

        <div className="lg:col-span-2 space-y-6">  Globe,

          <Card>  Linkedin,

            <CardHeader>  Twitter,

              <div className="flex items-center space-x-2">  Github,

                <Users className="w-5 h-5 text-blue-500" />  Search,

                <CardTitle className="text-lg">Smart Matchmaking</CardTitle>  Filter,

              </div>  Edit,

              <CardDescription>  Settings,

                AI-powered connections based on interests and goals  Eye,

              </CardDescription>  Heart,

            </CardHeader>  Share2,

            <CardContent>  MoreHorizontal,

              <p className="text-sm text-muted-foreground mb-4">  CheckCircle,

                Discover and connect with like-minded professionals using our intelligent matchmaking system.  Clock,

              </p>  X,

              <Button variant="outline" className="w-full" disabled>  Users,

                Find Connections  Zap,

              </Button>  Target,

            </CardContent>  Network,

          </Card>  TrendingUp,

  BookmarkIcon

          <Card>} from 'lucide-react';

            <CardHeader>import { useAuth } from '@/hooks/use-auth';

              <div className="flex items-center space-x-2">import { ConnectionRequest, MatchProfile, User, NetworkingEvent } from '@/types';

                <MessageSquare className="w-5 h-5 text-green-500" />

                <CardTitle className="text-lg">Networking Chat</CardTitle>// Mock data

              </div>const mockUsers: User[] = [

              <CardDescription>  { 

                Start conversations with other attendees    id: '1', 

              </CardDescription>    name: 'Sarah Johnson', 

            </CardHeader>    email: 'sarah@techstartup.com', 

            <CardContent>    avatar: '', 

              <p className="text-sm text-muted-foreground mb-4">    isOnline: true, 

                Engage in meaningful conversations with event participants and build lasting professional relationships.    lastSeen: new Date(),

              </p>    bio: 'AI/ML Engineer at TechCorp. Passionate about building scalable AI systems.',

              <Button variant="outline" className="w-full" disabled>    company: 'TechCorp',

                Start Chatting    jobTitle: 'Senior AI Engineer',

              </Button>    location: 'San Francisco, CA',

            </CardContent>    skills: ['Machine Learning', 'Python', 'TensorFlow', 'AWS'],

          </Card>    interests: ['AI Ethics', 'Startups', 'Mentoring']

  },

          <Card>  { 

            <CardHeader>    id: '2', 

              <div className="flex items-center space-x-2">    name: 'Mike Chen', 

                <Star className="w-5 h-5 text-yellow-500" />    email: 'mike@innovate.co', 

                <CardTitle className="text-lg">Professional Profiles</CardTitle>    avatar: '', 

              </div>    isOnline: false, 

              <CardDescription>    lastSeen: new Date(Date.now() - 1000 * 60 * 30),

                Showcase your expertise and interests    bio: 'Product Manager with 8 years experience in fintech and SaaS.',

              </CardDescription>    company: 'InnovateCorp',

            </CardHeader>    jobTitle: 'Senior Product Manager',

            <CardContent>    location: 'New York, NY',

              <p className="text-sm text-muted-foreground mb-4">    skills: ['Product Strategy', 'Agile', 'Data Analysis', 'UX Research'],

                Create a compelling profile to attract the right connections and opportunities.    interests: ['Product Design', 'Fintech', 'Leadership']

              </p>  },

              <Button variant="outline" className="w-full" disabled>  { 

                Edit Profile    id: '3', 

              </Button>    name: 'Emily Davis', 

            </CardContent>    email: 'emily@cloudtech.io', 

          </Card>    avatar: '', 

        </div>    isOnline: true, 

    lastSeen: new Date(),

        {/* Sidebar */}    bio: 'Full-stack developer and tech entrepreneur. Building the future of cloud computing.',

        <div className="space-y-6">    company: 'CloudTech Solutions',

          <Card>    jobTitle: 'Founder & CTO',

            <CardHeader>    location: 'Austin, TX',

              <CardTitle className="text-lg">Networking Stats</CardTitle>    skills: ['React', 'Node.js', 'Cloud Architecture', 'DevOps'],

            </CardHeader>    interests: ['Entrepreneurship', 'Open Source', 'Blockchain']

            <CardContent className="space-y-4">  },

              <div className="flex justify-between items-center">  { 

                <span className="text-sm">Connections</span>    id: '4', 

                <span className="font-semibold">0</span>    name: 'Alex Rivera', 

              </div>    email: 'alex@designstudio.com', 

              <div className="flex justify-between items-center">    avatar: '', 

                <span className="text-sm">Messages</span>    isOnline: true, 

                <span className="font-semibold">0</span>    lastSeen: new Date(),

              </div>    bio: 'UX Designer focused on creating inclusive and accessible digital experiences.',

              <div className="flex justify-between items-center">    company: 'Design Studio',

                <span className="text-sm">Profile Views</span>    jobTitle: 'Lead UX Designer',

                <span className="font-semibold">0</span>    location: 'Los Angeles, CA',

              </div>    skills: ['UI/UX Design', 'Figma', 'User Research', 'Accessibility'],

            </CardContent>    interests: ['Design Systems', 'Accessibility', 'Creative Technology']

          </Card>  }

];

          <Card>

            <CardHeader>const mockConnectionRequests: ConnectionRequest[] = [

              <div className="flex items-center space-x-2">  {

                <Settings className="w-5 h-5" />    id: '1',

                <CardTitle className="text-lg">Networking Settings</CardTitle>    fromUserId: '2',

              </div>    toUserId: '1',

            </CardHeader>    message: 'Hi Sarah! I saw your talk on AI ethics and would love to connect. I\'m working on similar challenges in fintech.',

            <CardContent>    status: 'pending',

              <p className="text-sm text-muted-foreground mb-4">    createdAt: new Date('2024-10-09T14:30:00'),

                Configure your networking preferences and visibility settings.    eventId: 'event1'

              </p>  },

              <Button variant="outline" size="sm" className="w-full" disabled>  {

                Manage Settings    id: '2',

              </Button>    fromUserId: '3',

            </CardContent>    toUserId: '1',

          </Card>    message: 'Great to meet you at the networking session! Would love to discuss potential collaboration opportunities.',

    status: 'pending',

          <Card>    createdAt: new Date('2024-10-09T16:45:00'),

            <CardHeader>    eventId: 'event1'

              <CardTitle className="text-lg">Suggested Connections</CardTitle>  }

            </CardHeader>];

            <CardContent>

              <p className="text-sm text-muted-foreground text-center py-4">const mockMatchProfiles: MatchProfile[] = [

                AI-powered connection suggestions will appear here based on your interests and event participation.  {

              </p>    id: '1',

            </CardContent>    userId: '2',

          </Card>    careerGoals: ['Lead a product team', 'Launch a SaaS product', 'Transition to AI/ML'],

        </div>    interests: ['Product Management', 'AI/ML', 'Fintech', 'Leadership'],

      </div>    skills: ['Product Strategy', 'Data Analysis', 'Team Leadership', 'Market Research'],

    </div>    lookingFor: ['AI/ML experts', 'Startup founders', 'Senior engineers'],

  );    availability: 'flexible',

}    preferredMeetingTypes: ['coffee', 'virtual', 'group'],
    matchScore: 92
  },
  {
    id: '2',
    userId: '3',
    careerGoals: ['Scale my startup', 'Raise Series A', 'Build a great team'],
    interests: ['Entrepreneurship', 'Cloud Computing', 'Developer Tools'],
    skills: ['Full-stack Development', 'Cloud Architecture', 'Team Building'],
    lookingFor: ['Investors', 'Technical co-founders', 'Product managers'],
    availability: 'flexible',
    preferredMeetingTypes: ['coffee', 'lunch', 'virtual'],
    matchScore: 87
  }
];

export default function NetworkingClient() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>(mockConnectionRequests);
  const [matches, setMatches] = useState<MatchProfile[]>(mockMatchProfiles);
  const [selectedTab, setSelectedTab] = useState<'discover' | 'connections' | 'requests' | 'matches'>('discover');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showProfile, setShowProfile] = useState<string | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const getUser = (userId: string) => users.find(u => u.id === userId);

  const handleSendConnectionRequest = async (toUserId: string) => {
    if (!user || !connectionMessage.trim()) return;

    setLoading(true);
    try {
      const request: ConnectionRequest = {
        id: Date.now().toString(),
        fromUserId: user.id,
        toUserId,
        message: connectionMessage.trim(),
        status: 'pending',
        createdAt: new Date(),
        eventId: undefined
      };

      setConnectionRequests(prev => [request, ...prev]);
      setShowConnectionDialog(null);
      setConnectionMessage('');
    } catch (error) {
      console.error('Error sending connection request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
    setConnectionRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status } : req
      )
    );
  };

  const filteredUsers = users.filter(u => {
    if (u.id === user?.id) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(searchLower) ||
        u.bio?.toLowerCase().includes(searchLower) ||
        u.company?.toLowerCase().includes(searchLower) ||
        u.jobTitle?.toLowerCase().includes(searchLower) ||
        u.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
        u.interests?.some(interest => interest.toLowerCase().includes(searchLower))
      );
    }

    if (selectedFilters.length > 0) {
      return selectedFilters.some(filter => 
        u.skills?.includes(filter) || u.interests?.includes(filter)
      );
    }

    return true;
  });

  const pendingRequests = connectionRequests.filter(req => 
    req.toUserId === user?.id && req.status === 'pending'
  );

  const sentRequests = connectionRequests.filter(req => 
    req.fromUserId === user?.id
  );

  const allSkillsAndInterests = Array.from(new Set([
    ...users.flatMap(u => u.skills || []),
    ...users.flatMap(u => u.interests || [])
  ]));

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Professional Network</h1>
            <p className="text-gray-600">Discover and connect with industry professionals</p>
          </div>
          <Button onClick={() => setShowProfile(user?.id || '')}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">247</p>
                  <p className="text-sm text-gray-600">Connections</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{matches.length}</p>
                  <p className="text-sm text-gray-600">AI Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-gray-600">Events Attended</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">85%</p>
                  <p className="text-sm text-gray-600">Profile Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discover">Discover People</TabsTrigger>
            <TabsTrigger value="matches">
              AI Matches 
              {matches.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {matches.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="connections">My Network</TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="mt-6">
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, skills, company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select 
                  value={selectedFilters[0] || ''} 
                  onValueChange={(value) => setSelectedFilters(value ? [value] : [])}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by skill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Skills</SelectItem>
                    {allSkillsAndInterests.slice(0, 20).map(skill => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* People Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((person) => (
                  <Card key={person.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                            {person.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{person.name}</h3>
                          <p className="text-sm text-gray-600 mb-1">{person.jobTitle}</p>
                          <p className="text-sm text-gray-500">{person.company}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{person.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {person.isOnline ? (
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                          ) : (
                            <div className="w-3 h-3 bg-gray-300 rounded-full" />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">{person.bio}</p>
                      
                      {/* Skills */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">Top Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {person.skills?.slice(0, 3).map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {(person.skills?.length || 0) > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(person.skills?.length || 0) - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          onClick={() => setShowConnectionDialog(person.id)}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowProfile(person.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* AI Matches Tab */}
          <TabsContent value="matches" className="mt-6">
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">AI-Powered Networking Matches</h2>
                <p className="text-gray-600">Based on your goals, interests, and networking preferences</p>
              </div>

              <div className="grid gap-6">
                {matches.map((match) => {
                  const matchedUser = getUser(match.userId);
                  if (!matchedUser) return null;

                  return (
                    <Card key={match.id} className="border-2 border-blue-200 bg-blue-50/30">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <Avatar className="w-16 h-16">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                              {matchedUser.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{matchedUser.name}</h3>
                              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                {match.matchScore}% Match
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{matchedUser.jobTitle}</p>
                            <p className="text-sm text-gray-500">{matchedUser.company}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{match.matchScore}%</div>
                            <div className="text-xs text-gray-500">Compatibility</div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium mb-2">Career Goals</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {match.careerGoals.slice(0, 3).map((goal, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <Target className="w-3 h-3 text-blue-500" />
                                  {goal}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Looking For</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {match.lookingFor.slice(0, 3).map((item, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <Search className="w-3 h-3 text-green-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              {match.preferredMeetingTypes.map(type => (
                                <Badge key={type} variant="outline" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => setShowConnectionDialog(matchedUser.id)}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Connect
                              </Button>
                              <Button variant="outline">
                                <Calendar className="w-4 h-4 mr-2" />
                                Schedule Meeting
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="mt-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
                <div className="space-y-4">
                  {pendingRequests.map((request) => {
                    const requester = getUser(request.fromUserId);
                    if (!requester) return null;

                    return (
                      <Card key={request.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-blue-100 text-blue-700">
                                {requester.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{requester.name}</h4>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">{requester.jobTitle}</span>
                              </div>
                              <p className="text-sm text-gray-700 mb-3">{request.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(request.createdAt).toLocaleDateString()} • 
                                {request.eventId && ' Met at event'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleConnectionResponse(request.id, 'accepted')}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleConnectionResponse(request.id, 'rejected')}
                              >
                                <UserX className="w-4 h-4 mr-1" />
                                Decline
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {pendingRequests.length === 0 && (
                    <div className="text-center py-12">
                      <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                      <p className="text-gray-600">New connection requests will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Sent Requests</h2>
                <div className="space-y-4">
                  {sentRequests.map((request) => {
                    const recipient = getUser(request.toUserId);
                    if (!recipient) return null;

                    return (
                      <Card key={request.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-gray-100 text-gray-700">
                                {recipient.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{recipient.name}</h4>
                                <Badge 
                                  variant={request.status === 'pending' ? 'secondary' : 
                                          request.status === 'accepted' ? 'default' : 'destructive'}
                                >
                                  {request.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{request.message}</p>
                              <p className="text-xs text-gray-500">
                                Sent {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="mt-6">
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your Network</h3>
              <p className="text-gray-600">Your accepted connections will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Connection Request Dialog */}
      <Dialog open={!!showConnectionDialog} onOpenChange={() => setShowConnectionDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Connection Request</DialogTitle>
            <DialogDescription>
              {showConnectionDialog && `Send a connection request to ${getUser(showConnectionDialog)?.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Hi! I'd love to connect. I'm interested in..."
              value={connectionMessage}
              onChange={(e) => setConnectionMessage(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              Tip: Mention shared interests or how you can help each other
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectionDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => showConnectionDialog && handleSendConnectionRequest(showConnectionDialog)}
              disabled={loading || !connectionMessage.trim()}
            >
              {loading ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
    myEvents: ['event-1', 'event-2'],
    interests: 'Startups, Entrepreneurship, Fintech',
    points: 95,
    skills: ['JavaScript', 'React', 'Node.js', 'Entrepreneurship', 'Business Development'],
    achievements: ['Hackathon Winner 2024', 'Startup Pitch Competition Finalist'],
    badges: [],
    connections: ['profile-1'],
    connectionRequests: [],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/bob-smith-dev',
      github: 'https://github.com/bob-smith'
    },
    bio: 'Computer Science student at Stanford University. Building the next generation of fintech solutions. Looking for co-founders and mentors.',
    location: 'Palo Alto, CA',
    isLookingForMentor: true,
    isLookingForCofounder: true,
    isLookingForTeammate: true,
    mentorshipAreas: [],
    compatibility: {
      personalityType: 'ENFP',
      workStyle: 'Independent',
      goals: ['Launch a startup', 'Learn from experts', 'Build network']
    }
  } as UserProfile,
  {
    id: 'profile-3',
    name: 'Dr. Sarah Chen',
    email: 'sarah@example.com',
    mobile: '+1-555-0345',
    role: 'professional',
    foodChoice: 'veg',
    emergencyContact: { name: 'Michael Chen', number: '+1-555-0346' },
    registrationId: 'PRO-GHI789',
    checkedIn: true,
    myEvents: ['keynote-1'],
    interests: 'AI Ethics, Research, Academia',
    points: 250,
    skills: ['AI Research', 'Ethics', 'Academic Writing', 'Public Policy', 'Consulting'],
    achievements: ['PhD in AI Ethics', 'IEEE Fellow', 'Author of 50+ Publications', 'UN AI Advisory Board'],
    badges: [],
    connections: ['profile-1', 'profile-4'],
    connectionRequests: [],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/dr-sarah-chen',
      twitter: 'https://twitter.com/sarahchen_ai'
    },
    bio: 'Leading researcher in AI Ethics at MIT. Advisor to governments and organizations on responsible AI development. Keynote speaker and author.',
    location: 'Boston, MA',
    isLookingForMentor: false,
    isLookingForCofounder: false,
    isLookingForTeammate: false,
    mentorshipAreas: ['AI Ethics', 'Research Methods', 'Academic Career', 'Policy Development'],
    compatibility: {
      personalityType: 'INTJ',
      workStyle: 'Research-focused',
      goals: ['Advance AI ethics', 'Mentor researchers', 'Influence policy']
    }
  } as UserProfile,
];

const mockConnectionRequests: ConnectionRequest[] = [
  {
    id: 'req-1',
    fromUserId: 'profile-4',
    toUserId: 'profile-1',
    message: 'Hi Alice! I saw your talk on AI ethics and would love to connect. I\'m working on similar research.',
    status: 'pending',
    createdAt: new Date('2024-10-09T15:30:00')
  }
];

export default function NetworkingClient() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>(mockUserProfiles);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>(mockConnectionRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      // In a real implementation, this would fetch from Firestore
      // For now, using mock data
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleSendConnectionRequest = async (toUserId: string) => {
    if (!user) return;

    try {
      await userProfileService.sendConnectionRequest(user.id, toUserId, connectionMessage);
      setIsConnectDialogOpen(false);
      setConnectionMessage('');
      // Show success message or update UI
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const handleEndorseSkill = (profileId: string, skill: string) => {
    // Implementation for skill endorsement
    console.log(`Endorsing ${skill} for ${profileId}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredProfiles = profiles.filter(profile => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      profile.name.toLowerCase().includes(query) ||
      profile.bio?.toLowerCase().includes(query) ||
      profile.skills.some(skill => skill.toLowerCase().includes(query)) ||
      profile.location?.toLowerCase().includes(query) ||
      profile.mentorshipAreas?.some(area => area.toLowerCase().includes(query))
    );
  });

  const suggestedConnections = profiles.filter(profile => {
    if (!user) return false;
    // Filter out current user and existing connections
    return profile.id !== user.id && !profile.connections.includes(user.id);
  });

  const myConnections = profiles.filter(profile => {
    const currentUserProfile = profiles.find(p => p.id === user?.id);
    return currentUserProfile?.connections.includes(profile.id);
  });

  const renderProfileCard = (profile: UserProfile, showActions = true) => (
    <Card key={profile.id} className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold">{profile.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {profile.location}
                </p>
              </div>
              
              {showActions && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedProfile(profile);
                    setIsConnectDialogOpen(true);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              )}
            </div>
            
            <p className="text-sm mb-3 line-clamp-2">{profile.bio}</p>
            
            {/* Skills */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 5).map(skill => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {profile.skills.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{profile.skills.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Looking For Indicators */}
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.isLookingForMentor && (
                <Badge variant="outline" className="text-xs">Looking for Mentor</Badge>
              )}
              {profile.isLookingForCofounder && (
                <Badge variant="outline" className="text-xs">Looking for Co-founder</Badge>
              )}
              {profile.isLookingForTeammate && (
                <Badge variant="outline" className="text-xs">Looking for Teammates</Badge>
              )}
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {profile.socialLinks?.linkedin && (
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <Link2 className="h-4 w-4" />
                </Button>
              )}
              {profile.socialLinks?.github && (
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto"
                onClick={() => {
                  setSelectedProfile(profile);
                  setIsProfileDialogOpen(true);
                }}
              >
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Professional Networking</h1>
        <p className="text-muted-foreground">Connect with like-minded professionals, find mentors, and build your network</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search and Tabs */}
          <div className="mb-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, skills, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="discover">Discover</TabsTrigger>
                <TabsTrigger value="connections">My Network</TabsTrigger>
                <TabsTrigger value="requests">Requests</TabsTrigger>
              </TabsList>

              <TabsContent value="discover" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 gap-4">
                  {filteredProfiles.map(profile => renderProfileCard(profile))}
                </div>
              </TabsContent>

              <TabsContent value="connections" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 gap-4">
                  {myConnections.length > 0 ? (
                    myConnections.map(profile => renderProfileCard(profile, false))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      You haven't connected with anyone yet. Start discovering professionals!
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="requests" className="space-y-4 mt-6">
                {connectionRequests.length > 0 ? (
                  <div className="space-y-4">
                    {connectionRequests.map(request => {
                      const requester = profiles.find(p => p.id === request.fromUserId);
                      return (
                        <Card key={request.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <Avatar>
                                <AvatarFallback>
                                  {getInitials(requester?.name || "U")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-medium">{requester?.name}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {request.message}
                                </p>
                                <div className="flex gap-2">
                                  <Button size="sm">Accept</Button>
                                  <Button size="sm" variant="outline">Decline</Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending connection requests
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Suggested Connections */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                People You May Know
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-3">
                  {suggestedConnections.slice(0, 5).map(profile => (
                    <div key={profile.id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(profile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{profile.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {profile.skills.slice(0, 2).join(', ')}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Networking Tips */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">Networking Tips</h3>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>💡 Complete your profile to get better connection suggestions</p>
              <p>🤝 Send personalized connection messages</p>
              <p>⭐ Endorse skills of your connections</p>
              <p>📝 Share updates about your work and achievements</p>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">Your Network</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Connections</span>
                <span className="font-medium">{myConnections.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Endorsements</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Profile Views</span>
                <span className="font-medium">89</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Profile Detail Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedProfile && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProfile.name}'s Profile</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-start gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl">
                      {getInitials(selectedProfile.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{selectedProfile.name}</h2>
                    <p className="text-muted-foreground mb-3">{selectedProfile.bio}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedProfile.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {selectedProfile.connections.length} connections
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                      <Button variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Skills Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Skills & Expertise</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedProfile.skills.map(skill => (
                      <div key={skill} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{skill}</span>
                        <Button variant="outline" size="sm" onClick={() => handleEndorseSkill(selectedProfile.id, skill)}>
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Endorse
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievements */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Achievements</h3>
                  <div className="space-y-2">
                    {selectedProfile.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span>{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mentorship */}
                {selectedProfile.mentorshipAreas && selectedProfile.mentorshipAreas.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Mentorship Areas</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.mentorshipAreas.map(area => (
                        <Badge key={area} variant="secondary">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Connection Request Dialog */}
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Connection Request</DialogTitle>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {getInitials(selectedProfile.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedProfile.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProfile.location}</p>
                </div>
              </div>
              
              <Textarea
                placeholder="Add a personal note (optional)"
                value={connectionMessage}
                onChange={(e) => setConnectionMessage(e.target.value)}
                rows={3}
              />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleSendConnectionRequest(selectedProfile.id)}>
                  Send Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}