import { getEventById } from '@/app/actions/events';
import { MediaModerationClient } from '@/features/organizer/media-moderation-client';
import { notFound } from 'next/navigation';

export default async function EventMediaModerationPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await getEventById(eventId);
  if (!event) notFound();

  return (
    <div className="container py-8">
      <MediaModerationClient 
        eventId={eventId} 
        eventTitle={event.title} 
      />
    </div>
  );
}
