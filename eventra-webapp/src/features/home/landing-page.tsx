'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Calendar,
  Users,
  MapPin,
  ArrowRight,
  Search,
  Ticket,
  Zap,
  Globe,
  Shield,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  BarChart3,
  QrCode,
  MessageSquare,
  Layers,
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { motion } from 'framer-motion';
import Header from '@/components/layout/header';

/* ============================================================
   HERO
   ============================================================ */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-28 md:pb-32">
      <div className="absolute inset-0 aurora" />

      <div className="page-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center max-w-4xl mx-auto"
        >
          <Badge variant="outline" className="mb-7 gap-2 border-border bg-card/60 backdrop-blur-sm text-muted-foreground">
            <span className="status-dot bg-success" />
            Now in production · v2
          </Badge>

          <h1 className="font-display text-5xl md:text-6xl lg:text-[5.5rem] font-semibold tracking-tight mb-6 leading-[1.02] text-foreground">
            Run unforgettable events.
            <br />
            <span className="text-muted-foreground font-normal">End-to-end, effortlessly.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Ticketing, check-in, community, analytics and AI copilots — unified in one
            production-grade platform for organizers, attendees, and admins.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2" data-testid="hero-cta-primary">
              <Link href="/register">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto" data-testid="hero-cta-secondary">
              <Link href="/explore">
                <Search className="h-4 w-4" /> Browse events
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-0 w-full max-w-2xl border border-border rounded-2xl bg-card/50 backdrop-blur-sm divide-x divide-border overflow-hidden">
            {[
              { value: '10,000+', label: 'Attendees onboarded' },
              { value: '500+', label: 'Events delivered' },
              { value: '99.9%', label: 'Platform uptime' },
            ].map((s) => (
              <div key={s.label} className="px-4 py-5 md:py-6 text-center">
                <div className="text-xl md:text-3xl font-display font-semibold text-foreground">
                  {s.value}
                </div>
                <div className="mt-1 text-[11px] md:text-xs text-muted-foreground uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-14 max-w-3xl mx-auto"
        >
          <div className="relative">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-elevated">
              <div className="flex items-center flex-1 px-3">
                <Search className="h-4 w-4 text-muted-foreground mr-2" />
                <Input
                  placeholder="Search events, organizers, topics…"
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                  data-testid="hero-search-input"
                />
              </div>
              <Button size="default" asChild data-testid="hero-search-btn">
                <Link href="/explore">Search</Link>
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['All', 'Technology', 'Music', 'Business', 'Art', 'Education', 'Sports'].map((c, i) => (
                <Link
                  key={c}
                  href={`/explore?category=${c.toLowerCase()}`}
                  className={cn(
                    'rounded-full border px-3.5 py-1 text-xs font-medium transition-all duration-150',
                    i === 0
                      ? 'bg-primary/12 border-primary/30 text-primary'
                      : 'bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   FEATURED EVENTS
   ============================================================ */
type FeaturedEvent = {
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
  category: string;
  price: string;
  attendees: number;
};

function EventCard({ event, featured }: { event: FeaturedEvent; featured?: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all',
        featured && 'lg:col-span-2 lg:row-span-2'
      )}
      data-testid="event-card"
    >
      <div className={cn('relative overflow-hidden', featured ? 'h-64 md:h-80' : 'h-44')}>
        <Image
          src={event.image}
          alt={event.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-md text-foreground border border-border/60">
          {event.category}
        </Badge>
      </div>
      <div className="p-5">
        <h3
          className={cn(
            'font-display font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors',
            featured ? 'text-2xl' : 'text-base'
          )}
        >
          {event.title}
        </h3>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            {event.date} · {event.time}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {event.attendees} going
          </div>
          <div className="text-sm font-semibold text-foreground">
            {event.price === 'Free' ? (
              <span className="text-success">Free</span>
            ) : (
              event.price
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FeaturedEvents() {
  const events: FeaturedEvent[] = [
    {
      title: 'Tech Innovation Summit 2026',
      date: 'Feb 15, 2026',
      time: '9:00 AM',
      location: 'Main Auditorium, Tech Park',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      category: 'Technology',
      price: '₹499',
      attendees: 234,
    },
    {
      title: 'Music Festival Night',
      date: 'Feb 20, 2026',
      time: '6:00 PM',
      location: 'Open Air Theatre',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200',
      category: 'Music',
      price: '₹299',
      attendees: 512,
    },
    {
      title: 'Startup Pitch Competition',
      date: 'Feb 18, 2026',
      time: '10:00 AM',
      location: 'Business School',
      image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200',
      category: 'Business',
      price: 'Free',
      attendees: 89,
    },
    {
      title: 'Art & Design Workshop',
      date: 'Feb 22, 2026',
      time: '2:00 PM',
      location: 'Creative Studio',
      image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200',
      category: 'Art',
      price: '₹199',
      attendees: 45,
    },
    {
      title: 'Hackathon 2026',
      date: 'Feb 25, 2026',
      time: '8:00 AM',
      location: 'Engineering Block',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200',
      category: 'Technology',
      price: 'Free',
      attendees: 156,
    },
  ];

  return (
    <section className="py-20 md:py-24">
      <div className="page-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="section-eyebrow mb-3">Trending</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
              Featured events
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Hand-picked experiences happening right now. Don&apos;t miss out.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2" data-testid="landing-view-all">
            <Link href="/explore">
              View all events <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event, i) => (
            <EventCard key={event.title} event={event} featured={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FEATURES
   ============================================================ */
function Features() {
  const features = [
    { icon: Ticket, title: 'Smart ticketing', text: 'QR-based tickets with HMAC integrity, offline verification & instant resale controls.' },
    { icon: QrCode, title: 'Check-in that just works', text: 'Full-screen scanner with animated success/error states and offline attendee cache.' },
    { icon: BarChart3, title: 'Real-time analytics', text: 'Attendance velocity, revenue, NPS and sentiment — updated live.' },
    { icon: Sparkles, title: 'AI copilots', text: 'Marketing copy, after-action reports, event task lists — all powered by Genkit.' },
    { icon: MessageSquare, title: 'Community & chat', text: 'Built-in event spaces, 1:1 and group chat, moderation & reactions.' },
    { icon: Shield, title: 'Enterprise RBAC', text: 'Granular organizer/staff/attendee roles with per-event overrides.' },
    { icon: Layers, title: 'Certificates & exports', text: 'Drag-and-drop cert builder, PDF/ZIP bulk distribution, CSV exports.' },
    { icon: Globe, title: 'Localized', text: 'English & Spanish out of the box, ready for more.' },
  ];

  return (
    <section className="py-20 md:py-24 bg-muted/30 border-y border-border">
      <div className="page-container">
        <div className="max-w-2xl mb-14">
          <div className="section-eyebrow mb-3">Product</div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Everything for the full event lifecycle
          </h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            From the moment you open registration to the post-event retrospective,
            Eventra covers every step — so your team can focus on the moments, not the plumbing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 shadow-soft"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   METRICS STRIP
   ============================================================ */
function MetricsStrip() {
  const items = [
    { label: 'Avg. check-in time', value: '1.2s' },
    { label: 'NPS across events', value: '72' },
    { label: 'Offline scan accuracy', value: '100%' },
    { label: 'Languages supported', value: '2' },
  ];
  return (
    <section className="py-12">
      <div className="page-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border">
          {items.map((item) => (
            <div key={item.label} className="bg-background p-6 md:p-7">
              <div className="text-3xl md:text-4xl font-display font-semibold text-foreground tracking-tight">
                {item.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1 uppercase tracking-wide">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CTA
   ============================================================ */
function CTA() {
  return (
    <section className="py-20">
      <div className="page-container">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 md:p-16 shadow-soft">
          <div className="relative z-10 max-w-2xl">
            <Badge variant="default" className="mb-5">
              <Sparkles className="h-3 w-3 mr-1" /> Free to start
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground">
              Ready to run your next event
              <br className="hidden md:block" />
              <span className="text-muted-foreground font-normal">with Eventra?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Create your first event in under two minutes. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/register" data-testid="cta-register">
                  Start for free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/explore" data-testid="cta-explore">
                  Explore events
                </Link>
              </Button>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {['No credit card', 'Unlimited attendees in trial', 'Cancel anytime'].map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  const groups: Record<string, string[]> = {
    Product: ['Features', 'Pricing', 'Integrations', 'Changelog'],
    Company: ['About', 'Blog', 'Careers', 'Contact'],
    Resources: ['Documentation', 'Help center', 'Community', 'Status'],
    Legal: ['Privacy', 'Terms', 'Cookies', 'Licenses'],
  };

  return (
    <footer className="border-t border-border bg-background">
      <div className="page-container py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                <Calendar className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="font-display text-lg font-semibold">Eventra</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              The unified platform for creating, discovering, and running unforgettable events.
            </p>
          </div>

          {Object.entries(groups).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Eventra. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Status
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   LANDING PAGE
   ============================================================ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <FeaturedEvents />
        <Features />
        <MetricsStrip />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
