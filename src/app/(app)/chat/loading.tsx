import { Loader2 } from 'lucide-react';

export default function ChatLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500 mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading chat...</p>
      </div>
    </div>
  );
}
