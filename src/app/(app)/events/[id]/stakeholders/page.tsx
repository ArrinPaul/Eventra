import { Suspense } from 'react';
import { StakeholderManager } from '@/features/organizer/stakeholder-manager';

export default async function StakeholdersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <div className="container max-w-4xl py-8">
        <StakeholderManager eventId={id} />
      </div>
    </Suspense>
  );
}
