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

export function AnnouncementManager({ eventId }: { eventId: string }) {
  const { toast } = useToast();
  // TODO: wire to backend
  const announcements: any[] = [];
  const createAnnouncement = async (_args: any) => Promise.resolve();
  const updateAnnouncement = async (_args: any) => Promise.resolve();
  const deactivateAnnouncement = async (_args: any) => Promise.resolve();

  const [content, setContent] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'urgent'>('info');
  const [expiresHours, setExpiresHours] = useState('24');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
        toast({ title: 'Announcement updated' });
      } else {
        await createAnnouncement({
          eventId: eventId as any,
          content,
          type,
          expiresHours: parseInt(expiresHours),
        });
        toast({ title: 'Announcement broadcasted!' });
      }
      setContent('');
      setEditingId(null);
    } catch (error) {
      toast({ title: editingId ? 'Failed to update' : 'Failed to broadcast', variant: 'destructive' });
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
      await deactivateAnnouncement({ id: id as any });
      toast({ title: 'Announcement removed' });
    } catch (error) {
      toast({ title: 'Error removing announcement', variant: 'destructive' });
    }
  };

  return (
    <Card className="bg-muted/40 border-border text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Broadcast Announcements
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Send real-time banners to all attendees on the event page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</Label>
            <Textarea 
              id="content"
              placeholder="e.g. Workshop room changed to 304, or Starting in 10 minutes!"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-muted/40 border-border resize-none h-20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="bg-muted/40 border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-border text-white">
                  <SelectItem value="info">Info (Blue)</SelectItem>
                  <SelectItem value="warning">Warning (Yellow)</SelectItem>
                  <SelectItem value="urgent">Urgent (Red)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duration (Hours)</Label>
              <Select value={expiresHours} onValueChange={setExpiresHours}>
                <SelectTrigger className="bg-muted/40 border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-border text-white">
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
            className="w-full bg-primary hover:bg-primary" 
            disabled={isSubmitting || !content}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Update Announcement" : "Broadcast Now")}
          </Button>

          {editingId && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-border"
              onClick={() => {
                setEditingId(null);
                setContent('');
                setType('info');
                setExpiresHours('24');
              }}
            >
              Cancel Edit
            </Button>
          )}
        </form>

        {announcements && announcements.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Announcements</Label>
            <div className="space-y-2">
              {announcements.map((a) => (
                <div 
                  key={a._id} 
                  className={cn(
                    "p-3 rounded-lg border text-xs flex justify-between items-start gap-3",
                    a.type === 'info' && "bg-primary/10 border-primary/20 text-primary",
                    a.type === 'warning' && "bg-amber-500/5 border-amber-500/10 text-amber-200",
                    a.type === 'urgent' && "bg-red-500/5 border-red-500/10 text-red-200"
                  )}
                >
                  <div className="flex-1">
                    <p>{a.content}</p>
                    <p className="text-[9px] opacity-50 mt-1">
                      Expires: {a.expiresAt ? new Date(a.expiresAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-50 hover:opacity-100 hover:bg-muted"
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


