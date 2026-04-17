import { getEventById } from '@/app/actions/events';
import { processWaitlistReservations } from '@/app/actions/registrations';
import { WaitlistClaimClient } from '@/features/events/waitlist-claim-client';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { waitlist } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export default async function ClaimWaitlistSpotPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // 1. Run cleanup for the event before checking
  await processWaitlistReservations(params.id);

  const event = await getEventById(params.id);
  if (!event) notFound();

  // 2. Check if user has a valid reservation
  const reservation = await db.query.waitlist.findFirst({
    where: and(
      eq(waitlist.eventId, params.id),
      eq(waitlist.userId, session.user.id!),
      eq(waitlist.status, 'reserved')
    )
  });

  if (!reservation) {
    return (
      <div className="container py-20 text-center text-white">
        <h1 className="text-2xl font-bold">No Reservation Found</h1>
        <p className="text-gray-400 mt-2">You don't have an active waitlist reservation for this event or it has already expired.</p>
      </div>
    );
  }

  return (
    <div className="container py-20">
      <WaitlistClaimClient 
        eventId={params.id} 
        eventTitle={event.title} 
        reservation={{ expiresAt: reservation.expiresAt! }} 
      />
    </div>
  );
}
