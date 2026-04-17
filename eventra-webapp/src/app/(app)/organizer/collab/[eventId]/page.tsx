import { getEventById } from '@/app/actions/events';
import { CollabManagerClient } from '@/features/organizer/collab-manager-client';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ticketTiers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function EventCollabPage({ params }: { params: { eventId: string } }) {
  const event = await getEventById(params.eventId);
  if (!event) notFound();

  // Fetch tiers for guest import
  const tiers = await db.query.ticketTiers.findMany({
    where: eq(ticketTiers.eventId, params.eventId)
  });

  return (
    <div className="container py-8">
      <CollabManagerClient 
        eventId={params.eventId} 
        eventTitle={event.title} 
        ticketTiers={tiers} 
      />
    </div>
  );
}
