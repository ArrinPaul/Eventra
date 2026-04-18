'use client';
// 
import { useMemo, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Save,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { getSystemSettings, updateSystemSettings } from '@/app/actions/admin';
import { useTranslations } from 'next-intl';

export default function SystemSettings() {
  const { toast } = useToast();
  const t = useTranslations('Phase2I18n.systemSettings');
  
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [localChanges, setLocalChanges] = useState<Record<string, string>>({});
  
  const [settingsRaw, setSettingsRaw] = useState<any[] | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const settings = await getSystemSettings();
      if (!mounted) return;
      setSettingsRaw(Object.entries(settings).map(([key, value]) => ({ key, value: String(value) })));
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

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
          updateSystemSettings({ [key]: value === 'true' ? true : value === 'false' ? false : value } as any)
        )
      );
      const settings = await getSystemSettings();
      setSettingsRaw(Object.entries(settings).map(([key, value]) => ({ key, value: String(value) })));
      setLocalChanges({});
      toast({ title: t('settingsSaved') });
    } catch (e) {
      toast({ title: t('failedSave'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (settingsRaw === undefined) return <div className="flex items-center justify-center py-20"><RefreshCw className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-white">
        <div>
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges} className="bg-cyan-600">
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {t('saveChanges')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white/5 border-white/10 text-white">
          <TabsTrigger value="general" className="gap-2"><Settings className="w-4 h-4" /> {t('general')}</TabsTrigger>
          <TabsTrigger value="features" className="gap-2"><Zap className="w-4 h-4" /> {t('features')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader><CardTitle>{t('general')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('siteName')}</Label>
                <Input value={settings.siteName} onChange={e => handleUpdate('siteName', e.target.value)} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>{t('supportEmail')}</Label>
                <Input value={settings.supportEmail} onChange={e => handleUpdate('supportEmail', e.target.value)} className="bg-white/5 border-white/10" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader><CardTitle>{t('features')}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'chatEnabled', label: t('chatSystem') },
                { key: 'feedEnabled', label: t('communityFeed') },
                { key: 'gamificationEnabled', label: t('gamification') },
                { key: 'aiRecommendations', label: t('aiRecommendations') },
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

