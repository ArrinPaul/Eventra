'use client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { ErrorBoundary } from '@/components/shared/error-boundary';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-notion-canvas-soft">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-notion-hairline border-t-notion-primary animate-spin" />
          <p className="text-body-sm text-notion-ink-muted">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-notion-canvas-soft flex">
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      <main className="flex-1 ml-[64px] md:ml-[240px] transition-[margin] duration-300">
        <div className="p-4 md:p-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
