import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="container py-32 text-center">
      <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading AI Tools...</p>
    </div>
  );
}
