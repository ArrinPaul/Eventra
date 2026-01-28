'use client';
import { useAuth } from '@/hooks/use-auth';
import DashboardClient from '@/components/dashboard/dashboard-client';
import LandingPage from '@/components/home/landing-page';
import Header from '@/components/layout/header';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show landing page for guests, dashboard for logged-in users
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <DashboardClient />
      </main>
    </div>
  );
}
