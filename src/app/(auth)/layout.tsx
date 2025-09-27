'use client';
import Header from '@/components/layout/header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <div className="relative isolate overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] dark:from-[#3B82F6] dark:via-[#C084FC] dark:to-[#6366F1] opacity-10"></div>
            {children}
        </div>
      </main>
    </div>
  );
}
