import { db } from '@/lib/db';
import { events, feedbackTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { DynamicFeedbackForm } from '@/features/events/dynamic-feedback-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Event Feedback | Eventra',
  description: 'Share your thoughts about the event.',
};

export default async function FeedbackPage({ params }: { params: { eventId: string } }) {
  const { eventId } = params;

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    with: {
      feedbackTemplate: true
    }
  });

  if (!event) notFound();

  // Use linked template or default
  const template = event.feedbackTemplate || {
    title: `Feedback for ${event.title}`,
    description: 'Thank you for attending! Please help us improve by sharing your experience.',
    questions: [
      { id: 'q1', type: 'rating', label: 'Overall Experience', required: true },
      { id: 'q2', type: 'text', label: 'What did you like most?', required: false },
      { id: 'q3', type: 'text', label: 'Any areas for improvement?', required: false }
    ]
  };

  return (
    <div className="container py-12">
      <DynamicFeedbackForm 
        eventId={eventId} 
        template={template as any} 
      />
    </div>
  );
}
