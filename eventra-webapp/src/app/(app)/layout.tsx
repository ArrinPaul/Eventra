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
          <p className="text-body-sm text-notion-ink-muted uppercase font-black tracking-widest text-[10px]">Syncing Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex overflow-x-hidden w-full">
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      <main className="flex-1 ml-[72px] md:ml-[260px] transition-[margin] duration-300 min-w-0">
        <div className="w-full max-w-[1600px] mx-auto p-6 md:p-10">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
