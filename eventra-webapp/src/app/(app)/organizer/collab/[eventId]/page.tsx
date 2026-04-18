import { getEventById } from '@/app/actions/events';
import { CollabManagerClient } from '@/features/organizer/collab-manager-client';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ticketTiers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function EventCollabPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await getEventById(eventId);
  if (!event) notFound();

  // Fetch tiers for guest import
  const tiers = await db.query.ticketTiers.findMany({
    where: eq(ticketTiers.eventId, eventId)
  });

  return (
    <div className="container py-8">
      <CollabManagerClient 
        eventId={eventId} 
        eventTitle={event.title} 
        ticketTiers={tiers} 
      />
    </div>
  );
}
