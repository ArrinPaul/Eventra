'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db, FIRESTORE_COLLECTIONS } from '@/lib/firebase';
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Calendar,
  Users,
  MessageSquare,
  Award,
  Ticket,
  AlertCircle,
  Info,
  Star,
  Heart,
  UserPlus,
  MapPin,
  Clock,
  ChevronRight,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Filter,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

// Notification Types
export type NotificationType = 
  | 'event_reminder'
  | 'event_update'
  | 'registration_confirmed'
  | 'certificate_ready'
  | 'connection_request'
  | 'connection_accepted'
  | 'message_received'
  | 'badge_earned'
  | 'challenge_completed'
  | 'event_starting'
  | 'new_follower'
  | 'post_liked'
  | 'comment_received'
  | 'meeting_scheduled'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    eventId?: string;
    eventName?: string;
    userId?: string;
    userName?: string;
    userAvatar?: string;
    badgeId?: string;
    badgeName?: string;
    certificateId?: string;
  };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: {
    sound: boolean;
    email: boolean;
    push: boolean;
    types: Record<NotificationType, boolean>;
  };
}

// Notification Bell Component (for header)
export function NotificationBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    preferences: {
      sound: true,
      email: true,
      push: false,
      types: {} as Record<NotificationType, boolean>
    }
  });

  useEffect(() => {
    if (user) {
      // Subscribe to real-time notifications from Firestore
      const notificationsRef = collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS);
      const q = query(
        notificationsRef,
        where('userId', '==', user.id),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications: Notification[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type,
            title: data.title,
            message: data.message,
            timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
            read: data.read || false,
            actionUrl: data.actionUrl,
            actionLabel: data.actionLabel,
            metadata: data.metadata,
          };
        });
        
        setState(prev => ({
          ...prev,
          notifications,
          unreadCount: notifications.filter(n => !n.read).length
        }));
      }, (error) => {
        console.error('Error subscribing to notifications:', error);
        // Fall back to empty state on error
        loadFallbackNotifications();
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Fallback notifications for demo/development
  const loadFallbackNotifications = () => {
    // Mock notifications - in production, fetch from Firestore
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'event_starting',
        title: 'Event Starting Soon',
        message: 'Tech Summit 2026 starts in 1 hour',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        actionUrl: '/events/tech-summit-2026',
        actionLabel: 'View Event',
        metadata: { eventId: '1', eventName: 'Tech Summit 2026' }
      },
      {
        id: '2',
        type: 'connection_request',
        title: 'New Connection Request',
        message: 'Sarah Chen wants to connect with you',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        actionUrl: '/networking',
        actionLabel: 'View Request',
        metadata: { userId: 'sarah123', userName: 'Sarah Chen' }
      },
      {
        id: '3',
        type: 'badge_earned',
        title: 'Badge Earned! 🏆',
        message: 'You earned the "Networking Pro" badge',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        read: false,
        actionUrl: '/gamification',
        actionLabel: 'View Badge',
        metadata: { badgeId: 'networking-pro', badgeName: 'Networking Pro' }
      },
      {
        id: '4',
        type: 'certificate_ready',
        title: 'Certificate Ready',
        message: 'Your certificate for Design Workshop is ready',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true,
        actionUrl: '/certificates',
        actionLabel: 'Download',
        metadata: { eventId: '2', eventName: 'Design Workshop', certificateId: 'cert-123' }
      },
      {
        id: '5',
        type: 'event_reminder',
        title: 'Event Reminder',
        message: 'AI/ML Bootcamp is tomorrow at 9:00 AM',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        read: true,
        actionUrl: '/events/ai-ml-bootcamp',
        actionLabel: 'View Details',
        metadata: { eventId: '3', eventName: 'AI/ML Bootcamp' }
      },
      {
        id: '6',
        type: 'message_received',
        title: 'New Message',
        message: 'Alex Kim sent you a message',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        read: false,
        actionUrl: '/networking?tab=messages',
        actionLabel: 'Reply',
        metadata: { userId: 'alex456', userName: 'Alex Kim' }
      },
      {
        id: '7',
        type: 'meeting_scheduled',
        title: 'Meeting Scheduled',
        message: 'Coffee chat with Jordan Lee on Friday',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        read: true,
        actionUrl: '/networking?tab=meetings',
        actionLabel: 'View Meeting',
        metadata: { userId: 'jordan789', userName: 'Jordan Lee' }
      }
    ];

    setState(prev => ({
      ...prev,
      notifications: mockNotifications,
      unreadCount: mockNotifications.filter(n => !n.read).length
    }));
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Update in Firestore
      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS, notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
      
      // Optimistic update
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = state.notifications.filter(n => !n.read);
      
      if (unreadNotifications.length > 0) {
        const batch = writeBatch(db);
        unreadNotifications.forEach(n => {
          batch.update(doc(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS, n.id), {
            read: true,
            readAt: serverTimestamp()
          });
        });
        await batch.commit();
      }
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
      toast({
        title: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark notifications as read'
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS, notificationId));
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== notificationId),
        unreadCount: prev.notifications.find(n => n.id === notificationId && !n.read) 
          ? prev.unreadCount - 1 
          : prev.unreadCount
      }));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    try {
      const batch = writeBatch(db);
      state.notifications.forEach(n => {
        batch.delete(doc(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS, n.id));
      });
      await batch.commit();
      
      setState(prev => ({
        ...prev,
        notifications: [],
        unreadCount: 0
      }));
      toast({
        title: 'All notifications cleared'
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear notifications'
      });
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'event_reminder':
      case 'event_starting':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'event_update':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'registration_confirmed':
        return <Ticket className="w-4 h-4 text-green-500" />;
      case 'certificate_ready':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'connection_request':
      case 'connection_accepted':
        return <UserPlus className="w-4 h-4 text-indigo-500" />;
      case 'message_received':
        return <MessageSquare className="w-4 h-4 text-cyan-500" />;
      case 'badge_earned':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'challenge_completed':
        return <Award className="w-4 h-4 text-orange-500" />;
      case 'new_follower':
        return <Users className="w-4 h-4 text-pink-500" />;
      case 'post_liked':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment_received':
        return <MessageSquare className="w-4 h-4 text-teal-500" />;
      case 'meeting_scheduled':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const recentNotifications = state.notifications.slice(0, 5);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {state.unreadCount > 0 ? (
            <BellRing className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {state.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {state.unreadCount > 9 ? '9+' : state.unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-1">
            {state.unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.location.href = '/notifications'}>
                  <Bell className="w-4 h-4 mr-2" />
                  View All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/preferences?tab=notifications'}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearAll} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BellOff className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence>
                {recentNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {state.notifications.length > 5 && (
          <div className="p-3 border-t">
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => window.location.href = '/notifications'}
            >
              View all {state.notifications.length} notifications
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Full Notifications Page Component
export function NotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAllNotifications();
    }
  }, [user]);

  const loadAllNotifications = async () => {
    setLoading(true);
    
    // Mock data - in production, fetch from Firestore with pagination
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'event_starting',
        title: 'Event Starting Soon',
        message: 'Tech Summit 2026 starts in 1 hour. Don\'t forget to check in!',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        actionUrl: '/events/tech-summit-2026',
        actionLabel: 'View Event',
        metadata: { eventId: '1', eventName: 'Tech Summit 2026' }
      },
      {
        id: '2',
        type: 'connection_request',
        title: 'New Connection Request',
        message: 'Sarah Chen wants to connect with you. You have 3 mutual connections.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        actionUrl: '/networking',
        actionLabel: 'View Request',
        metadata: { userId: 'sarah123', userName: 'Sarah Chen' }
      },
      {
        id: '3',
        type: 'badge_earned',
        title: 'Badge Earned! 🏆',
        message: 'Congratulations! You earned the "Networking Pro" badge for making 10 connections.',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        read: false,
        actionUrl: '/gamification',
        actionLabel: 'View Badge',
        metadata: { badgeId: 'networking-pro', badgeName: 'Networking Pro' }
      },
      {
        id: '4',
        type: 'certificate_ready',
        title: 'Certificate Ready',
        message: 'Your certificate for Design Workshop is ready to download.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true,
        actionUrl: '/certificates',
        actionLabel: 'Download',
        metadata: { eventId: '2', eventName: 'Design Workshop', certificateId: 'cert-123' }
      },
      {
        id: '5',
        type: 'event_reminder',
        title: 'Event Reminder',
        message: 'AI/ML Bootcamp is tomorrow at 9:00 AM in Engineering Hall Room 101.',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        read: true,
        actionUrl: '/events/ai-ml-bootcamp',
        actionLabel: 'View Details',
        metadata: { eventId: '3', eventName: 'AI/ML Bootcamp' }
      },
      {
        id: '6',
        type: 'message_received',
        title: 'New Message',
        message: 'Alex Kim sent you a message: "Hey! Looking forward to meeting at the event..."',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        read: false,
        actionUrl: '/networking?tab=messages',
        actionLabel: 'Reply',
        metadata: { userId: 'alex456', userName: 'Alex Kim' }
      },
      {
        id: '7',
        type: 'meeting_scheduled',
        title: 'Meeting Scheduled',
        message: 'Coffee chat with Jordan Lee scheduled for Friday at 2:00 PM at Campus Cafe.',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        read: true,
        actionUrl: '/networking?tab=meetings',
        actionLabel: 'View Meeting',
        metadata: { userId: 'jordan789', userName: 'Jordan Lee' }
      },
      {
        id: '8',
        type: 'registration_confirmed',
        title: 'Registration Confirmed',
        message: 'You\'re registered for Startup Pitch Night. Your ticket has been sent to your email.',
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
        read: true,
        actionUrl: '/tickets',
        actionLabel: 'View Ticket',
        metadata: { eventId: '4', eventName: 'Startup Pitch Night' }
      },
      {
        id: '9',
        type: 'challenge_completed',
        title: 'Challenge Completed! 🎯',
        message: 'You completed the "Social Butterfly" challenge and earned 500 XP!',
        timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000),
        read: true,
        actionUrl: '/gamification',
        actionLabel: 'View Rewards'
      },
      {
        id: '10',
        type: 'connection_accepted',
        title: 'Connection Accepted',
        message: 'Maria Rodriguez accepted your connection request.',
        timestamp: new Date(Date.now() - 120 * 60 * 60 * 1000),
        read: true,
        actionUrl: '/networking',
        actionLabel: 'View Profile',
        metadata: { userId: 'maria101', userName: 'Maria Rodriguez' }
      }
    ];

    setNotifications(mockNotifications);
    setLoading(false);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.read) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({ title: 'All notifications marked as read' });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'event_reminder':
      case 'event_starting':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'event_update':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'registration_confirmed':
        return <Ticket className="w-5 h-5 text-green-500" />;
      case 'certificate_ready':
        return <Award className="w-5 h-5 text-amber-500" />;
      case 'connection_request':
      case 'connection_accepted':
        return <UserPlus className="w-5 h-5 text-indigo-500" />;
      case 'message_received':
        return <MessageSquare className="w-5 h-5 text-cyan-500" />;
      case 'badge_earned':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'challenge_completed':
        return <Award className="w-5 h-5 text-orange-500" />;
      case 'meeting_scheduled':
        return <Calendar className="w-5 h-5 text-emerald-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You\'re all caught up!'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
          <Button variant="outline" onClick={() => window.location.href = '/preferences?tab=notifications'}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-wrap gap-2">
              {(['all', 'event_reminder', 'connection_request', 'message_received', 'badge_earned'] as const).map((type) => (
                <Button
                  key={type}
                  variant={typeFilter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(type)}
                >
                  {type === 'all' ? 'All Types' : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BellOff className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">
                {filter === 'unread' 
                  ? 'You have no unread notifications'
                  : 'You haven\'t received any notifications yet'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence>
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="shrink-0">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <Badge variant="secondary" className="text-xs">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {notification.actionUrl && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  markAsRead(notification.id);
                                  window.location.href = notification.actionUrl!;
                                }}
                              >
                                {notification.actionLabel || 'View'}
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.read && (
                                  <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Mark as read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
