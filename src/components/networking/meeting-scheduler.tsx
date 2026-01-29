'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Video, Phone, MapPin, Users, Plus, Check,
  ChevronLeft, ChevronRight, X, Edit, Trash2, Bell, Link,
  ExternalLink, Copy, CalendarPlus, RefreshCw, Filter, Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// Types
export interface ScheduledMeeting {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'phone' | 'in-person' | 'coffee-chat';
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  timezone: string;
  location?: string;
  meetingLink?: string;
  organizer: MeetingParticipant;
  participants: MeetingParticipant[];
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'pending';
  reminder: number; // minutes before
  notes?: string;
  createdAt: Date;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
}

export interface MeetingParticipant {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  isOrganizer?: boolean;
}

export interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface AvailabilitySlot {
  day: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "09:00"
  endTime: string; // "17:00"
}

interface MeetingSchedulerProps {
  connectionId?: string;
  connectionName?: string;
  onClose?: () => void;
  defaultMeetingType?: 'video' | 'phone' | 'in-person' | 'coffee-chat';
}

// Mock data
const MOCK_MEETINGS: ScheduledMeeting[] = [
  {
    id: 'meet-1',
    title: 'Coffee Chat with Sarah',
    description: 'Discussing product roadmap and collaboration opportunities',
    type: 'video',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 10.5 * 60 * 60 * 1000),
    duration: 30,
    timezone: 'America/New_York',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    organizer: {
      userId: 'current-user',
      name: 'You',
      email: 'you@example.com',
      status: 'accepted',
      isOrganizer: true,
    },
    participants: [
      {
        userId: 'user-1',
        name: 'Sarah Chen',
        email: 'sarah@techcorp.com',
        status: 'accepted',
      },
    ],
    status: 'confirmed',
    reminder: 15,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 'meet-2',
    title: 'Mentorship Session',
    description: 'Weekly mentorship call',
    type: 'video',
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
    duration: 60,
    timezone: 'America/New_York',
    meetingLink: 'https://zoom.us/j/123456789',
    organizer: {
      userId: 'user-4',
      name: 'David Kim',
      email: 'david@innovatetech.com',
      status: 'accepted',
      isOrganizer: true,
    },
    participants: [
      {
        userId: 'current-user',
        name: 'You',
        email: 'you@example.com',
        status: 'accepted',
      },
    ],
    status: 'confirmed',
    reminder: 30,
    isRecurring: true,
    recurringPattern: 'weekly',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'meet-3',
    title: 'Networking Lunch',
    type: 'in-person',
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000),
    duration: 60,
    timezone: 'America/New_York',
    location: 'Blue Bottle Coffee, Downtown',
    organizer: {
      userId: 'current-user',
      name: 'You',
      email: 'you@example.com',
      status: 'accepted',
      isOrganizer: true,
    },
    participants: [
      {
        userId: 'user-3',
        name: 'Emily Watson',
        email: 'emily@designstudio.com',
        status: 'pending',
      },
    ],
    status: 'pending',
    reminder: 60,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

const MEETING_TYPES = [
  { value: 'video', label: 'Video Call', icon: Video, color: 'text-blue-500' },
  { value: 'phone', label: 'Phone Call', icon: Phone, color: 'text-green-500' },
  { value: 'in-person', label: 'In Person', icon: MapPin, color: 'text-orange-500' },
  { value: 'coffee-chat', label: 'Coffee Chat', icon: Users, color: 'text-purple-500' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

const REMINDER_OPTIONS = [
  { value: 0, label: 'No reminder' },
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export default function MeetingScheduler({
  connectionId,
  connectionName,
  onClose,
  defaultMeetingType = 'video',
}: MeetingSchedulerProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>(MOCK_MEETINGS);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showNewMeetingDialog, setShowNewMeetingDialog] = useState(!!connectionId);
  const [selectedMeeting, setSelectedMeeting] = useState<ScheduledMeeting | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'pending'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  // New meeting form state
  const [newMeeting, setNewMeeting] = useState({
    title: connectionName ? `Meeting with ${connectionName}` : '',
    description: '',
    type: defaultMeetingType,
    date: new Date(),
    time: '10:00',
    duration: 30,
    location: '',
    reminder: 15,
    isRecurring: false,
    recurringPattern: 'weekly' as const,
  });

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(m => {
      const meetingDate = new Date(m.startTime);
      return (
        meetingDate.getDate() === date.getDate() &&
        meetingDate.getMonth() === date.getMonth() &&
        meetingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    const now = new Date();
    let filtered = meetings;

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by tab
    switch (activeTab) {
      case 'upcoming':
        return filtered.filter(m => new Date(m.startTime) > now && m.status !== 'cancelled');
      case 'past':
        return filtered.filter(m => new Date(m.startTime) <= now || m.status === 'completed');
      case 'pending':
        return filtered.filter(m => m.status === 'pending');
      default:
        return filtered;
    }
  }, [meetings, activeTab, searchQuery]);

  // Handlers
  const handleCreateMeeting = useCallback(() => {
    const [hours, minutes] = newMeeting.time.split(':').map(Number);
    const startTime = new Date(newMeeting.date);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + newMeeting.duration);

    const meeting: ScheduledMeeting = {
      id: `meet-${Date.now()}`,
      title: newMeeting.title,
      description: newMeeting.description,
      type: newMeeting.type as ScheduledMeeting['type'],
      startTime,
      endTime,
      duration: newMeeting.duration,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: newMeeting.location || undefined,
      meetingLink: newMeeting.type === 'video' ? 'https://meet.google.com/new-meeting' : undefined,
      organizer: {
        userId: 'current-user',
        name: 'You',
        email: user?.email || 'you@example.com',
        status: 'accepted',
        isOrganizer: true,
      },
      participants: connectionId ? [{
        userId: connectionId,
        name: connectionName || 'Connection',
        email: 'connection@example.com',
        status: 'pending',
      }] : [],
      status: 'pending',
      reminder: newMeeting.reminder,
      isRecurring: newMeeting.isRecurring,
      recurringPattern: newMeeting.isRecurring ? newMeeting.recurringPattern : undefined,
      createdAt: new Date(),
    };

    setMeetings(prev => [...prev, meeting]);
    setShowNewMeetingDialog(false);
    setNewMeeting({
      title: '',
      description: '',
      type: 'video',
      date: new Date(),
      time: '10:00',
      duration: 30,
      location: '',
      reminder: 15,
      isRecurring: false,
      recurringPattern: 'weekly',
    });

    toast({
      title: 'Meeting scheduled',
      description: 'Invitation sent to participants.',
    });
  }, [newMeeting, connectionId, connectionName, user, toast]);

  const handleCancelMeeting = useCallback((meetingId: string) => {
    setMeetings(prev =>
      prev.map(m => m.id === meetingId ? { ...m, status: 'cancelled' } : m)
    );
    setSelectedMeeting(null);
    toast({
      title: 'Meeting cancelled',
      description: 'Participants have been notified.',
    });
  }, [toast]);

  const handleCopyMeetingLink = useCallback((link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied',
      description: 'Meeting link copied to clipboard.',
    });
  }, [toast]);

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase();

  const getMeetingTypeIcon = (type: string) => {
    const meetingType = MEETING_TYPES.find(t => t.value === type);
    return meetingType || MEETING_TYPES[0];
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Meeting Scheduler
            </h2>
            <p className="text-muted-foreground">
              Schedule and manage meetings with your connections
            </p>
          </div>
          <Button onClick={() => setShowNewMeetingDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Schedule Meeting
          </Button>
        </div>

        <div className="grid lg:grid-cols-[350px_1fr] gap-6">
          {/* Calendar */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentMonth).map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="h-10" />;
                  }

                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = day.toDateString() === selectedDate.toDateString();
                  const dayMeetings = getMeetingsForDate(day);
                  const hasMeetings = dayMeetings.length > 0;

                  return (
                    <motion.button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "h-10 rounded-lg flex flex-col items-center justify-center relative transition-colors",
                        isSelected && "bg-primary text-primary-foreground",
                        isToday && !isSelected && "bg-primary/10 text-primary font-medium",
                        !isSelected && !isToday && "hover:bg-muted"
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-sm">{day.getDate()}</span>
                      {hasMeetings && (
                        <div className="absolute bottom-1 flex gap-0.5">
                          {dayMeetings.slice(0, 3).map((_, i) => (
                            <span
                              key={i}
                              className={cn(
                                "w-1 h-1 rounded-full",
                                isSelected ? "bg-primary-foreground" : "bg-primary"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Selected Date Meetings */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">
                  {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getMeetingsForDate(selectedDate).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No meetings scheduled</p>
                  ) : (
                    getMeetingsForDate(selectedDate).map(meeting => {
                      const TypeIcon = getMeetingTypeIcon(meeting.type).icon;
                      return (
                        <button
                          key={meeting.id}
                          onClick={() => setSelectedMeeting(meeting)}
                          className="w-full p-2 rounded-lg hover:bg-muted text-left flex items-center gap-2"
                        >
                          <TypeIcon className={cn("h-4 w-4", getMeetingTypeIcon(meeting.type).color)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{meeting.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <Badge variant={meeting.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                            {meeting.status}
                          </Badge>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meetings List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                  <TabsList>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending
                      {meetings.filter(m => m.status === 'pending').length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                          {meetings.filter(m => m.status === 'pending').length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {filteredMeetings.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No meetings found</p>
                    </div>
                  ) : (
                    filteredMeetings.map(meeting => {
                      const TypeIcon = getMeetingTypeIcon(meeting.type).icon;
                      const isPast = new Date(meeting.startTime) < new Date();

                      return (
                        <motion.div
                          key={meeting.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-4 rounded-lg border transition-colors",
                            meeting.status === 'cancelled' && "opacity-60",
                            selectedMeeting?.id === meeting.id && "border-primary bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center",
                              getMeetingTypeIcon(meeting.type).color.replace('text-', 'bg-').replace('500', '100')
                            )}>
                              <TypeIcon className={cn("h-6 w-6", getMeetingTypeIcon(meeting.type).color)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <h4 className="font-medium">{meeting.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDateTime(new Date(meeting.startTime))} • {meeting.duration} min
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {meeting.isRecurring && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent>Recurring {meeting.recurringPattern}</TooltipContent>
                                    </Tooltip>
                                  )}
                                  <Badge
                                    variant={
                                      meeting.status === 'confirmed' ? 'default' :
                                      meeting.status === 'cancelled' ? 'destructive' :
                                      'secondary'
                                    }
                                  >
                                    {meeting.status}
                                  </Badge>
                                </div>
                              </div>

                              {/* Location/Link */}
                              {meeting.location && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {meeting.location}
                                </div>
                              )}
                              {meeting.meetingLink && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <Link className="h-3 w-3" />
                                    Meeting link available
                                  </Badge>
                                </div>
                              )}

                              {/* Participants */}
                              <div className="flex items-center gap-2 mt-3">
                                <div className="flex -space-x-2">
                                  {[meeting.organizer, ...meeting.participants].slice(0, 4).map((p, i) => (
                                    <Avatar key={i} className="h-7 w-7 border-2 border-background">
                                      <AvatarImage src={p.avatar} />
                                      <AvatarFallback className="text-xs">{getInitials(p.name)}</AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {meeting.participants.length > 3 && (
                                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                      +{meeting.participants.length - 3}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {meeting.participants.length + 1} participants
                                </span>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 mt-3">
                                {meeting.meetingLink && !isPast && meeting.status !== 'cancelled' && (
                                  <Button size="sm" variant="default" className="h-8" asChild>
                                    <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                                      <Video className="h-3 w-3 mr-1" />
                                      Join
                                    </a>
                                  </Button>
                                )}
                                {meeting.meetingLink && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8"
                                    onClick={() => handleCopyMeetingLink(meeting.meetingLink!)}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy Link
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8"
                                  onClick={() => setSelectedMeeting(meeting)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Details
                                </Button>
                                {!isPast && meeting.status !== 'cancelled' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-destructive hover:text-destructive"
                                    onClick={() => handleCancelMeeting(meeting.id)}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* New Meeting Dialog */}
        <Dialog open={showNewMeetingDialog} onOpenChange={setShowNewMeetingDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
              <DialogDescription>
                Set up a meeting with your connection
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label>Meeting Title</Label>
                <Input
                  placeholder="e.g., Coffee Chat, Project Discussion"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Meeting Type</Label>
                <div className="grid grid-cols-4 gap-2">
                  {MEETING_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setNewMeeting(prev => ({ ...prev, type: type.value as 'video' | 'phone' | 'in-person' | 'coffee-chat' }))}
                        className={cn(
                          "p-3 rounded-lg border flex flex-col items-center gap-1 transition-colors",
                          newMeeting.type === type.value
                            ? "border-primary bg-primary/10"
                            : "hover:bg-muted"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", type.color)} />
                        <span className="text-xs">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newMeeting.date.toISOString().split('T')[0]}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, date: new Date(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={newMeeting.duration.toString()}
                  onValueChange={(v) => setNewMeeting(prev => ({ ...prev, duration: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location (for in-person) */}
              {(newMeeting.type === 'in-person' || newMeeting.type === 'coffee-chat') && (
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="e.g., Blue Bottle Coffee, Downtown"
                    value={newMeeting.location}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="What would you like to discuss?"
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Reminder */}
              <div className="space-y-2">
                <Label>Reminder</Label>
                <Select
                  value={newMeeting.reminder.toString()}
                  onValueChange={(v) => setNewMeeting(prev => ({ ...prev, reminder: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recurring */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Recurring Meeting</Label>
                  <p className="text-xs text-muted-foreground">Set up a recurring schedule</p>
                </div>
                <Switch
                  checked={newMeeting.isRecurring}
                  onCheckedChange={(checked) => setNewMeeting(prev => ({ ...prev, isRecurring: checked }))}
                />
              </div>

              {newMeeting.isRecurring && (
                <Select
                  value={newMeeting.recurringPattern}
                  onValueChange={(v: any) => setNewMeeting(prev => ({ ...prev, recurringPattern: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewMeetingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMeeting} disabled={!newMeeting.title}>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Meeting Details Dialog */}
        <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
          <DialogContent>
            {selectedMeeting && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const TypeIcon = getMeetingTypeIcon(selectedMeeting.type).icon;
                      return (
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          getMeetingTypeIcon(selectedMeeting.type).color.replace('text-', 'bg-').replace('500', '100')
                        )}>
                          <TypeIcon className={cn("h-5 w-5", getMeetingTypeIcon(selectedMeeting.type).color)} />
                        </div>
                      );
                    })()}
                    <div>
                      <DialogTitle>{selectedMeeting.title}</DialogTitle>
                      <DialogDescription>
                        {formatDateTime(new Date(selectedMeeting.startTime))}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {selectedMeeting.description && (
                    <p className="text-sm text-muted-foreground">{selectedMeeting.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{selectedMeeting.duration} minutes</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{selectedMeeting.type.replace('-', ' ')}</p>
                    </div>
                  </div>

                  {selectedMeeting.location && (
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedMeeting.location}
                      </p>
                    </div>
                  )}

                  {selectedMeeting.meetingLink && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Meeting Link</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                          {selectedMeeting.meetingLink}
                        </code>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleCopyMeetingLink(selectedMeeting.meetingLink!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Participants</p>
                    <div className="space-y-2">
                      {[selectedMeeting.organizer, ...selectedMeeting.participants].map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{getInitials(p.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {p.name}
                                {p.isOrganizer && <span className="text-muted-foreground"> (Organizer)</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">{p.email}</p>
                            </div>
                          </div>
                          <Badge variant={
                            p.status === 'accepted' ? 'default' :
                            p.status === 'declined' ? 'destructive' :
                            'secondary'
                          }>
                            {p.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  {selectedMeeting.status !== 'cancelled' && new Date(selectedMeeting.startTime) > new Date() && (
                    <Button
                      variant="destructive"
                      onClick={() => handleCancelMeeting(selectedMeeting.id)}
                    >
                      Cancel Meeting
                    </Button>
                  )}
                  {selectedMeeting.meetingLink && new Date(selectedMeeting.startTime) > new Date() && (
                    <Button asChild>
                      <a href={selectedMeeting.meetingLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Join Meeting
                      </a>
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
