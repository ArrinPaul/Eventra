'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Bell,
  Mail,
  Shield,
  Palette,
  Globe,
  Database,
  Clock,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lock,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Zap,
  Server,
  Upload,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Key,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

// Types
interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  contactPhone: string;
  timezone: string;
  language: string;
  dateFormat: string;
  currency: string;
}

interface FeatureToggles {
  chatEnabled: boolean;
  feedEnabled: boolean;
  gamificationEnabled: boolean;
  aiRecommendations: boolean;
  networkingEnabled: boolean;
  certificatesEnabled: boolean;
  analyticsEnabled: boolean;
  notificationsEnabled: boolean;
  checkInEnabled: boolean;
  ticketingEnabled: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  digestFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  quietHoursStart: string;
  quietHoursEnd: string;
  systemAlerts: boolean;
}

interface SecuritySettings {
  requireEmailVerification: boolean;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
  allowSocialLogin: boolean;
  allowGuestAccess: boolean;
}

interface EmailTemplates {
  welcomeEmail: string;
  eventReminder: string;
  passwordReset: string;
  certificateReady: string;
}

interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  scheduledMaintenance: Date | null;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackup: Date;
}

export default function SystemSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  // Settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: 'Eventra',
    siteDescription: 'Event Management Platform for Universities',
    supportEmail: 'support@eventra.edu',
    contactPhone: '+1 (555) 123-4567',
    timezone: 'America/New_York',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD'
  });

  const [featureToggles, setFeatureToggles] = useState<FeatureToggles>({
    chatEnabled: true,
    feedEnabled: true,
    gamificationEnabled: true,
    aiRecommendations: true,
    networkingEnabled: true,
    certificatesEnabled: true,
    analyticsEnabled: true,
    notificationsEnabled: true,
    checkInEnabled: true,
    ticketingEnabled: true
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    digestFrequency: 'daily',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    systemAlerts: true
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    requireEmailVerification: true,
    twoFactorEnabled: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    allowSocialLogin: true,
    allowGuestAccess: false
  });

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplates>({
    welcomeEmail: 'Welcome to Eventra! We\'re excited to have you join our community...',
    eventReminder: 'Don\'t forget! {{eventName}} is happening {{timeUntil}}...',
    passwordReset: 'Click the link below to reset your password...',
    certificateReady: 'Congratulations! Your certificate for {{eventName}} is ready...'
  });

  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings>({
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
    scheduledMaintenance: null,
    backupFrequency: 'daily',
    lastBackup: new Date('2026-01-28T03:00:00')
  });

  const [apiKeys, setApiKeys] = useState({
    publicKey: 'pk_live_eventra_xxxxxxxxxxxxxxxxxxxx',
    secretKey: '••••••••••••••••••••••••••••••••'
  });

  const [showSecretKey, setShowSecretKey] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    // In production, load from Firestore
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Settings Saved',
      description: 'Your changes have been saved successfully.'
    });
    
    setSaving(false);
    setHasChanges(false);
  };

  const handleToggleFeature = (feature: keyof FeatureToggles) => {
    setFeatureToggles(prev => ({ ...prev, [feature]: !prev[feature] }));
    setHasChanges(true);
  };

  const handleGeneralChange = (field: keyof GeneralSettings, value: string) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNotificationChange = (field: keyof NotificationSettings, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSecurityChange = (field: keyof SecuritySettings, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleMaintenanceToggle = () => {
    if (!maintenanceSettings.maintenanceMode) {
      // Show confirmation dialog before enabling
      return;
    }
    setMaintenanceSettings(prev => ({ ...prev, maintenanceMode: false }));
    setHasChanges(true);
  };

  const regenerateApiKey = () => {
    const newKey = 'sk_live_eventra_' + Math.random().toString(36).substring(2, 34);
    setApiKeys(prev => ({ ...prev, secretKey: newKey }));
    setShowSecretKey(true);
    toast({
      title: 'API Key Regenerated',
      description: 'Your new secret key has been generated. Make sure to copy it now.',
      variant: 'destructive'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard.'
    });
  };

  const triggerBackup = async () => {
    toast({
      title: 'Backup Started',
      description: 'Database backup has been initiated.'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setMaintenanceSettings(prev => ({ ...prev, lastBackup: new Date() }));
    
    toast({
      title: 'Backup Complete',
      description: 'Database backup completed successfully.'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">Manage platform configuration and features</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved Changes
            </Badge>
          )}
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <Zap className="w-4 h-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Server className="w-4 h-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => handleGeneralChange('siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => handleGeneralChange('supportEmail', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={(e) => handleGeneralChange('siteDescription', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={generalSettings.contactPhone}
                    onChange={(e) => handleGeneralChange('contactPhone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={generalSettings.timezone}
                    onValueChange={(value) => handleGeneralChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={generalSettings.language}
                    onValueChange={(value) => handleGeneralChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select 
                    value={generalSettings.dateFormat}
                    onValueChange={(value) => handleGeneralChange('dateFormat', value)}
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
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={generalSettings.currency}
                    onValueChange={(value) => handleGeneralChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Toggles */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Management</CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(featureToggles).map(([key, value]) => {
                  const featureInfo: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
                    chatEnabled: { 
                      label: 'Chat', 
                      description: 'Enable real-time messaging between users',
                      icon: <MessageSquare className="w-5 h-5" />
                    },
                    feedEnabled: { 
                      label: 'Social Feed', 
                      description: 'Allow users to post updates and share content',
                      icon: <FileText className="w-5 h-5" />
                    },
                    gamificationEnabled: { 
                      label: 'Gamification', 
                      description: 'Points, badges, and leaderboards',
                      icon: <Zap className="w-5 h-5" />
                    },
                    aiRecommendations: { 
                      label: 'AI Recommendations', 
                      description: 'Personalized event suggestions',
                      icon: <Zap className="w-5 h-5" />
                    },
                    networkingEnabled: { 
                      label: 'Networking', 
                      description: 'Connection requests and matchmaking',
                      icon: <Users className="w-5 h-5" />
                    },
                    certificatesEnabled: { 
                      label: 'Certificates', 
                      description: 'Generate attendance certificates',
                      icon: <FileText className="w-5 h-5" />
                    },
                    analyticsEnabled: { 
                      label: 'Analytics', 
                      description: 'Event and user analytics',
                      icon: <Eye className="w-5 h-5" />
                    },
                    notificationsEnabled: { 
                      label: 'Notifications', 
                      description: 'Push and email notifications',
                      icon: <Bell className="w-5 h-5" />
                    },
                    checkInEnabled: { 
                      label: 'Check-In', 
                      description: 'QR code check-in for events',
                      icon: <CheckCircle2 className="w-5 h-5" />
                    },
                    ticketingEnabled: { 
                      label: 'Ticketing', 
                      description: 'Paid tickets and registration',
                      icon: <Calendar className="w-5 h-5" />
                    }
                  };

                  const info = featureInfo[key];
                  return (
                    <div 
                      key={key}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {info.icon}
                        </div>
                        <div>
                          <p className="font-medium">{info.label}</p>
                          <p className="text-sm text-muted-foreground">{info.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={() => handleToggleFeature(key as keyof FeatureToggles)}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how notifications are sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Notification Channels</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>Email Notifications</span>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        <span>Push Notifications</span>
                      </div>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span>SMS Notifications</span>
                        <Badge variant="secondary">Premium</Badge>
                      </div>
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => handleNotificationChange('smsNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                        <span>System Alerts</span>
                      </div>
                      <Switch
                        checked={notificationSettings.systemAlerts}
                        onCheckedChange={(checked) => handleNotificationChange('systemAlerts', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Delivery Settings</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Digest Frequency</Label>
                      <Select 
                        value={notificationSettings.digestFrequency}
                        onValueChange={(value: any) => handleNotificationChange('digestFrequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">Real-time</SelectItem>
                          <SelectItem value="hourly">Hourly Digest</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Digest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quiet Hours</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="time"
                          value={notificationSettings.quietHoursStart}
                          onChange={(e) => handleNotificationChange('quietHoursStart', e.target.value)}
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={notificationSettings.quietHoursEnd}
                          onChange={(e) => handleNotificationChange('quietHoursEnd', e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        No notifications will be sent during quiet hours
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure authentication and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Authentication</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Email Verification</p>
                        <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                      </div>
                      <Switch
                        checked={securitySettings.requireEmailVerification}
                        onCheckedChange={(checked) => handleSecurityChange('requireEmailVerification', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                      </div>
                      <Switch
                        checked={securitySettings.twoFactorEnabled}
                        onCheckedChange={(checked) => handleSecurityChange('twoFactorEnabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Social Login</p>
                        <p className="text-sm text-muted-foreground">Allow Google/Microsoft login</p>
                      </div>
                      <Switch
                        checked={securitySettings.allowSocialLogin}
                        onCheckedChange={(checked) => handleSecurityChange('allowSocialLogin', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Guest Access</p>
                        <p className="text-sm text-muted-foreground">Allow viewing without account</p>
                      </div>
                      <Switch
                        checked={securitySettings.allowGuestAccess}
                        onCheckedChange={(checked) => handleSecurityChange('allowGuestAccess', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Session & Password</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Session Timeout (minutes)</Label>
                      <Input
                        type="number"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                        min={5}
                        max={1440}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Login Attempts</Label>
                      <Input
                        type="number"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => handleSecurityChange('maxLoginAttempts', parseInt(e.target.value))}
                        min={3}
                        max={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Password Length</Label>
                      <Input
                        type="number"
                        value={securitySettings.passwordMinLength}
                        onChange={(e) => handleSecurityChange('passwordMinLength', parseInt(e.target.value))}
                        min={6}
                        max={20}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Require Special Characters</Label>
                      <Switch
                        checked={securitySettings.requireSpecialChars}
                        onCheckedChange={(checked) => handleSecurityChange('requireSpecialChars', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Require Numbers</Label>
                      <Switch
                        checked={securitySettings.requireNumbers}
                        onCheckedChange={(checked) => handleSecurityChange('requireNumbers', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Customize automated email content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="welcomeEmail">Welcome Email</Label>
                  <Textarea
                    id="welcomeEmail"
                    value={emailTemplates.welcomeEmail}
                    onChange={(e) => {
                      setEmailTemplates(prev => ({ ...prev, welcomeEmail: e.target.value }));
                      setHasChanges(true);
                    }}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: {`{{userName}}, {{verificationLink}}`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventReminder">Event Reminder</Label>
                  <Textarea
                    id="eventReminder"
                    value={emailTemplates.eventReminder}
                    onChange={(e) => {
                      setEmailTemplates(prev => ({ ...prev, eventReminder: e.target.value }));
                      setHasChanges(true);
                    }}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: {`{{eventName}}, {{timeUntil}}, {{eventLink}}, {{location}}`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordReset">Password Reset</Label>
                  <Textarea
                    id="passwordReset"
                    value={emailTemplates.passwordReset}
                    onChange={(e) => {
                      setEmailTemplates(prev => ({ ...prev, passwordReset: e.target.value }));
                      setHasChanges(true);
                    }}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: {`{{userName}}, {{resetLink}}, {{expiryTime}}`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificateReady">Certificate Ready</Label>
                  <Textarea
                    id="certificateReady"
                    value={emailTemplates.certificateReady}
                    onChange={(e) => {
                      setEmailTemplates(prev => ({ ...prev, certificateReady: e.target.value }));
                      setHasChanges(true);
                    }}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: {`{{userName}}, {{eventName}}, {{downloadLink}}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API access for integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Public Key</Label>
                  <div className="flex gap-2">
                    <Input value={apiKeys.publicKey} readOnly className="font-mono" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiKeys.publicKey)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this key for client-side integrations
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={showSecretKey ? apiKeys.secretKey : '••••••••••••••••••••••••••••••••'} 
                      readOnly 
                      className="font-mono" 
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setShowSecretKey(!showSecretKey)}
                    >
                      {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => copyToClipboard(apiKeys.secretKey)}
                      disabled={!showSecretKey}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep this key secret. Use only for server-side integrations.
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Secret Key
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Regenerate Secret Key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will invalidate your current secret key. All integrations using the old key will stop working.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={regenerateApiKey}>Regenerate</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">API Documentation</h4>
                <Button variant="outline" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View API Documentation
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card className={maintenanceSettings.maintenanceMode ? 'border-red-500' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {maintenanceSettings.maintenanceMode && (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                Maintenance Mode
              </CardTitle>
              <CardDescription>
                Control platform availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    {maintenanceSettings.maintenanceMode 
                      ? 'Platform is currently in maintenance mode. Only admins can access.'
                      : 'Platform is running normally.'}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Switch checked={maintenanceSettings.maintenanceMode} />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {maintenanceSettings.maintenanceMode 
                          ? 'Disable Maintenance Mode?' 
                          : 'Enable Maintenance Mode?'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {maintenanceSettings.maintenanceMode 
                          ? 'The platform will become accessible to all users again.'
                          : 'All users will be logged out and only admins will be able to access the platform.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => {
                        setMaintenanceSettings(prev => ({ 
                          ...prev, 
                          maintenanceMode: !prev.maintenanceMode 
                        }));
                        setHasChanges(true);
                      }}>
                        {maintenanceSettings.maintenanceMode ? 'Disable' : 'Enable'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="space-y-2">
                <Label>Maintenance Message</Label>
                <Textarea
                  value={maintenanceSettings.maintenanceMessage}
                  onChange={(e) => {
                    setMaintenanceSettings(prev => ({ ...prev, maintenanceMessage: e.target.value }));
                    setHasChanges(true);
                  }}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Database Backup</h4>
                  <div className="space-y-2">
                    <Label>Backup Frequency</Label>
                    <Select 
                      value={maintenanceSettings.backupFrequency}
                      onValueChange={(value: any) => {
                        setMaintenanceSettings(prev => ({ ...prev, backupFrequency: value }));
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Last backup:</p>
                    <p className="font-medium">{maintenanceSettings.lastBackup.toLocaleString()}</p>
                  </div>
                  <Button variant="outline" onClick={triggerBackup}>
                    <Database className="w-4 h-4 mr-2" />
                    Backup Now
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Data Management</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Export All Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full justify-start">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear Cache
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear Cache?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will clear all cached data. Users may experience slower load times temporarily.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => {
                            toast({
                              title: 'Cache Cleared',
                              description: 'All cached data has been cleared.'
                            });
                          }}>
                            Clear Cache
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
