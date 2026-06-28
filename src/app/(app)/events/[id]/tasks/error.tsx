'use client';

export default function Error({ error }: { error: Error }) {
  return (
    <div className="container py-8 text-center">
      <p className="text-destructive">Failed to load tasks: {error.message}</p>
    </div>
  );
}
