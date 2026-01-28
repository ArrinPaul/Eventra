import MyEventsClient from '@/components/events/my-events-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Events | EventOS',
  description: 'View and manage your registered events, past events, and wishlist.',
};

export default function MyEventsPage() {
  return <MyEventsClient />;
}

