import { Suspense } from 'react';
import { KanbanBoard } from '@/features/organizer/kanban-board';

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <div className="container py-8">
        <KanbanBoard eventId={id} />
      </div>
    </Suspense>
  );
}
