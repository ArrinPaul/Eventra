import { getEventById } from '@/app/actions/events';
import { getEventFeedbackAnalytics } from '@/app/actions/feedback';
import { FeedbackAnalyticsDashboard } from '@/features/feedback/feedback-analytics-dashboard';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default async function EventAnalyticsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await getEventById(eventId);
  if (!event) notFound();

  const analytics = await getEventFeedbackAnalytics(eventId);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/5">
          <Link href="/organizer/feedback">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-white">Back to Feedback Manager</h1>
      </div>
      
      <FeedbackAnalyticsDashboard 
        data={analytics as any} 
        eventTitle={event.title} 
      />
    </div>
  );
}
