'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <div className="relative isolate overflow-hidden h-[calc(100vh-4rem)]">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1F3A93] to-[#B48EAD] dark:from-[#5A67F2] dark:via-[#D6A6F1] dark:to-[#8B5CF6] opacity-20">
        <svg
          className="absolute inset-0 h-full w-full stroke-background/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
              width={200}
              height={200}
              x="50%"
              y={-1}
              patternUnits="userSpaceOnUse"
            >
              <path d="M.5 200V.5H200" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" strokeWidth={0} fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)" />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex items-center h-full">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            IPX Hub
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Your Intelligent Event Companion
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg" className="interactive-element bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
              <Link href="/register">
                Register Now
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="interactive-element shadow-lg">
              <Link href="/agenda">
                View Agenda <span aria-hidden="true">→</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
