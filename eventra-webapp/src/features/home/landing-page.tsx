'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EventCard } from '@/features/events/event-card';
import { EventraEvent } from '@/types';
import {
  Calendar,
  Search,
  Users,
  MapPin,
  Sparkles,
  Zap,
  Globe,
  Trophy,
  MessageSquare,
  ShieldCheck,
  BarChart,
  ArrowRight
} from 'lucide-react';

const FADE_UP_VARIANTS = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage({ featuredEvents }: { featuredEvents: EventraEvent[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categories = ['Technology', 'Music', 'Business', 'Sports', 'Arts'];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      
      {/* HERO SECTION - Aurora + Grid */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30 blur-[120px] bg-gradient-to-r from-primary to-info rounded-full pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={STAGGER_CONTAINER}
            className="max-w-4xl mx-auto space-y-8"
          >
            <motion.div variants={FADE_UP_VARIANTS} className="flex justify-center">
              <Badge variant="outline" className="px-4 py-1.5 text-sm rounded-full border-primary/30 bg-primary/5 text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> The Future of Events
              </Badge>
            </motion.div>

            <motion.h1 variants={FADE_UP_VARIANTS} className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-foreground leading-[1.1]">
              Create, Manage & Experience <br className="hidden md:block" />
              <span className="text-gradient">Extraordinary Events</span>
            </motion.h1>

            <motion.p variants={FADE_UP_VARIANTS} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Eventra is the all-in-one intelligent platform for communities, universities, and professional organizers to host seamless physical, virtual, and hybrid events.
            </motion.p>

            {/* Pill CTAs & Search */}
            <motion.div variants={FADE_UP_VARIANTS} className="max-w-2xl mx-auto pt-4 space-y-6">
              <form onSubmit={handleSearch} className="relative flex items-center shadow-elevated rounded-full bg-card border border-border p-2">
                <Search className="w-5 h-5 text-muted-foreground ml-3 shrink-0" />
                <Input 
                  type="text" 
                  placeholder="Search for events, communities, or people..." 
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" size="lg" className="rounded-full px-8 hidden sm:flex font-bold">
                  Explore
                </Button>
              </form>

              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => router.push(`/explore?category=${cat}`)} className="px-4 py-1.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* METRICS STRIP */}
      <section className="border-y border-border bg-card/50 py-10 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50 text-center">
            {[
              { label: 'Active Users', value: '50K+' },
              { label: 'Events Hosted', value: '12,000' },
              { label: 'Communities', value: '850' },
              { label: 'Platform Uptime', value: '99.9%' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col space-y-1">
                <span className="text-3xl md:text-4xl font-display font-bold text-foreground">{stat.value}</span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED EVENTS - Hero Grid */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">Trending Now</h2>
              <p className="text-muted-foreground text-lg">Discover the most popular upcoming events.</p>
            </div>
            <Button variant="outline" className="rounded-full group" asChild>
              <Link href="/explore">
                View All Events <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {featuredEvents.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Featured Event (Spans 2 cols on large screens) */}
              <div className="lg:col-span-2">
                <Link href={`/events/${featuredEvents[0].id}`}>
                  <Card className="h-full group overflow-hidden border-border bg-card hover:border-primary/50 transition-all shadow-sm hover:shadow-glow">
                    <div className="relative h-[300px] md:h-[400px] w-full bg-gradient-to-br from-indigo-900 to-primary/40 overflow-hidden">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-primary text-primary-foreground border-none font-bold shadow-sm">Featured</Badge>
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-md">{featuredEvents[0].category}</Badge>
                      </div>
                    </div>
                    <CardContent className="p-8">
                      <h3 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">{featuredEvents[0].title}</h3>
                      <p className="text-muted-foreground mb-6 line-clamp-2 leading-relaxed">{featuredEvents[0].description}</p>
                      <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-foreground/80">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {new Date(featuredEvents[0].startDate).toLocaleDateString()}</div>
                        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {featuredEvents[0].location?.venue || 'Online'}</div>
                        <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> {featuredEvents[0].registeredCount} attending</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Secondary Featured Events */}
              <div className="flex flex-col gap-6">
                {featuredEvents.slice(1, 3).map((event) => (
                  <EventCard key={event.id} event={event} variant="default" />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card/30">
              <p className="text-muted-foreground">No featured events available right now.</p>
            </div>
          )}
        </div>
      </section>

      {/* FEATURES GRID (8 Items) */}
      <section className="py-24 bg-muted/30 border-y border-border relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg">A complete toolkit for attendees and organizers alike.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'AI Matchmaking', desc: 'Connect with the right people using smart networking algorithms.' },
              { icon: ShieldCheck, title: 'Secure Ticketing', desc: 'Fraud-proof QR codes and instant verification at the door.' },
              { icon: Trophy, title: 'Gamification', desc: 'Boost engagement with points, badges, and live leaderboards.' },
              { icon: MessageSquare, title: 'Community Hubs', desc: 'Keep the conversation going before and after the event.' },
              { icon: Sparkles, title: 'AI Copilot', desc: 'Generate descriptions, schedules, and marketing copy instantly.' },
              { icon: Globe, title: 'Hybrid Support', desc: 'Host physical, virtual, or hybrid events with ease.' },
              { icon: BarChart, title: 'Deep Analytics', desc: 'Track attendance, engagement, and revenue in real-time.' },
              { icon: Calendar, title: 'Dynamic Agendas', desc: 'Personalized schedules for multi-track conferences.' },
            ].map((feature, i) => (
              <Card key={i} className="bg-card border-border hover:border-primary/50 transition-all hover:shadow-soft group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="w-6 h-6 text-primary group-hover:text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA GRADIENT CARD */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-foreground text-background">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-info opacity-90 mix-blend-multiply" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            
            <div className="relative z-10 px-6 py-20 md:py-28 text-center max-w-3xl mx-auto flex flex-col items-center">
              <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 text-white leading-tight">
                Ready to host your next big event?
              </h2>
              <p className="text-lg md:text-xl text-white/80 mb-10 max-w-xl leading-relaxed">
                Join thousands of organizers creating unforgettable experiences with Eventra's intelligent tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button size="xl" className="bg-white text-primary hover:bg-white/90 rounded-full font-bold shadow-xl">
                  Get Started for Free
                </Button>
                <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full font-bold">
                  Book a Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STRUCTURED FOOTER */}
      <footer className="bg-card border-t border-border pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-info flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-display font-bold text-foreground">Eventra</span>
              </div>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                The modern event management platform built for the next generation of experiences.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Community</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Eventra Inc. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
