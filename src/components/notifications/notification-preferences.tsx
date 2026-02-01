'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  BellRing,
  Mail,
  Smartphone,
  Volume2,
  VolumeX,
  Calendar,
  Users,
  MessageSquare,
  Award,
  Ticket,
  AlertCircle,
  Clock,
  Heart,
  Save,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '@/core/config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

interface NotificationPreferences {
  // Delivery Methods
  inApp: boolean;
  email: boolean;
  push: boolean;
  sound: boolean;
  
  // Event Notifications
  eventReminders: boolean;
  eventUpdates: boolean;
  eventStarting: boolean;
  registrationConfirmed: boolean;
  
  // Social Notifications
  connectionRequests: boolean;
  connectionAccepted: boolean;
  messageReceived: boolean;
  newFollower: boolean;
  postLiked: boolean;
  commentReceived: boolean;
  
  // Gamification
  badgeEarned: boolean;
  challengeCompleted: boolean;
  leaderboardUpdate: boolean;
  
  // Certificates
  certificateReady: boolean;
  
  // Meeting & Calendar
  meetingScheduled: boolean;
  meetingReminder: boolean;
  
  // Email Frequency
  emailDigest: 'instant' | 'daily' | 'weekly' | 'never';
  reminderTiming: '1h' | '24h' | 'both';
}

export function NotificationPreferences() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    inApp: true,
    email: true,
    push: false,
    sound: true,
    
    eventReminders: true,
    eventUpdates: true,
    eventStarting: true,
    registrationConfirmed: true,
    
    connectionRequests: true,
    connectionAccepted: true,
    messageReceived: true,
    newFollower: true,
    postLiked: false,
    commentReceived: true,
    
    badgeEarned: true,
    challengeCompleted: true,
    leaderboardUpdate: false,
    
    certificateReady: true,
    
    meetingScheduled: true,
    meetingReminder: true,
    
    emailDigest: 'daily',
    reminderTiming: 'both'
  });

  // Load preferences from Firestore on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const prefsDoc = await getDoc(doc(db, 'user_preferences', user.uid));
        if (prefsDoc.exists()) {
          const data = prefsDoc.data();
          if (data.notificationPreferences) {
            setPreferences(prev => ({ ...prev, ...data.notificationPreferences }));
          }
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, [user?.uid]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save preferences.',
        variant: 'destructive'
      });
      return;
    }
    
    setSaving(true);
    
    try {
      await setDoc(doc(db, 'user_preferences', user.uid), {
        notificationPreferences: preferences,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({
        title: 'Preferences Saved',
        description: 'Your notification preferences have been updated.'
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPreferences(prev => ({ ...prev, push: true }));
        toast({
          title: 'Push Notifications Enabled',
          description: 'You will now receive push notifications.'
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to enable push notifications.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Notification Preferences</h2>
          <p className="text-muted-foreground">Manage how and when you receive notifications</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Delivery Methods
          </CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BellRing className="w-4 h-4 text-primary" />
              </div>
              <div>
                <Label className="font-medium">In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">Show notifications within the app</p>
              </div>
            </div>
            <Switch 
              checked={preferences.inApp}
              onCheckedChange={() => handleToggle('inApp')}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <Label className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch 
              checked={preferences.email}
              onCheckedChange={() => handleToggle('email')}
            />
          </div>

          {preferences.email && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pl-12"
            >
              <Label className="text-sm text-muted-foreground mb-2 block">Email Frequency</Label>
              <div className="flex gap-2">
                {(['instant', 'daily', 'weekly'] as const).map((freq) => (
                  <Button
                    key={freq}
                    variant={preferences.emailDigest === freq ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences(prev => ({ ...prev, emailDigest: freq }))}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Smartphone className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <Label className="font-medium">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
              </div>
            </div>
            {preferences.push ? (
              <Switch 
                checked={preferences.push}
                onCheckedChange={() => handleToggle('push')}
              />
            ) : (
              <Button size="sm" variant="outline" onClick={handleEnablePush}>
                Enable
              </Button>
            )}
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                {preferences.sound ? (
                  <Volume2 className="w-4 h-4 text-amber-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <div>
                <Label className="font-medium">Sound</Label>
                <p className="text-sm text-muted-foreground">Play sound for new notifications</p>
              </div>
            </div>
            <Switch 
              checked={preferences.sound}
              onCheckedChange={() => handleToggle('sound')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Event Notifications
          </CardTitle>
          <CardDescription>Stay updated on your events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Event Reminders</Label>
              <p className="text-sm text-muted-foreground">Reminders before events you&apos;re attending</p>
            </div>
            <Switch 
              checked={preferences.eventReminders}
              onCheckedChange={() => handleToggle('eventReminders')}
            />
          </div>

          {preferences.eventReminders && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pl-4 border-l-2 border-muted ml-2"
            >
              <Label className="text-sm text-muted-foreground mb-2 block">Remind me</Label>
              <div className="flex gap-2">
                {([
                  { value: '1h', label: '1 hour before' },
                  { value: '24h', label: '24 hours before' },
                  { value: 'both', label: 'Both' }
                ] as const).map((opt) => (
                  <Button
                    key={opt.value}
                    variant={preferences.reminderTiming === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences(prev => ({ ...prev, reminderTiming: opt.value }))}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Event Updates</Label>
              <p className="text-sm text-muted-foreground">Changes to events you&apos;re registered for</p>
            </div>
            <Switch 
              checked={preferences.eventUpdates}
              onCheckedChange={() => handleToggle('eventUpdates')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Event Starting Soon</Label>
              <p className="text-sm text-muted-foreground">Alert when an event is about to start</p>
            </div>
            <Switch 
              checked={preferences.eventStarting}
              onCheckedChange={() => handleToggle('eventStarting')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Registration Confirmed</Label>
              <p className="text-sm text-muted-foreground">Confirmation when you register for an event</p>
            </div>
            <Switch 
              checked={preferences.registrationConfirmed}
              onCheckedChange={() => handleToggle('registrationConfirmed')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Social & Networking
          </CardTitle>
          <CardDescription>Notifications about connections and messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Connection Requests</Label>
              <p className="text-sm text-muted-foreground">When someone wants to connect</p>
            </div>
            <Switch 
              checked={preferences.connectionRequests}
              onCheckedChange={() => handleToggle('connectionRequests')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Connection Accepted</Label>
              <p className="text-sm text-muted-foreground">When your request is accepted</p>
            </div>
            <Switch 
              checked={preferences.connectionAccepted}
              onCheckedChange={() => handleToggle('connectionAccepted')}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Messages</Label>
              <p className="text-sm text-muted-foreground">New messages from connections</p>
            </div>
            <Switch 
              checked={preferences.messageReceived}
              onCheckedChange={() => handleToggle('messageReceived')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Meeting Scheduled</Label>
              <p className="text-sm text-muted-foreground">When a meeting is scheduled with you</p>
            </div>
            <Switch 
              checked={preferences.meetingScheduled}
              onCheckedChange={() => handleToggle('meetingScheduled')}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Post Likes</Label>
              <p className="text-sm text-muted-foreground">When someone likes your post</p>
            </div>
            <Switch 
              checked={preferences.postLiked}
              onCheckedChange={() => handleToggle('postLiked')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Comments</Label>
              <p className="text-sm text-muted-foreground">When someone comments on your post</p>
            </div>
            <Switch 
              checked={preferences.commentReceived}
              onCheckedChange={() => handleToggle('commentReceived')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Gamification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5" />
            Achievements & Gamification
          </CardTitle>
          <CardDescription>Badges, challenges, and leaderboard updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Badge Earned</Label>
              <p className="text-sm text-muted-foreground">When you earn a new badge</p>
            </div>
            <Switch 
              checked={preferences.badgeEarned}
              onCheckedChange={() => handleToggle('badgeEarned')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Challenge Completed</Label>
              <p className="text-sm text-muted-foreground">When you complete a challenge</p>
            </div>
            <Switch 
              checked={preferences.challengeCompleted}
              onCheckedChange={() => handleToggle('challengeCompleted')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Leaderboard Updates</Label>
              <p className="text-sm text-muted-foreground">Weekly leaderboard position changes</p>
            </div>
            <Switch 
              checked={preferences.leaderboardUpdate}
              onCheckedChange={() => handleToggle('leaderboardUpdate')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Certificates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Certificates & Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Certificate Ready</Label>
              <p className="text-sm text-muted-foreground">When your certificate is available</p>
            </div>
            <Switch 
              checked={preferences.certificateReady}
              onCheckedChange={() => handleToggle('certificateReady')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Mobile) */}
      <div className="sm:hidden">
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
