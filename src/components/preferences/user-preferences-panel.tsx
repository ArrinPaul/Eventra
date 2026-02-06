'use client';

import React, { useState } from 'react';
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
  Users
} from 'lucide-react';

export default function UserPreferencesPanel() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy'>('notifications');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser({ preferencesUpdatedAt: Date.now() });
      toast({ title: 'Preferences Saved' });
    } catch (e) {
      toast({ title: 'Save Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold">Preferences</h2><p className="text-gray-400">Manage your account settings</p></div>
        <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" /> Save</Button>
      </div>

      <div className="flex gap-6">
        <Card className="w-64 h-fit bg-white/5 border-white/10 text-white">
          <CardContent className="p-4 space-y-2">
            <Button variant={activeTab === 'notifications' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('notifications')}><Bell className="w-4 h-4 mr-2" /> Notifications</Button>
            <Button variant={activeTab === 'privacy' ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('privacy')}><Settings className="w-4 h-4 mr-2" /> Privacy</Button>
          </CardContent>
        </Card>

        <div className="flex-1 space-y-6">
          {activeTab === 'notifications' && (
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader><CardTitle>Email Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><span>Enable Notifications</span><Switch checked /></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
