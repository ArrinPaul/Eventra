'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Video, Phone, MapPin, Users, Plus, Check,
  ChevronLeft, ChevronRight, X, Edit, Trash2, Bell, Link,
  ExternalLink, Copy, CalendarPlus, RefreshCw, Filter, Search, 
  Loader2, MessageSquare, Coffee, UserPlus, Star, MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  serverTimestamp,
  Timestamp,
  getDocs,
  getDoc
} from 'firebase/firestore';

// Types
interface Meeting {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'phone' | 'in-person' | 'coffee-chat';
  startTime: Date;
  endTime: Date;
  duration: number;
  location?: string;
  meetingLink?: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string;
  participantIds: string[];
  participants: MeetingParticipant[];
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'pending';
  notes?: string;
  createdAt: Date;
  isRecurring?: boolean;
}

interface MeetingParticipant {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
}

interface MeetingStats {
  totalMeetings: number;
  upcomingMeetings: number;
  completedMeetings: number;
  pendingRequests: number;
  totalDurationHours: number;
}

const MEETING_TYPE_CONFIG = {
  video: { icon: Video, label: 'Video Call', color: 'text-blue-500' },
  phone: { icon: Phone, label: 'Phone Call', color: 'text-green-500' },
  'in-person': { icon: MapPin, label: 'In-Person', color: 'text-purple-500' },
  'coffee-chat': { icon: Coffee, label: 'Coffee Chat', color: 'text-orange-500' },
};

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-500' },
  confirmed: { label: 'Confirmed', color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
  completed: { label: 'Completed', color: 'bg-gray-500' },
  pending: { label: 'Pending', color: 'bg-yellow-500' },
};

// Helper function to convert Firestore Timestamp to Date
const toDate = (timestamp: Timestamp | Date | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

export default function MeetingsHubClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [stats, setStats] = useState<MeetingStats>({
    totalMeetings: 0,
    upcomingMeetings: 0,
    completedMeetings: 0,
    pendingRequests: 0,
    totalDurationHours: 0
  });

  // Load meetings from Firestore
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const meetingsRef = collection(db, 'scheduled_meetings');
    const q = query(
      meetingsRef,
      where('participantIds', 'array-contains', user.uid),
      orderBy('startTime', 'asc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const meetingsData: Meeting[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          meetingsData.push({
            id: docSnap.id,
            title: data.title,
            description: data.description,
            type: data.type || 'video',
            startTime: toDate(data.startTime),
            endTime: toDate(data.endTime),
            duration: data.duration || 30,
            location: data.location,
            meetingLink: data.meetingLink,
            organizerId: data.organizerId,
            organizerName: data.organizerName || 'Unknown',
            organizerAvatar: data.organizerAvatar,
            participantIds: data.participantIds || [],
            participants: data.participants || [],
            status: data.status || 'scheduled',
            notes: data.notes,
            createdAt: toDate(data.createdAt),
            isRecurring: data.isRecurring
          });
        });
        
        setMeetings(meetingsData);
        
        // Calculate stats
        const now = new Date();
        const upcoming = meetingsData.filter(m => m.startTime > now && m.status !== 'cancelled');
        const completed = meetingsData.filter(m => m.status === 'completed');
        const pending = meetingsData.filter(m => 
          m.participants.some(p => p.id === user.uid && p.status === 'pending')
        );
        const totalHours = meetingsData.reduce((acc, m) => acc + (m.duration / 60), 0);
        
        setStats({
          totalMeetings: meetingsData.length,
          upcomingMeetings: upcoming.length,
          completedMeetings: completed.length,
          pendingRequests: pending.length,
          totalDurationHours: Math.round(totalHours * 10) / 10
        });
        
        setLoading(false);
      },
      (error) => {
        console.error('Error loading meetings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load meetings',
          variant: 'destructive'
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, toast]);

  // Filter meetings based on tab and search
  const filteredMeetings = useMemo(() => {
    const now = new Date();
    let filtered = [...meetings];
    
    // Tab filter
    switch (activeTab) {
      case 'upcoming':
        filtered = filtered.filter(m => m.startTime > now && m.status !== 'cancelled');
        break;
      case 'past':
        filtered = filtered.filter(m => m.startTime <= now || m.status === 'completed');
        break;
      case 'pending':
        filtered = filtered.filter(m => 
          m.participants.some(p => p.id === user?.uid && p.status === 'pending')
        );
        break;
      case 'cancelled':
        filtered = filtered.filter(m => m.status === 'cancelled');
        break;
    }
    
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.type === filterType);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.organizerName.toLowerCase().includes(query) ||
        m.participants.some(p => p.name.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [meetings, activeTab, filterType, searchQuery, user?.uid]);

  // Accept meeting invitation
  const handleAcceptMeeting = async (meeting: Meeting) => {
    if (!user?.uid) return;
    
    try {
      const meetingRef = doc(db, 'scheduled_meetings', meeting.id);
      const updatedParticipants = meeting.participants.map(p =>
        p.id === user.uid ? { ...p, status: 'accepted' as const } : p
      );
      
      await updateDoc(meetingRef, {
        participants: updatedParticipants,
        status: 'confirmed',
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: 'Meeting Accepted',
        description: `You've accepted the meeting: ${meeting.title}`
      });
    } catch (error) {
      console.error('Error accepting meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept meeting',
        variant: 'destructive'
      });
    }
  };

  // Decline meeting invitation
  const handleDeclineMeeting = async (meeting: Meeting) => {
    if (!user?.uid) return;
    
    try {
      const meetingRef = doc(db, 'scheduled_meetings', meeting.id);
      const updatedParticipants = meeting.participants.map(p =>
        p.id === user.uid ? { ...p, status: 'declined' as const } : p
      );
      
      await updateDoc(meetingRef, {
        participants: updatedParticipants,
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: 'Meeting Declined',
        description: `You've declined the meeting: ${meeting.title}`
      });
    } catch (error) {
      console.error('Error declining meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline meeting',
        variant: 'destructive'
      });
    }
  };

  // Cancel meeting (only organizer)
  const handleCancelMeeting = async (meeting: Meeting) => {
    if (!user?.uid || meeting.organizerId !== user.uid) return;
    
    try {
      const meetingRef = doc(db, 'scheduled_meetings', meeting.id);
      await updateDoc(meetingRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: 'Meeting Cancelled',
        description: `Meeting "${meeting.title}" has been cancelled`
      });
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel meeting',
        variant: 'destructive'
      });
    }
  };

  // Delete meeting (only organizer)
  const handleDeleteMeeting = async (meeting: Meeting) => {
    if (!user?.uid || meeting.organizerId !== user.uid) return;
    
    try {
      await deleteDoc(doc(db, 'scheduled_meetings', meeting.id));
      
      toast({
        title: 'Meeting Deleted',
        description: `Meeting "${meeting.title}" has been deleted`
      });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete meeting',
        variant: 'destructive'
      });
    }
  };

  // Add to Google Calendar
  const handleAddToCalendar = (meeting: Meeting) => {
    const startStr = meeting.startTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endStr = meeting.endTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meeting.title)}&details=${encodeURIComponent(meeting.description || '')}&location=${encodeURIComponent(meeting.location || meeting.meetingLink || '')}&dates=${startStr}/${endStr}`;
    
    window.open(url, '_blank');
  };

  // Copy meeting link
  const handleCopyLink = async (meeting: Meeting) => {
    if (!meeting.meetingLink) return;
    
    try {
      await navigator.clipboard.writeText(meeting.meetingLink);
      toast({
        title: 'Link Copied',
        description: 'Meeting link copied to clipboard'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive'
      });
    }
  };

  // Format time
  const formatMeetingTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatMeetingDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Get relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (diff < 0) return 'Past';
    if (minutes < 60) return `In ${minutes}m`;
    if (hours < 24) return `In ${hours}h`;
    return `In ${days}d`;
  };

  // Render meeting card
  const renderMeetingCard = (meeting: Meeting) => {
    const TypeIcon = MEETING_TYPE_CONFIG[meeting.type]?.icon || Video;
    const typeConfig = MEETING_TYPE_CONFIG[meeting.type];
    const statusConfig = STATUS_CONFIG[meeting.status];
    const isPending = meeting.participants.some(p => p.id === user?.uid && p.status === 'pending');
    const isOrganizer = meeting.organizerId === user?.uid;
    const isUpcoming = meeting.startTime > new Date();
    
    return (
      <motion.div
        key={meeting.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card className={cn(
          "hover:shadow-md transition-shadow cursor-pointer",
          isPending && "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/10"
        )}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className={cn(
                  "p-2 rounded-lg",
                  typeConfig?.color?.replace('text-', 'bg-').replace('500', '100'),
                  "dark:bg-opacity-20"
                )}>
                  <TypeIcon className={cn("h-5 w-5", typeConfig?.color)} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{meeting.title}</h3>
                    <Badge variant="outline" className={cn("text-xs", statusConfig.color.replace('bg-', 'text-'))}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatMeetingDate(meeting.startTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatMeetingTime(meeting.startTime)} - {formatMeetingTime(meeting.endTime)}
                    </span>
                    {isUpcoming && (
                      <Badge variant="secondary" className="text-xs">
                        {getRelativeTime(meeting.startTime)}
                      </Badge>
                    )}
                  </div>
                  
                  {meeting.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {meeting.location}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {meeting.participants.slice(0, 3).map((participant, i) => (
                        <Avatar key={participant.id} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback className="text-xs">
                            {participant.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {meeting.participants.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                          +{meeting.participants.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isPending && (
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptMeeting(meeting);
                      }}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeclineMeeting(meeting);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                )}
                
                {!isPending && meeting.meetingLink && isUpcoming && meeting.status !== 'cancelled' && (
                  <Button 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(meeting.meetingLink, '_blank');
                    }}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedMeeting(meeting);
                      setShowDetailsDialog(true);
                    }}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddToCalendar(meeting)}>
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Add to Calendar
                    </DropdownMenuItem>
                    {meeting.meetingLink && (
                      <DropdownMenuItem onClick={() => handleCopyLink(meeting)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Meeting Link
                      </DropdownMenuItem>
                    )}
                    {isOrganizer && (
                      <>
                        <DropdownMenuSeparator />
                        {meeting.status !== 'cancelled' && (
                          <DropdownMenuItem 
                            onClick={() => handleCancelMeeting(meeting)}
                            className="text-orange-600"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel Meeting
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMeeting(meeting)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Meeting
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="text-center p-8">
        <CardHeader>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>Please sign in to view your meetings</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMeetings}</p>
                <p className="text-xs text-muted-foreground">Total Meetings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.upcomingMeetings}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Check className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedMeetings}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Bell className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDurationHours}h</p>
                <p className="text-xs text-muted-foreground">Total Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {Object.entries(MEETING_TYPE_CONFIG).map(([key, config]) => (
                <Button
                  key={key}
                  variant={filterType === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(filterType === key ? 'all' : key)}
                >
                  <config.icon className="h-4 w-4 mr-1" />
                  {config.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meetings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="upcoming" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Upcoming
            {stats.upcomingMeetings > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {stats.upcomingMeetings}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            Pending
            {stats.pendingRequests > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                {stats.pendingRequests}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past">
            <Check className="h-4 w-4 mr-1" />
            Past
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            <X className="h-4 w-4 mr-1" />
            Cancelled
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <ScrollArea className="h-[calc(100vh-500px)] min-h-[400px]">
            <AnimatePresence mode="popLayout">
              {filteredMeetings.length === 0 ? (
                <Card className="text-center p-8">
                  <CardContent>
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No meetings found</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === 'upcoming' 
                        ? "You don't have any upcoming meetings scheduled"
                        : activeTab === 'pending'
                        ? "You don't have any pending meeting invitations"
                        : "No meetings match your current filters"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredMeetings.map(meeting => renderMeetingCard(meeting))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Meeting Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          {selectedMeeting && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const TypeIcon = MEETING_TYPE_CONFIG[selectedMeeting.type]?.icon || Video;
                    return <TypeIcon className="h-6 w-6 text-primary" />;
                  })()}
                  <div>
                    <DialogTitle>{selectedMeeting.title}</DialogTitle>
                    <DialogDescription>
                      {formatMeetingDate(selectedMeeting.startTime)} at {formatMeetingTime(selectedMeeting.startTime)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedMeeting.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedMeeting.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Duration</h4>
                    <p className="text-sm text-muted-foreground">{selectedMeeting.duration} minutes</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Type</h4>
                    <p className="text-sm text-muted-foreground">
                      {MEETING_TYPE_CONFIG[selectedMeeting.type]?.label}
                    </p>
                  </div>
                </div>
                
                {selectedMeeting.location && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Location</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedMeeting.location}
                    </p>
                  </div>
                )}
                
                {selectedMeeting.meetingLink && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Meeting Link</h4>
                    <a 
                      href={selectedMeeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Link className="h-4 w-4" />
                      Join Meeting
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Participants ({selectedMeeting.participants.length})</h4>
                  <div className="space-y-2">
                    {selectedMeeting.participants.map(participant => (
                      <div key={participant.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={participant.avatar} />
                            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{participant.name}</p>
                            {participant.email && (
                              <p className="text-xs text-muted-foreground">{participant.email}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={
                          participant.status === 'accepted' ? 'default' :
                          participant.status === 'declined' ? 'destructive' :
                          'secondary'
                        }>
                          {participant.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedMeeting.notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Notes</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {selectedMeeting.notes}
                    </p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                {selectedMeeting.meetingLink && selectedMeeting.status !== 'cancelled' && (
                  <Button onClick={() => window.open(selectedMeeting.meetingLink, '_blank')}>
                    <Video className="h-4 w-4 mr-2" />
                    Join Meeting
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
