'use client';
import Header from '@/components/layout/header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <div className="relative isolate overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1F3A93] to-[#B48EAD] dark:from-[#5A67F2] dark:via-[#D6A6F1] dark:to-[#8B5CF6] opacity-10"></div>
            {children}
        </div>
      </main>
    </div>
  );
}
