'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <div className="relative isolate overflow-hidden h-[calc(100vh-4rem)]">
       <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(theme(colors.primary/0.1)_1px,transparent_1px)] [background-size:16px_16px]"></div>
       <div
          className="absolute inset-x-0 top-0 -z-10 h-full bg-gradient-to-b from-primary/10 to-transparent"
        ></div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex items-center h-full">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
            IPX Hub
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Your Intelligent Event Companion.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-4">
            <Button asChild size="lg" className="interactive-element">
              <Link href="/register">
                Register Now
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="interactive-element">
              <Link href="/agenda">
                View Agenda
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
