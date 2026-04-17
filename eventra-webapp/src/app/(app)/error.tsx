'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-semibold mb-2 font-display">Something went wrong</h2>
      <p className="text-muted-foreground mb-6 max-w-md text-sm">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button onClick={reset} variant="default" className="gap-2" data-testid="error-retry">
        <RotateCw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
