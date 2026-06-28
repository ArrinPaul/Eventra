'use client';

export default function Error({ error }: { error: Error }) {
  return (
    <div className="container max-w-4xl py-8 text-center">
      <p className="text-destructive">Failed to load report: {error.message}</p>
    </div>
  );
}
