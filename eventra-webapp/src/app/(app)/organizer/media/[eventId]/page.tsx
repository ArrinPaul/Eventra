import { getEventById } from '@/app/actions/events';
import { MediaModerationClient } from '@/features/organizer/media-moderation-client';
import { notFound } from 'next/navigation';

export default async function EventMediaModerationPage({ params }: { params: { eventId: string } }) {
  const event = await getEventById(params.eventId);
  if (!event) notFound();

  return (
    <div className="container py-8">
      <MediaModerationClient 
        eventId={params.eventId} 
        eventTitle={event.title} 
      />
    </div>
  );
}
