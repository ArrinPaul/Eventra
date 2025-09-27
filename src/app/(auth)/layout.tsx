'use client';
import Header from '@/components/layout/header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
