'use client';
import Header from '@/components/layout/header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-[0.35]" />
      <div className="absolute inset-0 aurora" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
