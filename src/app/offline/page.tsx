import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-cyan-500/10 p-6 rounded-full mb-6">
        <WifiOff className="h-12 w-12 text-cyan-400" />
      </div>
      <h1 className="text-3xl font-bold mb-4">You&apos;re Offline</h1>
      <p className="text-gray-400 max-w-md mb-8">
        It looks like you don&apos;t have an active internet connection. 
        Some features might be unavailable, but you can still view your cached data.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="bg-cyan-600 hover:bg-cyan-500">
          <Link href="/">Retry Connection</Link>
        </Button>
        <Button asChild variant="outline" className="border-white/10">
          <Link href="/my-events">View My Events</Link>
        </Button>
      </div>
    </div>
  );
}
