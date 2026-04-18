'use client';
// 
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bell, Info, AlertCircle, Trash2, Loader2, Megaphone, Pencil } from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { createAnnouncement, deactivateAnnouncement, listAnnouncements, updateAnnouncement } from '@/app/actions/organizer-tools';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export function AnnouncementManager({ eventId }: { eventId: string }) {
  const { toast } = useToast();
  const t = useTranslations('Phase2I18n.announcement');
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [content, setContent] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'urgent'>('info');
  const [expiresHours, setExpiresHours] = useState('24');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const rows = await listAnnouncements(eventId);
      if (!mounted) return;
      setAnnouncements(
        rows.filter((r) => r.active).map((r) => ({ _id: r.id, content: r.content, type: r.type, expiresAt: r.expiresAt }))
      );
    }

    load();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateAnnouncement({
          id: editingId as any,
          content,
          type,
          expiresHours: parseInt(expiresHours),
        });
        toast({ title: t('updated') });
      } else {
        await createAnnouncement({
          eventId: eventId as any,
          content,
          type,
          expiresHours: parseInt(expiresHours),
        });
        toast({ title: t('broadcasted') });
      }
      setContent('');
      setEditingId(null);
      const rows = await listAnnouncements(eventId);
      setAnnouncements(
        rows.filter((r) => r.active).map((r) => ({ _id: r.id, content: r.content, type: r.type, expiresAt: r.expiresAt }))
      );
    } catch (error) {
      toast({ title: editingId ? t('failedUpdate') : t('failedBroadcast'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (a: any) => {
    setEditingId(a._id);
    setContent(a.content);
    setType(a.type);
    if (a.expiresAt) {
      const hoursLeft = Math.max(1, Math.round((a.expiresAt - Date.now()) / (60 * 60 * 1000)));
      setExpiresHours(String(hoursLeft));
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateAnnouncement(id as any);
      toast({ title: t('removed') });
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch (error) {
      toast({ title: t('removeError'), variant: 'destructive' });
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-cyan-400" />
          {t('title')}
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs">
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content" className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('messageLabel')}</Label>
            <Textarea 
              id="content"
              placeholder={t('messagePlaceholder')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-white/5 border-white/10 resize-none h-20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('typeLabel')}</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white">
                  <SelectItem value="info">Info (Blue)</SelectItem>
                  <SelectItem value="warning">Warning (Yellow)</SelectItem>
                  <SelectItem value="urgent">Urgent (Red)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('durationLabel')}</Label>
              <Select value={expiresHours} onValueChange={setExpiresHours}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white">
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="4">4 Hours</SelectItem>
                  <SelectItem value="24">24 Hours</SelectItem>
                  <SelectItem value="168">1 Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-cyan-600 hover:bg-cyan-500" 
            disabled={isSubmitting || !content}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? t('updateAnnouncement') : t('broadcastNow'))}
          </Button>

          {editingId && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-white/10"
              onClick={() => {
                setEditingId(null);
                setContent('');
                setType('info');
                setExpiresHours('24');
              }}
            >
              {t('cancelEdit')}
            </Button>
          )}
        </form>

        {announcements && announcements.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('activeAnnouncements')}</Label>
            <div className="space-y-2">
              {announcements.map((a) => (
                <div 
                  key={a._id} 
                  className={cn(
                    "p-3 rounded-lg border text-xs flex justify-between items-start gap-3",
                    a.type === 'info' && "bg-cyan-500/5 border-cyan-500/10 text-cyan-200",
                    a.type === 'warning' && "bg-amber-500/5 border-amber-500/10 text-amber-200",
                    a.type === 'urgent' && "bg-red-500/5 border-red-500/10 text-red-200"
                  )}
                >
                  <div className="flex-1">
                    <p>{a.content}</p>
                    <p className="text-[9px] opacity-50 mt-1">
                      {t('expires')}: {a.expiresAt ? new Date(a.expiresAt).toLocaleString() : t('never')}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-50 hover:opacity-100 hover:bg-white/10"
                    onClick={() => handleEdit(a)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-50 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                    onClick={() => handleDeactivate(a._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


