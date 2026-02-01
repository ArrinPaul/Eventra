'use client';

import { RegisterWizard } from '@/components/auth/register-wizard';

export default function RegisterPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden bg-background py-12 px-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-purple-500/20 blur-[100px] animate-pulse delay-1000" />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-30" />
      </div>

      <div className="w-full relative z-10">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight font-headline">Join EventOS</h1>
          <p className="text-muted-foreground text-lg">Start your journey with intelligent event management.</p>
        </div>
        
        <RegisterWizard />
      </div>
    </div>
  );
}