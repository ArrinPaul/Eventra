import EventDetailsClient from '@/components/events/event-details-client';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return <EventDetailsClient eventId={id} />;
}
