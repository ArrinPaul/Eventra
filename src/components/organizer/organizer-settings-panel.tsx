'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  Mail,
  Shield,
  Palette,
  Globe,
  CreditCard,
  Users,
  Calendar,
  FileText,
  Save,
  Check,
  AlertTriangle,
  Lock,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

interface OrganizerSettings {
  // General Settings
  organizationName: string;
  organizationEmail: string;
  contactPhone: string;
  website: string;
  timezone: string;
  language: string;
  
  // Event Defaults
  defaultEventDuration: number;
  defaultCapacity: number;
  defaultRegistrationDeadlineDays: number;
  requireApprovalForRegistration: boolean;
  allowWaitlist: boolean;
  waitlistCapacity: number;
  
  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyOnNewRegistration: boolean;
  notifyOnCancellation: boolean;
  notifyOnCheckIn: boolean;
  notifyDailyDigest: boolean;
  digestTime: string;
  
  // Privacy & Security
  showAttendeesToOthers: boolean;
  allowPublicEventListing: boolean;
  requireEmailVerification: boolean;
  twoFactorEnabled: boolean;
  
  // Branding
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  customCss: string;
  
  // Payment Settings
  paymentEnabled: boolean;
  stripeConnected: boolean;
  stripeAccountId: string;
  defaultCurrency: string;
  taxRate: number;
  
  // Team Management
  teamMembers: TeamMember[];
}

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  addedAt: string;
  status: 'active' | 'pending' | 'inactive';
}

const defaultSettings: OrganizerSettings = {
  organizationName: '',
  organizationEmail: '',
  contactPhone: '',
  website: '',
  timezone: 'UTC',
  language: 'en',
  
  defaultEventDuration: 60,
  defaultCapacity: 100,
  defaultRegistrationDeadlineDays: 7,
  requireApprovalForRegistration: false,
  allowWaitlist: true,
  waitlistCapacity: 50,
  
  emailNotifications: true,
  pushNotifications: true,
  notifyOnNewRegistration: true,
  notifyOnCancellation: true,
  notifyOnCheckIn: false,
  notifyDailyDigest: true,
  digestTime: '09:00',
  
  showAttendeesToOthers: false,
  allowPublicEventListing: true,
  requireEmailVerification: true,
  twoFactorEnabled: false,
  
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  logoUrl: '',
  customCss: '',
  
  paymentEnabled: false,
  stripeConnected: false,
  stripeAccountId: '',
  defaultCurrency: 'USD',
  taxRate: 0,
  
  teamMembers: [],
};

export function OrganizerSettingsPanel() {
  const [settings, setSettings] = useState<OrganizerSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamMember['role']>('viewer');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    try {
      const settingsRef = doc(db, 'organizer_settings', user.id);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        setSettings({ ...defaultSettings, ...settingsDoc.data() } as OrganizerSettings);
      } else {
        // Initialize with defaults
        await setDoc(settingsRef, defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings. Using defaults.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user || !user.id) return;

    setSaving(true);
    try {
      const settingsRef = doc(db, 'organizer_settings', user.id);
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: new Date().toISOString(),
      });
      
      setHasChanges(false);
      toast({
        title: 'Settings Saved',
        description: 'Your settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof OrganizerSettings>(key: K, value: OrganizerSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const addTeamMember = async () => {
    if (!newMemberEmail.trim()) return;

    const newMember: TeamMember = {
      id: `member_${Date.now()}`,
      email: newMemberEmail,
      name: newMemberEmail.split('@')[0],
      role: newMemberRole,
      addedAt: new Date().toISOString(),
      status: 'pending',
    };

    setSettings(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, newMember],
    }));
    setNewMemberEmail('');
    setHasChanges(true);

    toast({
      title: 'Team Member Invited',
      description: `Invitation sent to ${newMemberEmail}`,
    });
  };

  const removeTeamMember = (memberId: string) => {
    setSettings(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter(m => m.id !== memberId),
    }));
    setHasChanges(true);
  };

  const regenerateApiKey = () => {
    toast({
      title: 'API Key Regenerated',
      description: 'Your new API key has been generated. Make sure to update your integrations.',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organizer Settings</h2>
          <p className="text-muted-foreground">
            Manage your organization preferences, notifications, and team access.
          </p>
        </div>
        <Button onClick={saveSettings} disabled={!hasChanges || saving}>
          {saving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">You have unsaved changes.</span>
        </div>
      )}

      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-6 gap-2">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>
                Basic information about your organization that will be displayed to attendees.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={settings.organizationName}
                    onChange={(e) => updateSetting('organizationName', e.target.value)}
                    placeholder="Your Organization"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgEmail">Organization Email</Label>
                  <Input
                    id="orgEmail"
                    type="email"
                    value={settings.organizationEmail}
                    onChange={(e) => updateSetting('organizationEmail', e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Phone</Label>
                  <Input
                    id="phone"
                    value={settings.contactPhone}
                    onChange={(e) => updateSetting('contactPhone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={settings.website}
                    onChange={(e) => updateSetting('website', e.target.value)}
                    placeholder="https://yoursite.com"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => updateSetting('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => updateSetting('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Keys Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage API keys for third-party integrations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">Primary API Key</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {showApiKey ? 'evt_live_abc123xyz789...' : '••••••••••••••••••••'}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">Regenerate</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will invalidate your current API key. All applications using this key will need to be updated.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={regenerateApiKey}>
                          Regenerate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Defaults */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Event Defaults</CardTitle>
              <CardDescription>
                Default settings applied to new events. You can override these for individual events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Default Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.defaultEventDuration}
                    onChange={(e) => updateSetting('defaultEventDuration', parseInt(e.target.value) || 60)}
                    min={15}
                    max={480}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Capacity</Label>
                  <Input
                    type="number"
                    value={settings.defaultCapacity}
                    onChange={(e) => updateSetting('defaultCapacity', parseInt(e.target.value) || 100)}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Registration Deadline (days before)</Label>
                  <Input
                    type="number"
                    value={settings.defaultRegistrationDeadlineDays}
                    onChange={(e) => updateSetting('defaultRegistrationDeadlineDays', parseInt(e.target.value) || 7)}
                    min={0}
                    max={90}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Approval for Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Manually approve each registration before confirmation.
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireApprovalForRegistration}
                    onCheckedChange={(checked) => updateSetting('requireApprovalForRegistration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Waitlist</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow registration beyond capacity with a waitlist.
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowWaitlist}
                    onCheckedChange={(checked) => updateSetting('allowWaitlist', checked)}
                  />
                </div>

                {settings.allowWaitlist && (
                  <div className="space-y-2 pl-6">
                    <Label>Waitlist Capacity</Label>
                    <Input
                      type="number"
                      value={settings.waitlistCapacity}
                      onChange={(e) => updateSetting('waitlistCapacity', parseInt(e.target.value) || 50)}
                      min={1}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you want to be notified about event activities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email.
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser.
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notify me when:</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Someone registers for your event.
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyOnNewRegistration}
                    onCheckedChange={(checked) => updateSetting('notifyOnNewRegistration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registration Cancellation</Label>
                    <p className="text-sm text-muted-foreground">
                      Someone cancels their registration.
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyOnCancellation}
                    onCheckedChange={(checked) => updateSetting('notifyOnCancellation', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Attendee Check-in</Label>
                    <p className="text-sm text-muted-foreground">
                      Someone checks in at your event.
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyOnCheckIn}
                    onCheckedChange={(checked) => updateSetting('notifyOnCheckIn', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a daily summary of all activities.
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifyDailyDigest}
                    onCheckedChange={(checked) => updateSetting('notifyDailyDigest', checked)}
                  />
                </div>

                {settings.notifyDailyDigest && (
                  <div className="space-y-2 pl-6">
                    <Label>Digest Time</Label>
                    <Input
                      type="time"
                      value={settings.digestTime}
                      onChange={(e) => updateSetting('digestTime', e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy & Security */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
              <CardDescription>
                Control visibility and security settings for your events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Attendees to Others</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow attendees to see who else is attending the event.
                    </p>
                  </div>
                  <Switch
                    checked={settings.showAttendeesToOthers}
                    onCheckedChange={(checked) => updateSetting('showAttendeesToOthers', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public Event Listing</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow events to appear in public search and listings.
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowPublicEventListing}
                    onCheckedChange={(checked) => updateSetting('allowPublicEventListing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Attendees must verify their email before registration is confirmed.
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Two-Factor Authentication
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account.
                    </p>
                  </div>
                  <Switch
                    checked={settings.twoFactorEnabled}
                    onCheckedChange={(checked) => updateSetting('twoFactorEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Customization</CardTitle>
              <CardDescription>
                Customize the look and feel of your event pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      className="w-14 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                      className="w-14 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.secondaryColor}
                      onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={settings.logoUrl}
                  onChange={(e) => updateSetting('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-sm text-muted-foreground">
                  Recommended size: 200x60px, PNG or SVG format.
                </p>
              </div>

              {settings.logoUrl && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">Logo Preview</p>
                  <img
                    src={settings.logoUrl}
                    alt="Logo preview"
                    className="max-h-16 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Custom CSS</Label>
                <Textarea
                  value={settings.customCss}
                  onChange={(e) => updateSetting('customCss', e.target.value)}
                  placeholder={`/* Custom CSS for event pages */
.event-card {
  border-radius: 12px;
}`}
                  className="font-mono text-sm"
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Advanced: Add custom CSS to style your event pages.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Management */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Invite team members and manage their access levels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Member Form */}
              <div className="flex gap-2">
                <Input
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Email address"
                  className="flex-1"
                />
                <Select
                  value={newMemberRole}
                  onValueChange={(value: TeamMember['role']) => setNewMemberRole(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addTeamMember}>Invite</Button>
              </div>

              <Separator />

              {/* Role Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 border rounded-lg">
                  <Badge className="mb-2">Admin</Badge>
                  <p className="text-muted-foreground">
                    Full access to all events and settings.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <Badge variant="secondary" className="mb-2">Editor</Badge>
                  <p className="text-muted-foreground">
                    Can edit events and view registrations.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <Badge variant="outline" className="mb-2">Viewer</Badge>
                  <p className="text-muted-foreground">
                    Read-only access to events and analytics.
                  </p>
                </div>
              </div>

              {/* Team Members List */}
              <div className="space-y-2">
                <h4 className="font-medium">Team Members ({settings.teamMembers.length})</h4>
                
                {settings.teamMembers.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">
                    No team members yet. Invite someone to get started.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {settings.teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {member.status}
                          </Badge>
                          <Badge variant="outline">{member.role}</Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {member.name} from your team? They will lose access to all events.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeTeamMember(member.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
