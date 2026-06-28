import { Suspense } from 'react';
import { EventUpdatesManager } from '@/features/organizer/event-updates-manager';

export default async function UpdatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <div className="container max-w-4xl py-8">
        <EventUpdatesManager eventId={id} />
      </div>
    </Suspense>
  );
}
