import EventCreationWizard from '@/components/events/event-creation-wizard';

export const metadata = {
  title: 'Create Event | EventOS',
  description: 'Create a new event with our AI-powered wizard.',
};

export default function CreateEventPage() {
  return <EventCreationWizard />;
}
