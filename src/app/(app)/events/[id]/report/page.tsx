import { Suspense } from 'react';
import { ReportGenerator } from '@/features/organizer/report-generator';

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <div className="container max-w-4xl py-8">
        <ReportGenerator eventId={id} />
      </div>
    </Suspense>
  );
}
