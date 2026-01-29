import MyTicketsClient from '@/components/tickets/my-tickets-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Tickets | EventOS',
  description: 'View and manage your event tickets, check-in with QR codes.',
};

export default function TicketsPage() {
  return <MyTicketsClient />;
}
