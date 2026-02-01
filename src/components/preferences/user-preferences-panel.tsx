'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  Users, 
  Calendar, 
  Heart, 
  MessageCircle,
  Award,
  TrendingUp,
  Volume2,
  VolumeX,
  Settings,
  Save
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/core/config/firebase';

interface NotificationPreferences {
  email: {
    enabled: boolean;
    events: boolean;
    reminders: boolean;
    messages: boolean;
    connections: boolean;
    communities: boolean;
    marketing: boolean;
    digest: boolean;
  };
  push: {
    enabled: boolean;
    events: boolean;
    messages: boolean;
    connections: boolean;
    reminders: boolean;
    achievements: boolean;
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    frequency: 'all' | 'important' | 'minimal';
  };
  schedule: {
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
    digestFrequency: 'daily' | 'weekly' | 'never';
    reminderTiming: number; // hours before event
  };
}

interface UserPreferences {
  profile: {
    visibility: 'public' | 'connections' | 'private';
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    allowMessages: 'anyone' | 'connections' | 'none';
  };
  content: {
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
  };
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
    recommendations: boolean;
    thirdPartyIntegrations: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
    screenReader: boolean;
  };
}

interface UserPreferencesPanelProps {
  initialTab?: 'notifications' | 'privacy' | 'accessibility' | 'general';
}

export default function UserPreferencesPanel({ initialTab = 'notifications' }: UserPreferencesPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'accessibility' | 'general'>(initialTab);
  
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email: {
      enabled: true,
      events: true,
      reminders: true,
      messages: true,
      connections: true,
      communities: true,
      marketing: false,
      digest: true,
    },
    push: {
      enabled: true,
      events: true,
      messages: true,
      connections: true,
      reminders: true,
      achievements: true,
    },
    inApp: {
      enabled: true,
      sound: true,
      desktop: true,
      frequency: 'important',
    },
    schedule: {
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
      digestFrequency: 'daily',
      reminderTiming: 24,
    },
  });

  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    profile: {
      visibility: 'public',
      showEmail: false,
      showPhone: false,
      showLocation: true,
      allowMessages: 'connections',
    },
    content: {
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
    },
    privacy: {
      dataCollection: true,
      analytics: true,
      recommendations: true,
      thirdPartyIntegrations: true,
    },
    accessibility: {
      reducedMotion: false,
      highContrast: false,
      fontSize: 'medium',
      screenReader: false,
    },
  });

  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user?.uid) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        if (data.notificationPreferences) {
          setNotificationPrefs({ ...notificationPrefs, ...data.notificationPreferences });
        }
        
        if (data.userPreferences) {
          setUserPrefs({ ...userPrefs, ...data.userPreferences });
        }
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notificationPreferences: notificationPrefs,
        userPreferences: userPrefs,
        preferencesUpdatedAt: new Date(),
      });

      toast({
        title: "Preferences Saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationPref = (category: keyof NotificationPreferences, key: string, value: any) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const updateUserPref = (category: keyof UserPreferences, key: string, value: any) => {
    setUserPrefs(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'privacy' as const, label: 'Privacy', icon: Settings },
    { id: 'accessibility' as const, label: 'Accessibility', icon: Users },
    { id: 'general' as const, label: 'General', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Preferences</h2>
          <p className="text-muted-foreground">
            Customize your experience and manage your privacy settings
          </p>
        </div>
        <Button onClick={savePreferences} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:w-64 h-fit">
          <CardContent className="p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Email Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.email.enabled}
                      onCheckedChange={(checked) => updateNotificationPref('email', 'enabled', checked)}
                    />
                  </div>

                  {notificationPrefs.email.enabled && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        {[
                          { key: 'events', label: 'Event Updates', description: 'New events and changes' },
                          { key: 'reminders', label: 'Event Reminders', description: 'Upcoming event notifications' },
                          { key: 'messages', label: 'Messages', description: 'New chat messages and replies' },
                          { key: 'connections', label: 'Connections', description: 'New connection requests' },
                          { key: 'communities', label: 'Communities', description: 'Community activity and discussions' },
                          { key: 'digest', label: 'Daily Digest', description: 'Summary of daily activity' },
                          { key: 'marketing', label: 'Marketing', description: 'Promotional emails and updates' },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                            <Switch
                              checked={notificationPrefs.email[item.key as keyof typeof notificationPrefs.email] as boolean}
                              onCheckedChange={(checked) => updateNotificationPref('email', item.key, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Push Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Push Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.push.enabled}
                      onCheckedChange={(checked) => updateNotificationPref('push', 'enabled', checked)}
                    />
                  </div>

                  {notificationPrefs.push.enabled && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        {[
                          { key: 'events', label: 'Events', icon: Calendar },
                          { key: 'messages', label: 'Messages', icon: MessageCircle },
                          { key: 'connections', label: 'Connections', icon: Users },
                          { key: 'reminders', label: 'Reminders', icon: Clock },
                          { key: 'achievements', label: 'Achievements', icon: Award },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <item.icon className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium text-sm">{item.label}</p>
                            </div>
                            <Switch
                              checked={notificationPrefs.push[item.key as keyof typeof notificationPrefs.push] as boolean}
                              onCheckedChange={(checked) => updateNotificationPref('push', item.key, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Schedule Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Schedule & Timing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Quiet Hours</p>
                      <p className="text-sm text-muted-foreground">Don&apos;t send notifications during these hours</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.schedule.quietHours.enabled}
                      onCheckedChange={(checked) => updateNotificationPref('schedule', 'quietHours', { ...notificationPrefs.schedule.quietHours, enabled: checked })}
                    />
                  </div>

                  {notificationPrefs.schedule.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Start Time</label>
                        <Select 
                          value={notificationPrefs.schedule.quietHours.start}
                          onValueChange={(value) => updateNotificationPref('schedule', 'quietHours', { ...notificationPrefs.schedule.quietHours, start: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return (
                                <SelectItem key={i} value={`${hour}:00`}>
                                  {hour}:00
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">End Time</label>
                        <Select 
                          value={notificationPrefs.schedule.quietHours.end}
                          onValueChange={(value) => updateNotificationPref('schedule', 'quietHours', { ...notificationPrefs.schedule.quietHours, end: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return (
                                <SelectItem key={i} value={`${hour}:00`}>
                                  {hour}:00
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Email Digest Frequency</label>
                      <Select 
                        value={notificationPrefs.schedule.digestFrequency}
                        onValueChange={(value) => updateNotificationPref('schedule', 'digestFrequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Event Reminder Timing (hours before)</label>
                      <Select 
                        value={notificationPrefs.schedule.reminderTiming.toString()}
                        onValueChange={(value) => updateNotificationPref('schedule', 'reminderTiming', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="2">2 hours</SelectItem>
                          <SelectItem value="4">4 hours</SelectItem>
                          <SelectItem value="24">24 hours</SelectItem>
                          <SelectItem value="48">48 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              {/* Profile Privacy */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Privacy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Profile Visibility</label>
                    <Select 
                      value={userPrefs.profile.visibility}
                      onValueChange={(value) => updateUserPref('profile', 'visibility', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can see</SelectItem>
                        <SelectItem value="connections">Connections Only</SelectItem>
                        <SelectItem value="private">Private - Only me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Who can message you?</label>
                    <Select 
                      value={userPrefs.profile.allowMessages}
                      onValueChange={(value) => updateUserPref('profile', 'allowMessages', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anyone">Anyone</SelectItem>
                        <SelectItem value="connections">Connections Only</SelectItem>
                        <SelectItem value="none">No one</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <p className="font-medium">Show in Profile:</p>
                    {[
                      { key: 'showEmail', label: 'Email Address' },
                      { key: 'showPhone', label: 'Phone Number' },
                      { key: 'showLocation', label: 'Location' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <p className="text-sm">{item.label}</p>
                        <Switch
                          checked={userPrefs.profile[item.key as keyof typeof userPrefs.profile] as boolean}
                          onCheckedChange={(checked) => updateUserPref('profile', item.key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Data & Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Data & Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'dataCollection', label: 'Data Collection', description: 'Allow collection of usage data to improve the service' },
                    { key: 'analytics', label: 'Analytics', description: 'Help us understand how you use the platform' },
                    { key: 'recommendations', label: 'Personalized Recommendations', description: 'Use your data to provide better recommendations' },
                    { key: 'thirdPartyIntegrations', label: 'Third-party Integrations', description: 'Allow connections with external services' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch
                        checked={userPrefs.privacy[item.key as keyof typeof userPrefs.privacy] as boolean}
                        onCheckedChange={(checked) => updateUserPref('privacy', item.key, checked)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {[
                    { key: 'reducedMotion', label: 'Reduced Motion', description: 'Minimize animations and transitions' },
                    { key: 'highContrast', label: 'High Contrast', description: 'Increase contrast for better visibility' },
                    { key: 'screenReader', label: 'Screen Reader Support', description: 'Optimize for screen reader usage' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch
                        checked={userPrefs.accessibility[item.key as keyof typeof userPrefs.accessibility] as boolean}
                        onCheckedChange={(checked) => updateUserPref('accessibility', item.key, checked)}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium">Font Size</label>
                  <Select 
                    value={userPrefs.accessibility.fontSize}
                    onValueChange={(value) => updateUserPref('accessibility', 'fontSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Language & Region */}
              <Card>
                <CardHeader>
                  <CardTitle>Language & Region</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Language</label>
                    <Select 
                      value={userPrefs.content.language}
                      onValueChange={(value) => updateUserPref('content', 'language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Timezone</label>
                    <Select 
                      value={userPrefs.content.timezone}
                      onValueChange={(value) => updateUserPref('content', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Date Format</label>
                    <Select 
                      value={userPrefs.content.dateFormat}
                      onValueChange={(value) => updateUserPref('content', 'dateFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Currency</label>
                    <Select 
                      value={userPrefs.content.currency}
                      onValueChange={(value) => updateUserPref('content', 'currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (â‚¬)</SelectItem>
                        <SelectItem value="GBP">GBP (Â£)</SelectItem>
                        <SelectItem value="JPY">JPY (Â¥)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}