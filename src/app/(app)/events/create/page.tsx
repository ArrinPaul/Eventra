// @ts-nocheck
import EventCreationWizard from '@/features/events/event-creation-wizard';

export const metadata = {
  title: 'Create Event | Eventra',
  description: 'Create a new event with our AI-powered wizard.',
};

export default function CreateEventPage() {
  return <EventCreationWizard />;
}

