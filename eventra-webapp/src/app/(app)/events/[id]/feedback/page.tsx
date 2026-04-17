import { getEventById } from '@/app/actions/events';
import { getFeedbackTemplates } from '@/app/actions/feedback';
import { FeedbackSubmissionForm } from '@/features/feedback/feedback-submission-form';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';

export default async function EventFeedbackPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return <div>Please login to submit feedback.</div>;

  const event = await getEventById(params.id);
  if (!event) notFound();

  const templates = await getFeedbackTemplates(params.id);
  // Use event-specific template or a default one
  const template = templates.find(t => t.eventId === params.id) || templates[0] || {
    title: "Event Feedback",
    description: "Please share your thoughts with us.",
    questions: []
  };

  return (
    <div className="container py-12">
      <FeedbackSubmissionForm 
        eventId={params.id} 
        eventTitle={event.title} 
        template={template as any} 
      />
    </div>
  );
}
