'use client';
import { useAuth } from '@/hooks/use-auth';
import DashboardClient from '@/features/dashboard/dashboard-client';
import LandingPage from '@/features/home/landing-page';
import Header from '@/components/layout/header';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <LandingPage />;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 pb-20">
        <DashboardClient />
      </main>
    </div>
  );
}
