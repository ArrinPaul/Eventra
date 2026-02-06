'use client';

import React, { useState } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Bell,
  Mail,
  Shield,
  Save,
  RefreshCw,
  Zap,
  Server,
  Key,
} from 'lucide-react';

export default function SystemSettings() {
  const { toast } = useToast();
  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  // Settings state (Local only for now)
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Eventra',
    siteDescription: 'Intelligent Event Management Platform',
    supportEmail: 'support@eventra.app',
    timezone: 'UTC',
    language: 'en',
  });

  const [featureToggles, setFeatureToggles] = useState({
    chatEnabled: true,
    feedEnabled: true,
    gamificationEnabled: true,
    aiRecommendations: true,
  });

  const handleSave = async () => {
    setSaving(true);
    // Placeholder for Convex settings mutation
    setTimeout(() => {
      setSaving(false);
      setHasChanges(false);
      toast({ title: 'Settings Saved' });
    }, 1000);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-white">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">Manage platform configuration</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          <Save className="w-4 h-4 mr-2" /> Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white/5 border-white/10 text-white">
          <TabsTrigger value="general" className="gap-2"><Settings className="w-4 h-4" /> General</TabsTrigger>
          <TabsTrigger value="features" className="gap-2"><Zap className="w-4 h-4" /> Features</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader><CardTitle>General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Site Name</Label>
                <Input value={generalSettings.siteName} onChange={e => { setGeneralSettings({...generalSettings, siteName: e.target.value}); setHasChanges(true); }} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input value={generalSettings.supportEmail} onChange={e => { setGeneralSettings({...generalSettings, supportEmail: e.target.value}); setHasChanges(true); }} className="bg-white/5 border-white/10" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader><CardTitle>Features</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(featureToggles).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 border border-white/10 rounded-lg">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <Switch checked={value} onCheckedChange={v => { setFeatureToggles({...featureToggles, [key]: v}); setHasChanges(true); }} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}