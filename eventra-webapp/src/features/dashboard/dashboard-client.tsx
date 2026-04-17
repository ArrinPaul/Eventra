'use client';

import { useAuth } from '@/hooks/use-auth';
import OrganizerDashboard from '@/features/dashboard/organizer-dashboard-client';
import AttendeeDashboard from '@/features/dashboard/attendee-dashboard';
import { Loader2 } from 'lucide-react';

export default function DashboardClient() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (user.role === 'organizer' || user.role === 'admin') {
    return <OrganizerDashboard />;
  }

  return <AttendeeDashboard />;
}
