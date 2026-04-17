import { Loader2 } from 'lucide-react';

export default function EventsLoading() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="h-10 w-48 bg-muted/40 rounded-lg animate-pulse mb-4" />
        <div className="h-5 w-80 bg-muted/40 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-muted/40 border border-border rounded-xl overflow-hidden">
            <div className="h-40 bg-muted/40 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-muted/40 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted/40 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-muted/40 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

