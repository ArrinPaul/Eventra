'use client';

import { EventForm } from '@/features/events/event-form';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { use } from 'react';
import { CoOrganizerManager } from '@/features/organizer/co-organizer-manager';
import { AnnouncementManager } from '@/features/organizer/announcement-manager';
import { WebhookManager } from '@/features/organizer/webhook-manager';
import { SocialPostGenerator } from '@/features/organizer/social-post-generator';
import { AttendancePredictor } from '@/features/organizer/attendance-predictor';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function EventEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // TODO: Fetch event from backend using id
  const event: any = null;
  const updateEvent = async (data: any) => {
    toast({ description: 'Update not yet implemented' });
  };

  if (event === undefined) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-16 text-center text-white">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/events">Back to Events</Link>
        </Button>
      </div>
    );
  }

  const isMainOrganizer = user && (user._id === event.organizerId || user.role === 'admin');
  const isCoOrganizer = user && event.coOrganizerIds?.includes(user._id);

  if (!isMainOrganizer && !isCoOrganizer) {
    return (
      <div className="container py-16 text-center text-white">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="text-muted-foreground mt-2">You can only edit events you organize.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/events/${id}`}>Back to Event</Link>
        </Button>
      </div>
    );
  }

  const handleSave = async (eventData: any) => {
    try {
      await updateEvent({
        id: event._id,
        updates: {
          title: eventData.title,
          description: eventData.description,
          startDate: typeof eventData.startDate === 'number' ? eventData.startDate : new Date(eventData.startDate).getTime(),
          endDate: typeof eventData.endDate === 'number' ? eventData.endDate : new Date(eventData.endDate).getTime(),
          location: eventData.location,
          type: eventData.type,
          category: eventData.category,
          capacity: eventData.capacity,
          status: eventData.status,
          targetAudience: eventData.targetAudience,
        },
      });
      toast({ title: 'Event updated successfully!' });
      router.push(`/events/${id}`);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto text-white">
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/events/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Manage Event</h1>
          <p className="text-muted-foreground mt-1">Configure event details and team members</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-muted/40 border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Event Details</h2>
            <EventForm
              onSave={handleSave}
              event={{
                ...event,
                id: event._id,
              } as any}
            />
          </div>
        </div>

        <div className="space-y-8">
          <AnnouncementManager eventId={event._id} />
          
          <AttendancePredictor eventId={event._id} />

          <SocialPostGenerator eventId={event._id} />

          <WebhookManager eventId={event._id} />

          {isMainOrganizer && (
            <CoOrganizerManager 
              eventId={event._id}
              organizerId={event.organizerId}
              coOrganizerIds={event.coOrganizerIds}
            />
          )}
          
          <Card className="bg-muted/40 border-border text-white">
            <CardHeader>
              <CardTitle className="text-lg">Event Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <Badge variant="outline" className="capitalize border-primary/30 text-primary">
                  {event.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                You can change the event status in the main form. Published events are visible to all users.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
