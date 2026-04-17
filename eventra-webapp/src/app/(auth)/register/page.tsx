'use client';

import { RegisterWizard } from '@/features/auth/register-wizard';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      {/* Subtle Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl mx-auto relative z-10">
        <div className="text-center mb-8 space-y-3">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Join Eventra</h1>
          <p className="text-muted-foreground">Create your account and start exploring events.</p>
        </div>

        <RegisterWizard />
      </div>
    </div>
  );
}
