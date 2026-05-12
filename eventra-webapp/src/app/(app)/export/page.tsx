import ExportFunctionality from '@/features/export/export-functionality';
import { getEvents } from '@/app/actions/events';
import { getUserRegistrations } from '@/app/actions/registrations';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ExportPage() {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  const [events, registrations] = await Promise.all([
    getEvents({ organizerId: userId, limit: 1000 }),
    getUserRegistrations()
  ]);

  return (
    <div className="container py-12">
      <ExportFunctionality initialEvents={events} initialTickets={registrations} />
    </div>
  );
}
