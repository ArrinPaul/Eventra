'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function LoginForm() {
  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 bg-white text-black hover:bg-gray-200 rounded-full text-lg"
        disabled
      >
        Sign in with Google (Temporarily Disabled)
      </Button>

      <p className="text-center text-xs text-gray-400">
        Google OAuth is temporarily disabled during testing.
      </p>

      <div className="text-center text-sm text-gray-400">
        New to Eventra?{' '}
        <Link href="/register" className="text-cyan-400 font-semibold hover:text-cyan-300">
          Create account
        </Link>
      </div>
    </div>
  );
}

