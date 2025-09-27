import { Box } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="IPX Hub Home">
      <Box className="h-6 w-6 text-primary" />
      <span className="text-lg font-semibold font-headline text-foreground">
        IPX Hub
      </span>
    </Link>
  );
}
