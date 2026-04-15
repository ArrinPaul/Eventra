import EventDetailsClient from '@/features/events/event-details-client';
import { getEventById } from '@/app/actions/events';
import { notFound } from 'next/navigation';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }
  
  return <EventDetailsClient initialEvent={event as any} eventId={id} />;
}
