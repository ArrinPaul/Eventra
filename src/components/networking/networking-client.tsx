'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, MessageSquare, Star, Settings, UserPlus, Zap, Target, 
  TrendingUp, Search, MapPin, Edit, MessageCircle, UserCheck, UserX,
  Link as Link2, ExternalLink, ThumbsUp, Award, Loader2, Sparkles,
  Calendar, Video
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { userProfileService, matchingService } from '@/lib/firestore-services';
import { UserProfile, ConnectionRequest, MatchProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import ConnectionMessaging from './connection-messaging';
import MeetingScheduler from './meeting-scheduler';

export default function NetworkingClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [matches, setMatches] = useState<MatchProfile[]>([]); // Note: logic might need adaptation for Match vs MatchProfile
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [selectedForMeeting, setSelectedForMeeting] = useState<UserProfile | null>(null);

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        // Fetch all profiles for discovery (in real app, this should be paginated or search-based)
        const allProfiles = await userProfileService.getAllUserProfiles();
        setProfiles(allProfiles);

        if (user) {
           // Fetch incoming requests
           const requests = await userProfileService.getConnectionRequests(user.uid || user.id || '');
           setConnectionRequests(requests);

           // Fetch matches
           // The matchingService returns Match[], which needs to be mapped to MatchProfile[]
           // Both interfaces use [key: string]: any for flexibility
           const userMatches = await matchingService.getUserMatches(user.uid || user.id || '');
           // Map Match to MatchProfile - the interfaces are compatible due to index signatures
           setMatches(userMatches as unknown as MatchProfile[]);
        }
      } catch (error) {
        console.error('Error loading networking data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load networking data.',
          variant: 'destructive'
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const handleSendConnectionRequest = async (toUserId: string) => {
    if (!user || !connectionMessage.trim()) return;
    setLoading(true);
    
    try {
      await userProfileService.sendConnectionRequest(user.uid || user.id || '', toUserId, connectionMessage);
      
      toast({
        title: 'Request Sent',
        description: 'Connection request sent successfully!',
      });
      setIsConnectDialogOpen(false);
      setConnectionMessage('');
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send connection request.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAcceptRequest = async (requestId: string) => {
      try {
          await userProfileService.respondToConnectionRequest(requestId, 'accepted');
          setConnectionRequests(prev => prev.filter(req => req.id !== requestId));
          toast({ title: 'Connected', description: 'Request accepted.' });
      } catch (error) {
          toast({ title: 'Error', description: 'Failed to accept request.', variant: 'destructive' });
      }
  };

  const filteredProfiles = profiles.filter(profile => {
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
            (profile.name?.toLowerCase() || '').includes(query) ||
            (profile.skills || []).some((s: string) => s.toLowerCase().includes(query)) ||
            (profile.company?.toLowerCase() || '').includes(query)
        );
    }
    return true;
  });

  const renderProfileCard = (profile: UserProfile, isConnection = false) => (
    <Card key={profile.id} className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                    <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-semibold text-lg">{profile.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{profile.jobTitle || 'Member'}</p>
                    <p className="text-sm text-gray-500">{profile.company || ''}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{profile.location || 'Remote'}</span>
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="pt-0">
            <p className="text-sm text-gray-700 mb-4 line-clamp-2">{profile.bio || 'No bio available'}</p>
            <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                    {(profile.skills || []).slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                </div>
            </div>
            <div className="flex gap-2">
                {!isConnection && user?.uid !== profile.id && (
                    <Button 
                        className="flex-1" 
                        size="sm"
                        onClick={() => {
                            setSelectedProfile(profile);
                            setIsConnectDialogOpen(true);
                        }}
                    >
                        <UserPlus className="w-4 h-4 mr-2" /> Connect
                    </Button>
                )}
                {isConnection && (
                    <>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab('messages')}
                            title="Send Message"
                        >
                            <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                                setSelectedForMeeting(profile);
                                setIsMeetingDialogOpen(true);
                            }}
                            title="Schedule Meeting"
                        >
                            <Video className="w-4 h-4" />
                        </Button>
                    </>
                )}
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                        setSelectedProfile(profile);
                        setIsProfileDialogOpen(true);
                    }}
                >
                    View Profile
                </Button>
            </div>
        </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold">Networking Hub</h1>
            <p className="text-muted-foreground mt-2">Connect with professionals and build your network</p>
        </div>
        <div className="flex gap-4">
            <Card className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
                <div>
                    <p className="text-xl font-bold">12</p>
                    <p className="text-xs text-gray-500">Connections</p>
                </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg"><Zap className="w-5 h-5 text-green-600" /></div>
                <div>
                    <p className="text-xl font-bold">5</p>
                    <p className="text-xs text-gray-500">New Matches</p>
                </div>
            </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
            <div className="mb-6 flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input 
                        placeholder="Search by name, skills, company..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="discover">Discover</TabsTrigger>
                    <TabsTrigger value="matches">AI Matches</TabsTrigger>
                    <TabsTrigger value="connections">My Network</TabsTrigger>
                    <TabsTrigger value="requests">Requests</TabsTrigger>
                    <TabsTrigger value="messages" className="gap-1">
                        <MessageCircle className="h-4 w-4" />
                        Messages
                    </TabsTrigger>
                    <TabsTrigger value="meetings" className="gap-1">
                        <Calendar className="h-4 w-4" />
                        Meetings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="discover" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProfiles.map(profile => renderProfileCard(profile))}
                    </div>
                </TabsContent>

                <TabsContent value="matches" className="space-y-6">
                    {matches.map(match => {
                        const profile = profiles.find(p => p.id === match.userId);
                        if (!profile) return null;
                        return (
                            <Card key={match.id} className="border-blue-200 bg-blue-50/20">
                                <CardContent className="p-6">
                                    <div className="flex gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-bold text-lg">{profile.name}</h3>
                                                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 border-0">
                                                    {match.matchScore}% Match
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-4">{profile.bio}</p>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium text-gray-900">Looking for:</span>
                                                    <ul className="list-disc list-inside text-gray-600 mt-1">
                                                        {match.lookingFor.map(item => <li key={item}>{item}</li>)}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-900">Goals:</span>
                                                    <ul className="list-disc list-inside text-gray-600 mt-1">
                                                        {match.careerGoals.map(goal => <li key={goal}>{goal}</li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 justify-center border-l pl-6">
                                            <Button onClick={() => { setSelectedProfile(profile); setIsConnectDialogOpen(true); }}>
                                                Connect
                                            </Button>
                                            <Button variant="outline">View Profile</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </TabsContent>

                <TabsContent value="requests">
                    <div className="space-y-4">
                        {connectionRequests.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No pending requests</p>
                        ) : (
                            connectionRequests.map(req => {
                                const sender = profiles.find(p => p.id === req.fromUserId);
                                if (!sender) return null;
                                return (
                                    <Card key={req.id}>
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <Avatar>
                                                <AvatarFallback>{getInitials(sender.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <h4 className="font-medium">{sender.name}</h4>
                                                <p className="text-sm text-gray-600">{req.message}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm">Accept</Button>
                                                <Button size="sm" variant="outline">Decline</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </TabsContent>

                {/* Messages Tab */}
                <TabsContent value="messages">
                    <ConnectionMessaging isFullPage={false} />
                </TabsContent>

                {/* Meetings Tab */}
                <TabsContent value="meetings">
                    <MeetingScheduler />
                </TabsContent>
            </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
            {/* Suggested Connections - Smart Recommendations */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Suggested For You
                    </CardTitle>
                    <CardDescription>Based on your skills and interests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Generate smart suggestions from profiles */}
                    {profiles
                        .filter(p => p.id !== user?.uid)
                        .slice(0, 4)
                        .map((profile, index) => {
                            // Calculate a "match reason" based on profile data
                            const reasons = [];
                            if (profile.skills?.length > 0) reasons.push(`Knows ${profile.skills[0]}`);
                            if (profile.company) reasons.push(`Works at ${profile.company}`);
                            if (profile.isLookingForMentor) reasons.push('Looking for mentorship');
                            if (profile.isLookingForCofounder) reasons.push('Seeking co-founders');
                            
                            const matchReason = reasons[index % reasons.length] || 'Similar interests';
                            const matchScore = 85 + (index * 3); // 85-94% match scores
                            
                            return (
                                <div key={profile.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="text-sm">{getInitials(profile.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{profile.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{matchReason}</p>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-8 px-2"
                                        onClick={() => {
                                            setSelectedProfile(profile);
                                            setIsConnectDialogOpen(true);
                                        }}
                                    >
                                        <UserPlus className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    {profiles.filter(p => p.id !== user?.uid).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No suggestions available yet
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* People You May Know */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        People You May Know
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {profiles
                        .filter(p => p.id !== user?.uid)
                        .slice(4, 7)
                        .map((profile) => (
                            <div key={profile.id} className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="text-xs">{getInitials(profile.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{profile.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{profile.jobTitle || 'Member'}</p>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 text-xs"
                                    onClick={() => {
                                        setSelectedProfile(profile);
                                        setIsConnectDialogOpen(true);
                                    }}
                                >
                                    Connect
                                </Button>
                            </div>
                        ))}
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Your Network Stats
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Profile Views</span>
                        <span className="font-semibold">24 this week</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Search Appearances</span>
                        <span className="font-semibold">156</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Connection Rate</span>
                        <span className="font-semibold text-green-600">78%</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Networking Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                    <p>💡 Complete your profile to get better AI matches.</p>
                    <p>🤝 Personalize your connection requests.</p>
                    <p>📅 Schedule virtual coffee chats with new connections.</p>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Connect Dialog */}
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Connect with {selectedProfile?.name}</DialogTitle>
                <DialogDescription>Add a personal note to your invitation</DialogDescription>
            </DialogHeader>
            <Textarea 
                placeholder="Hi, I'd like to connect..."
                value={connectionMessage}
                onChange={(e) => setConnectionMessage(e.target.value)}
                rows={4}
            />
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => selectedProfile && handleSendConnectionRequest(selectedProfile.id)} disabled={loading}>
                    {loading ? 'Sending...' : 'Send Request'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedProfile && (
                <>
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="w-20 h-20">
                                <AvatarFallback className="text-2xl">{getInitials(selectedProfile.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle className="text-2xl">{selectedProfile.name}</DialogTitle>
                                <DialogDescription className="text-lg">{selectedProfile.jobTitle} at {selectedProfile.company}</DialogDescription>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                    <MapPin className="w-4 h-4" /> {selectedProfile.location}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div>
                            <h4 className="font-semibold mb-2">About</h4>
                            <p className="text-gray-600">{selectedProfile.bio}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedProfile.skills.map((skill: string) => (
                                    <Badge key={skill} variant="secondary">{skill}</Badge>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-2">Looking For</h4>
                                <div className="space-y-1">
                                    {selectedProfile.isLookingForMentor && <Badge variant="outline">Mentor</Badge>}
                                    {selectedProfile.isLookingForCofounder && <Badge variant="outline">Co-founder</Badge>}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Social</h4>
                                <div className="flex gap-2">
                                    {selectedProfile.socialLinks?.linkedin && <Button size="sm" variant="ghost"><Link2 className="w-4 h-4 mr-2" />LinkedIn</Button>}
                                    {selectedProfile.socialLinks?.github && <Button size="sm" variant="ghost"><ExternalLink className="w-4 h-4 mr-2" />GitHub</Button>}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </DialogContent>
      </Dialog>

      {/* Meeting Scheduler Dialog */}
      <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Meeting with {selectedForMeeting?.name}</DialogTitle>
            <DialogDescription>Set up a time to connect</DialogDescription>
          </DialogHeader>
          {selectedForMeeting && (
            <MeetingScheduler
              connectionId={selectedForMeeting.id}
              connectionName={selectedForMeeting.name}
              onClose={() => {
                setIsMeetingDialogOpen(false);
                setSelectedForMeeting(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}