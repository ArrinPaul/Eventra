'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Globe, Trash2, Loader2, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { cn } from '@/core/utils/utils';

export function WebhookManager({ eventId }: { eventId?: string }) {
  const { toast } = useToast();
  const webhooks = useQuery(api.webhooks.list) || [];
  const createWebhook = useMutation(api.webhooks.create);
  const deleteWebhook = useMutation(api.webhooks.deleteWebhook);
  const toggleActive = useMutation(api.webhooks.toggleActive);

  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['registration.created']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventOptions = [
    { id: 'registration.created', label: 'Registration Created' },
    { id: 'checkin.completed', label: 'Check-in Completed' },
    { id: 'event.cancelled', label: 'Event Cancelled' },
  ];

  const handleToggleEvent = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || selectedEvents.length === 0) return;

    setIsSubmitting(true);
    try {
      await createWebhook({
        url,
        events: selectedEvents as any,
        eventId: eventId as any,
      });
      setUrl('');
      toast({ title: 'Webhook created! 🔗' });
    } catch (error) {
      toast({ title: 'Failed to create webhook', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-cyan-400" />
          Webhooks
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs">
          Notify external systems (n8n, Zapier, etc.) when events happen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-xs font-bold uppercase tracking-wider text-gray-500">Target URL</Label>
            <Input 
              id="url"
              placeholder="https://your-endpoint.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-white/5 border-white/10"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Trigger Events</Label>
            <div className="grid grid-cols-1 gap-2">
              {eventOptions.map((opt) => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={opt.id} 
                    checked={selectedEvents.includes(opt.id)}
                    onCheckedChange={() => handleToggleEvent(opt.id)}
                  />
                  <label htmlFor={opt.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {opt.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-cyan-600 hover:bg-cyan-500" 
            disabled={isSubmitting || !url || selectedEvents.length === 0}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Webhook"}
          </Button>
        </form>

        {webhooks.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Your Webhooks</Label>
            <div className="space-y-2">
              {webhooks.map((w) => (
                <div key={w._id} className="p-3 rounded-lg border border-white/10 bg-white/5 text-xs">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="truncate font-mono text-cyan-400">{w.url}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-red-400 hover:bg-red-400/10"
                      onClick={() => deleteWebhook({ id: w._id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {w.events.map(e => (
                      <Badge key={e} variant="outline" className="text-[9px] py-0 border-white/10">{e}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500 pt-2 border-t border-white/5">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Secret: {w.secret.substring(0, 10)}...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
