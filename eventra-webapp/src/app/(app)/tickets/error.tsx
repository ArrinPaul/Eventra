'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function TicketsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
      <h2 className="text-2xl font-bold mb-2">Tickets Error</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {error.message || 'Failed to load your tickets.'}
      </p>
      <Button onClick={reset} variant="outline">
        Try Again
      </Button>
    </div>
  );
}
