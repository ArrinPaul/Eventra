import { getEventById } from '@/app/actions/events';
import { getFeedbackTemplates } from '@/app/actions/feedback';
import { FeedbackSubmissionForm } from '@/features/feedback/feedback-submission-form';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';

export default async function EventFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return <div>Please login to submit feedback.</div>;

  const event = await getEventById(id);
  if (!event) notFound();

  const templates = await getFeedbackTemplates(id);
  // Use event-specific template or a default one
  const template = templates.find(t => t.eventId === id) || templates[0] || {
    title: "Event Feedback",
    description: "Please share your thoughts with us.",
    questions: []
  };

  return (
    <div className="container py-12">
      <FeedbackSubmissionForm 
        eventId={id} 
        eventTitle={event.title} 
        template={template as any} 
      />
    </div>
  );
}
