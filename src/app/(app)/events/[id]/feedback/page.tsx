'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { FeedbackForm } from '@/components/events/feedback-form';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EventFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const event = useQuery(api.events.getById, { id: eventId as any });

  if (event === undefined) return <div className="p-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-cyan-500" /></div>;
  if (!event) return <div className="p-20 text-center text-white">Event not found.</div>;

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-gray-400 hover:text-white">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event
      </Button>
      
      <FeedbackForm 
        eventId={event._id} 
        eventName={event.title} 
        schema={event.feedbackSchema as any}
        onSuccess={() => {
          setTimeout(() => router.push(`/events/${eventId}`), 3000);
        }}
      />
    </div>
  );
}
