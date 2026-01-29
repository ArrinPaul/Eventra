import { Metadata } from 'next';
import OrganizerAnalyticsDashboard from '@/components/analytics/organizer-analytics-dashboard';

export const metadata: Metadata = {
  title: 'Organizer Analytics | EventOS',
  description: 'Track your event performance, registration funnels, demographics, and revenue'
};

export default function OrganizerAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OrganizerAnalyticsDashboard />
    </div>
  );
}
