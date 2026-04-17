'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center text-center px-4 bg-background text-white">
          <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-purple-600 rounded-md hover:bg-purple-500 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
