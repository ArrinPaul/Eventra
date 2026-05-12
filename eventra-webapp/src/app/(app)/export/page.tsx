import ExportFunctionality from '@/features/export/export-functionality';
import { getEvents } from '@/app/actions/events';
import { getUserRegistrations } from '@/app/actions/registrations';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ExportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [events, registrations] = await Promise.all([
    getEvents({ organizerId: session.user.id, limit: 1000 }),
    getUserRegistrations()
  ]);

  return (
    <div className="container py-12">
      <ExportFunctionality initialEvents={events} initialTickets={registrations} />
    </div>
  );
}
