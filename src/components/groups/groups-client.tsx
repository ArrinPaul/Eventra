'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  Search, 
  Filter,
  UserPlus,
  UserMinus,
  MessageSquare,
  FileText,
  Video,
  Star,
  BarChart3,
  Settings,
  Link,
  Download,
  Upload,
  Send,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  Globe,
  Lock,
  ChevronRight,
  Repeat,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { groupService } from '@/lib/firestore-services';
import { RecurringGroup, GroupCalendarEvent, GroupDiscussion, GroupResource, GroupSurvey } from '@/types';

export function GroupsClient() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<RecurringGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<RecurringGroup | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Group creation form
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    category: '',
    frequency: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    dayOfWeek: 0,
    dayOfMonth: 1,
    time: '19:00',
    locationType: 'physical' as 'physical' | 'virtual' | 'hybrid',
    address: '',
    virtualUrl: '',
    maxMembers: 20,
    isPrivate: false,
    tags: ''
  });

  const [upcomingEvents, setUpcomingEvents] = useState<GroupCalendarEvent[]>([]);
  const [discussions, setDiscussions] = useState<GroupDiscussion[]>([]);
  const [resources, setResources] = useState<GroupResource[]>([]);

  useEffect(() => {
    loadGroups();
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupData(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const allGroups = await groupService.getGroups(user?.id);
      setGroups(allGroups);
      if (allGroups.length > 0 && !selectedGroup) {
        setSelectedGroup(allGroups[0]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupData = async (groupId: string) => {
    try {
      const [events, groupDiscussions, groupResources] = await Promise.all([
        groupService.getGroupCalendarEvents(groupId),
        groupService.getGroupDiscussions(groupId),
        groupService.getGroupResources(groupId)
      ]);
      
      setUpcomingEvents(events);
      setDiscussions(groupDiscussions);
      setResources(groupResources);
    } catch (error) {
      console.error('Error loading group data:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const newGroup: Omit<RecurringGroup, 'id' | 'createdAt' | 'upcomingMeetings' | 'pastMeetings'> = {
        name: groupForm.name,
        description: groupForm.description,
        category: groupForm.category,
        organizerId: user.id,
        members: [user.id],
        schedule: {
          frequency: groupForm.frequency,
          dayOfWeek: groupForm.frequency === 'weekly' ? groupForm.dayOfWeek : undefined,
          dayOfMonth: groupForm.frequency === 'monthly' ? groupForm.dayOfMonth : undefined,
          time: groupForm.time,
          timezone: 'Asia/Kolkata'
        },
        location: {
          type: groupForm.locationType,
          address: groupForm.locationType !== 'virtual' ? groupForm.address : undefined,
          virtualUrl: groupForm.locationType !== 'physical' ? groupForm.virtualUrl : undefined
        },
        maxMembers: groupForm.maxMembers,
        isPrivate: groupForm.isPrivate,
        tags: groupForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        coverImage: '/api/placeholder/group-cover-default.jpg'
      };

      await groupService.createGroup(newGroup);
      await loadGroups();
      setShowCreateDialog(false);
      
      // Reset form
      setGroupForm({
        name: '',
        description: '',
        category: '',
        frequency: 'weekly',
        dayOfWeek: 0,
        dayOfMonth: 1,
        time: '19:00',
        locationType: 'physical',
        address: '',
        virtualUrl: '',
        maxMembers: 20,
        isPrivate: false,
        tags: ''
      });
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      await groupService.joinGroup(groupId, user.id);
      await loadGroups();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      await groupService.leaveGroup(groupId, user.id);
      await loadGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const isGroupMember = (group: RecurringGroup) => {
    return user && group.members.includes(user.id);
  };

  const isGroupOrganizer = (group: RecurringGroup) => {
    return user && group.organizerId === user.id;
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || group.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const myGroups = groups.filter(group => isGroupMember(group));
  const discoverGroups = groups.filter(group => !isGroupMember(group));

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const getFrequencyText = (group: RecurringGroup) => {
    const { schedule } = group;
    if (schedule.frequency === 'weekly') {
      return `Every ${getDayName(schedule.dayOfWeek || 0)} at ${schedule.time}`;
    } else if (schedule.frequency === 'monthly') {
      return `Monthly on the ${schedule.dayOfMonth}th at ${schedule.time}`;
    } else {
      return `Bi-weekly at ${schedule.time}`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interest Groups</h1>
          <p className="text-gray-600">Join recurring meetups and build lasting connections</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups ({myGroups.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="group-details" disabled={!selectedGroup}>
            {selectedGroup ? selectedGroup.name : 'Group Details'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Health">Health & Wellness</SelectItem>
                <SelectItem value="Arts">Arts & Culture</SelectItem>
                <SelectItem value="Sports">Sports & Fitness</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedGroup(group)}>
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {group.category}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    {group.isPrivate ? (
                      <Lock className="h-4 w-4 text-white" />
                    ) : (
                      <Globe className="h-4 w-4 text-white" />
                    )}
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg line-clamp-1">{group.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {group.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4" />
                      {getFrequencyText(group)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {group.location.type === 'virtual' ? 'Online' : 
                       group.location.type === 'hybrid' ? 'Hybrid' :
                       group.location.address}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {group.members.length} / {group.maxMembers} members
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Capacity</span>
                      <span>{Math.round((group.members.length / group.maxMembers) * 100)}%</span>
                    </div>
                    <Progress value={(group.members.length / group.maxMembers) * 100} className="h-2" />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {group.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {group.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{group.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {isGroupMember(group) ? (
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" disabled>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Joined
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveGroup(group.id);
                        }}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinGroup(group.id);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Join Group
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-groups" className="space-y-6">
          {myGroups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
                <p className="text-gray-600 text-center mb-4">
                  Join interest groups to connect with like-minded people
                </p>
                <Button onClick={() => setActiveTab('discover')}>
                  Discover Groups
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myGroups.map((group) => (
                <Card key={group.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedGroup(group)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {isGroupOrganizer(group) && (
                        <Badge variant="default">Organizer</Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {group.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Next: {group.upcomingMeetings.length > 0 
                          ? group.upcomingMeetings[0].date.toLocaleDateString()
                          : 'No upcoming meetings'
                        }
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {group.members.length} members
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Discuss
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Events
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Your scheduled group meetings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => {
                    const group = groups.find(g => g.id === event.groupId);
                    return (
                      <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex flex-col items-center bg-blue-100 rounded-lg p-3 min-w-[60px]">
                          <div className="text-sm font-medium text-blue-600">
                            {event.startDate.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-xl font-bold text-blue-600">
                            {event.startDate.getDate()}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{group?.name}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {event.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location || group?.location.type}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {event.attendees.filter(a => a.status === 'going').length} going
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            RSVP
                          </Button>
                          {event.meetingLink && (
                            <Button size="sm">
                              <Video className="w-4 h-4 mr-2" />
                              Join
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {upcomingEvents.length === 0 && (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No upcoming events</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {myGroups.length}
                  </div>
                  <div className="text-sm text-gray-600">Groups Joined</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {upcomingEvents.length}
                  </div>
                  <div className="text-sm text-gray-600">Upcoming Events</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {myGroups.filter(g => isGroupOrganizer(g)).length}
                  </div>
                  <div className="text-sm text-gray-600">Groups Organized</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="group-details" className="space-y-6">
          {selectedGroup && (
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedGroup.name}
                        {selectedGroup.isPrivate && <Lock className="h-4 w-4 text-gray-500" />}
                      </CardTitle>
                      <CardDescription>{selectedGroup.description}</CardDescription>
                    </div>
                    {isGroupOrganizer(selectedGroup) && (
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium">Schedule</h4>
                      <p className="text-sm text-gray-600">{getFrequencyText(selectedGroup)}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Location</h4>
                      <p className="text-sm text-gray-600">
                        {selectedGroup.location.type === 'virtual' ? 'Online meetings' :
                         selectedGroup.location.type === 'hybrid' ? 'Hybrid (Online + In-person)' :
                         selectedGroup.location.address}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Recent Discussions</h4>
                    <div className="space-y-3">
                      {discussions.slice(0, 3).map((discussion) => (
                        <div key={discussion.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm">{discussion.title}</h5>
                            {discussion.isPinned && <Star className="h-3 w-3 text-yellow-500" />}
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{discussion.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{discussion.messages.length} messages</span>
                            <span>{discussion.createdAt.toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        View All Discussions
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Shared Resources</h4>
                    <div className="space-y-3">
                      {resources.slice(0, 3).map((resource) => (
                        <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{resource.title}</p>
                              <p className="text-xs text-gray-600">{resource.downloadCount} downloads</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="w-4 h-4 mr-2" />
                        View All Resources
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>{selectedGroup.members.length} / {selectedGroup.maxMembers}</span>
                        <span>{Math.round((selectedGroup.members.length / selectedGroup.maxMembers) * 100)}% full</span>
                      </div>
                      <Progress value={(selectedGroup.members.length / selectedGroup.maxMembers) * 100} />
                      
                      <div className="space-y-2">
                        {selectedGroup.members.slice(0, 5).map((memberId, index) => (
                          <div key={memberId} className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>M{index + 1}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">Member {index + 1}</p>
                              {memberId === selectedGroup.organizerId && (
                                <Badge variant="outline" className="text-xs">Organizer</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        {selectedGroup.members.length > 5 && (
                          <p className="text-xs text-gray-500">+{selectedGroup.members.length - 5} more members</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Next Meeting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedGroup.upcomingMeetings.length > 0 ? (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium">{selectedGroup.upcomingMeetings[0].title}</h4>
                          <p className="text-sm text-gray-600">{selectedGroup.upcomingMeetings[0].description}</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {selectedGroup.upcomingMeetings[0].date.toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {selectedGroup.upcomingMeetings[0].date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <Button className="w-full">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Add to Calendar
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <CalendarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No upcoming meetings</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Interest Group</DialogTitle>
            <DialogDescription>
              Start a new recurring meetup for people with shared interests
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. AI/ML Enthusiasts"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupDescription">Description</Label>
                <Textarea
                  id="groupDescription"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your group's purpose and activities..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={groupForm.category} onValueChange={(value) => setGroupForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Health">Health & Wellness</SelectItem>
                      <SelectItem value="Arts">Arts & Culture</SelectItem>
                      <SelectItem value="Sports">Sports & Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Maximum Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    value={groupForm.maxMembers}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 20 }))}
                    min={5}
                    max={100}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Meeting Schedule</h4>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={groupForm.frequency} onValueChange={(value) => setGroupForm(prev => ({ ...prev, frequency: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {groupForm.frequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <Select value={groupForm.dayOfWeek.toString()} onValueChange={(value) => setGroupForm(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {groupForm.frequency === 'monthly' && (
                  <div className="space-y-2">
                    <Label>Day of Month</Label>
                    <Input
                      type="number"
                      value={groupForm.dayOfMonth}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) || 1 }))}
                      min={1}
                      max={31}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={groupForm.time}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Location</h4>
              
              <div className="space-y-2">
                <Label>Meeting Type</Label>
                <Select value={groupForm.locationType} onValueChange={(value) => setGroupForm(prev => ({ ...prev, locationType: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">In-person</SelectItem>
                    <SelectItem value="virtual">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {groupForm.locationType !== 'virtual' && (
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={groupForm.address}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Meeting location address"
                  />
                </div>
              )}

              {groupForm.locationType !== 'physical' && (
                <div className="space-y-2">
                  <Label htmlFor="virtualUrl">Virtual Meeting Link</Label>
                  <Input
                    id="virtualUrl"
                    value={groupForm.virtualUrl}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, virtualUrl: e.target.value }))}
                    placeholder="e.g. https://meet.google.com/..."
                  />
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={groupForm.tags}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g. AI, Machine Learning, Networking"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={groupForm.isPrivate}
                  onCheckedChange={(checked) => setGroupForm(prev => ({ ...prev, isPrivate: checked }))}
                />
                <Label>Private group (requires approval to join)</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}