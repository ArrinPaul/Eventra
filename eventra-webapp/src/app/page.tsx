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
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 rounded-2xl border-4 border-primary/10 border-t-primary animate-spin" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Mesh Initializing...</p>
        </div>
      </div>
    );
  }

  // Show landing page for guests
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-background flex premium-bg">
      <Sidebar />
      <main className="flex-1 ml-[80px] md:ml-[280px] transition-[margin] duration-300 mesh-glow min-h-screen">
        <div className="p-4 md:p-10 max-w-[1600px] mx-auto">
          <DashboardClient />
        </div>
      </main>
    </div>
  );
}
