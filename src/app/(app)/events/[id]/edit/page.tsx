'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { EventForm } from '@/components/events/event-form';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { use } from 'react';

export default function EventEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const event = useQuery(api.events.getById, { id: id as any });
  const updateEvent = useMutation(api.events.update);

  if (event === undefined) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
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

  const isOrganizer = user && (user._id === event.organizerId || user.role === 'admin');

  if (!isOrganizer) {
    return (
      <div className="container py-16 text-center text-white">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="text-gray-400 mt-2">You can only edit events you organize.</p>
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
    <div className="container py-8 max-w-2xl text-white">
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/events/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Edit Event</h1>
          <p className="text-gray-400 mt-1">Update your event details</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <EventForm
          onSave={handleSave}
          event={{
            ...event,
            id: event._id,
          } as any}
        />
      </div>
    </div>
  );
}
