'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Bell, 
  Mail, 
  Settings,
  Save,
  Globe,
  Loader2,
  Megaphone,
  CalendarCheck,
  Users
} from 'lucide-react';

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  eventReminders: boolean;
  communityUpdates: boolean;
  marketingEmails: boolean;
}

const defaultPrefs: NotificationPreferences = {
  email: true,
  push: true,
  eventReminders: true,
  communityUpdates: true,
  marketingEmails: false,
};

export default function UserPreferencesPanel() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy'>('notifications');
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs);

  useEffect(() => {
    if (user?.notificationPreferences) {
      const np = user.notificationPreferences as Partial<NotificationPreferences>;
      setPrefs({
        email: np.email ?? defaultPrefs.email,
        push: np.push ?? defaultPrefs.push,
        eventReminders: np.eventReminders ?? defaultPrefs.eventReminders,
        communityUpdates: np.communityUpdates ?? defaultPrefs.communityUpdates,
        marketingEmails: np.marketingEmails ?? defaultPrefs.marketingEmails,
      });
    }
  }, [user?.notificationPreferences]);

  const togglePref = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser({ notificationPreferences: prefs as unknown as Record<string, boolean> });
      toast({ title: 'Preferences saved successfully' });
    } catch (e) {
      toast({ title: 'Failed to save preferences', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const prefItems = [
    { key: 'email' as const, label: 'Email Notifications', description: 'Receive updates via email', icon: Mail },
    { key: 'push' as const, label: 'Push Notifications', description: 'Browser push notifications', icon: Bell },
    { key: 'eventReminders' as const, label: 'Event Reminders', description: 'Get reminded before events start', icon: CalendarCheck },
    { key: 'communityUpdates' as const, label: 'Community Updates', description: 'Posts and activity in your communities', icon: Users },
    { key: 'marketingEmails' as const, label: 'Marketing Emails', description: 'Platform news and promotions', icon: Megaphone },
  ];

  return (
    <div className="space-y-6 text-white">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Preferences</h2>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="md:w-64 h-fit bg-muted/40 border-border text-white">
          <CardContent className="p-4 space-y-2">
            <Button variant={activeTab === 'notifications' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('notifications')}>
              <Bell className="w-4 h-4 mr-2" /> Notifications
            </Button>
            <Button variant={activeTab === 'privacy' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('privacy')}>
              <Settings className="w-4 h-4 mr-2" /> Privacy
            </Button>
          </CardContent>
        </Card>

        <div className="flex-1 space-y-6">
          {activeTab === 'notifications' && (
            <Card className="bg-muted/40 border-border text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {prefItems.map((item, i) => (
                  <React.Fragment key={item.key}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted/40">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={prefs[item.key]}
                        onCheckedChange={() => togglePref(item.key)}
                      />
                    </div>
                    {i < prefItems.length - 1 && <Separator className="bg-muted/40" />}
                  </React.Fragment>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card className="bg-muted/40 border-border text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">Public Profile</p>
                    <p className="text-xs text-muted-foreground">Allow others to view your profile and badges</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-muted/40" />
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">Show Activity Status</p>
                    <p className="text-xs text-muted-foreground">Let others see when you're active</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-muted/40" />
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">Allow Connection Requests</p>
                    <p className="text-xs text-muted-foreground">Let other users send you connection requests</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

