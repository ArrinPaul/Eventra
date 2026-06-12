'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import LandingPage from '@/features/home/landing-page';
import DashboardClient from '@/features/dashboard/dashboard-client';
import { testDbConnection } from '@/lib/db/test-connection';

export default function Page() {
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      testDbConnection();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-notion-canvas-soft">
        <div className="flex flex-col items-center gap-4">
           <div className="w-10 h-10 rounded-full border-2 border-notion-hairline border-t-notion-primary animate-spin" />
           <p className="text-body-sm text-notion-ink-muted">Syncing workspace...</p>
        </div>
      </div>
    );
  }

  // Show landing page for guests
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-notion-canvas-soft flex">
      <Sidebar />
      <main className="flex-1 ml-[64px] md:ml-[240px] transition-[margin] duration-300 min-h-screen">
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
          <DashboardClient />
        </div>
      </main>
    </div>
  );
}
