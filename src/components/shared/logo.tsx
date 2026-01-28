import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group" aria-label="EventOS Home">
      <div className="relative">
        <Sparkles className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <span className="text-lg font-semibold font-headline gradient-text">
        EventOS
      </span>
    </Link>
  );
}
