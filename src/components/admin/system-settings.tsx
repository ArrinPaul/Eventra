'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
  const settingsRaw = useQuery(api.admin.getSettings);
  const updateSettingMutation = useMutation(api.admin.updateSetting);
  
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [localChanges, setLocalChanges] = useState<Record<string, string>>({});

  const settings = useMemo(() => {
    const base: Record<string, string> = {
      siteName: 'Eventra',
      supportEmail: 'support@eventra.app',
      chatEnabled: 'true',
      feedEnabled: 'true',
      gamificationEnabled: 'true',
      aiRecommendations: 'true',
    };
    
    settingsRaw?.forEach(s => {
      base[s.key] = s.value;
    });
    
    return { ...base, ...localChanges };
  }, [settingsRaw, localChanges]);

  const hasChanges = Object.keys(localChanges).length > 0;

  const handleUpdate = (key: string, value: string) => {
    setLocalChanges(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(localChanges).map(([key, value]) => 
          updateSettingMutation({ key, value })
        )
      );
      setLocalChanges({});
      toast({ title: 'Settings Saved' });
    } catch (e) {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (settingsRaw === undefined) return <div className="flex items-center justify-center py-20"><RefreshCw className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-white">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">Manage platform configuration</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges} className="bg-cyan-600">
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
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
                <Input value={settings.siteName} onChange={e => handleUpdate('siteName', e.target.value)} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input value={settings.supportEmail} onChange={e => handleUpdate('supportEmail', e.target.value)} className="bg-white/5 border-white/10" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader><CardTitle>Features</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'chatEnabled', label: 'Chat System' },
                { key: 'feedEnabled', label: 'Community Feed' },
                { key: 'gamificationEnabled', label: 'Gamification (XP/Badges)' },
                { key: 'aiRecommendations', label: 'AI Recommendations' },
              ].map((f) => (
                <div key={f.key} className="flex items-center justify-between p-4 border border-white/10 rounded-lg">
                  <span>{f.label}</span>
                  <Switch 
                    checked={settings[f.key] === 'true'} 
                    onCheckedChange={v => handleUpdate(f.key, v.toString())} 
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useMemo } from 'react';