import { Suspense } from 'react';
import { IssueManagement } from '@/features/events/issue-management';

export default async function IssuesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <div className="container max-w-4xl py-8">
        <IssueManagement eventId={id} isOrganizer={true} />
      </div>
    </Suspense>
  );
}
