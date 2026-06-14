import AgendaClient from '@/features/agenda/agenda-client';
import { getEvents } from '@/app/actions/events';

export default async function AgendaPage() {
  const events = await getEvents({ limit: 100 });
  return <AgendaClient initialEvents={events} />;
}
