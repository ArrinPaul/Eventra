'use client';

import { EventForm } from '@/features/events/event-form';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { use, useState, useEffect } from 'react';
import { CoOrganizerManager } from '@/features/organizer/co-organizer-manager';
import { AnnouncementManager } from '@/features/organizer/announcement-manager';
import { WebhookManager } from '@/features/organizer/webhook-manager';
import { SocialPostGenerator } from '@/features/organizer/social-post-generator';
import { AttendancePredictor } from '@/features/organizer/attendance-predictor';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getEventById, updateEvent } from '@/app/actions/events';

export default function EventEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      const data = await getEventById(id);
      setEvent(data);
      setLoading(false);
    }
    loadEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-16 text-center text-foreground">
        <h1 className="text-4xl font-black font-headline">Event not found</h1>
        <Button asChild variant="outline" className="mt-8 rounded-2xl border-2 px-8 font-bold">
          <Link href="/explore">Back to Explore</Link>
        </Button>
      </div>
    );
  }

  const isMainOrganizer = user && (user.id === event.organizerId || user.role === 'admin');
  const isCoOrganizer = user && event.coOrganizerIds?.includes(user.id);

  if (!isMainOrganizer && !isCoOrganizer) {
    return (
      <div className="container py-16 text-center text-foreground">
        <h1 className="text-4xl font-black font-headline">Unauthorized</h1>
        <p className="text-muted-foreground mt-4 font-medium">You can only edit events you organize.</p>
        <Button asChild variant="outline" className="mt-8 rounded-2xl border-2 px-8 font-bold">
          <Link href={`/events/${id}`}>Back to Event</Link>
        </Button>
      </div>
    );
  }

  const handleSave = async (eventData: any) => {
    try {
      const result = await updateEvent(id, eventData);
      if (result.success) {
        toast({ title: 'Event updated successfully!' });
        router.push(`/events/${id}`);
      } else {
        toast({ title: 'Error', description: String(result.error), variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="container py-12 max-w-7xl mx-auto text-foreground">
      <div className="flex items-center gap-6 mb-12">
        <Button asChild variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2">
          <Link href={`/events/${id}`}>
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tighter">Manage Event</h1>
          <p className="text-muted-foreground font-medium mt-1">Configure event details and collaboration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <Card className="bg-card border-border/50 rounded-[2.5rem] shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/[0.02] border-b border-border/50 p-8">
              <h2 className="text-2xl font-black font-headline">Event Configuration</h2>
            </CardHeader>
            <CardContent className="p-8">
              <EventForm
                onSave={handleSave}
                event={event}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <AnnouncementManager eventId={event.id} />
          
          <AttendancePredictor eventId={event.id} />

          <SocialPostGenerator eventId={event.id} />

          {isMainOrganizer && (
            <CoOrganizerManager 
              eventId={event.id}
              organizerId={event.organizerId}
              coOrganizerIds={event.coOrganizerIds}
            />
          )}
          
          <Card className="bg-card border-border/50 text-foreground rounded-[2rem] shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/[0.02] border-b border-border/50 p-6">
              <CardTitle className="text-lg font-black font-headline">Visibility & Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Current Status</span>
                <Badge variant="outline" className="capitalize border-primary/40 text-primary font-black px-3 py-1">
                  {event.status}
                </Badge>
              </div>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                Published events are visible to all users. Drafts are only visible to the organizer team.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
