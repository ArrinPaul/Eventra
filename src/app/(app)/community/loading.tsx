import { Loader2 } from 'lucide-react';

export default function CommunityLoading() {
  return (
    <div className="container py-8">
      <div className="h-10 w-48 bg-card rounded-lg animate-pulse mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-3">
            <div className="h-6 w-3/4 bg-card rounded animate-pulse" />
            <div className="h-4 w-full bg-card rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-card rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

