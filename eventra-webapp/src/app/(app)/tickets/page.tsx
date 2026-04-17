import MyTicketsClient from '@/features/ticketing/my-tickets-client';
import { Metadata } from 'next';
import { getUserRegistrations } from '@/app/actions/registrations';
import { refreshTicketStatuses } from '@/app/actions/tickets';

export const metadata: Metadata = {
  title: 'My Tickets | Eventra',
  description: 'View and manage your event tickets, check-in with QR codes.',
};

export default async function TicketsPage() {
  // Refresh statuses before showing to ensure 'expired' is accurate
  await refreshTicketStatuses();
  
  const tickets = await getUserRegistrations();
  
  return <MyTicketsClient initialTickets={tickets} />;
}

