'use client';

import { motion, useScroll, useTransform, Variants, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EventCard } from '@/features/events/event-card';
import { EventraEvent } from '@/types';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/core/utils/utils';
import {
  Zap,
  ArrowRight,
  Globe,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  Search,
  Calendar,
  Users,
  MessageSquare,
  Bot,
  Clock,
  CheckCircle2,
  Trophy
} from 'lucide-react';

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
  },
};

const STAGGER: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
  },
};

const MODULES = [
  {
    id: 'networking',
    title: 'Networking',
    icon: MessageSquare,
    description: 'The digital sticker palette comes alive in our networking module. Connect with peers through a cheerful, illustration-first interface.',
    color: 'var(--notion-accent-purple)'
  },
  {
    id: 'experience',
    title: 'Experience',
    icon: Trophy,
    description: 'Track your growth with paper-soft progress indicators. Every milestone is a new sticker in your professional collection.',
    color: 'var(--notion-accent-pink)'
  },
  {
    id: 'schedule',
    title: 'Schedule',
    icon: Calendar,
    description: 'A document-like view of your upcoming missions. Clean, tightly-tracked typography ensures your agenda is always scannable.',
    color: 'var(--notion-accent-teal)'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: Activity,
    description: 'Complex operational data rendered with Notion-blue structural accents. Insight without the noise.',
    color: 'var(--notion-accent-sky)'
  }
];

export default function LandingPage({ featuredEvents = [] }: { featuredEvents?: EventraEvent[] }) {
  const [activeModule, setActiveModule] = useState(MODULES[0].id);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div ref={containerRef} className="min-h-screen bg-notion-canvas-soft text-notion-ink font-sans selection:bg-notion-primary/20 selection:text-notion-primary">
      
      {/* HERO SECTION - The Night Band */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-notion-secondary text-white px-6">
        <motion.div 
          style={{ scale: heroScale }}
          initial="hidden" 
          animate="visible" 
          variants={STAGGER} 
          className="relative z-10 max-w-5xl text-center space-y-12"
        >
          <motion.div variants={FADE_UP} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20">
             <div className="w-2 h-2 rounded-full bg-notion-accent-sky animate-pulse" />
             <span className="text-eyebrow text-white uppercase tracking-widest">Public Beta v0.1</span>
          </motion.div>

          <motion.h1 variants={FADE_UP} className="text-display-1 leading-none tracking-tighter">
            Think it. Plan it. <br />
            <span className="text-notion-accent-sky italic">Experience it.</span>
          </motion.h1>

          <motion.p variants={FADE_UP} className="text-title text-white/80 max-w-2xl mx-auto font-normal">
            The all-in-one workspace for events. <br className="hidden md:block" />
            Warm, document-like, and built for flawless execution.
          </motion.p>

          <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <Button size="lg" variant="primary" className="h-14 px-10 text-lg shadow-notion-elevated" asChild>
              <Link href="/register">Get Eventra free</Link>
            </Button>
            <Button size="lg" variant="secondary" className="h-14 px-10 text-lg border-white/20 bg-white/10 text-white hover:bg-white/20" asChild>
              <Link href="/explore">Request a demo</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating Stickers Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
           <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-[20%] left-[10%] w-16 h-16 bg-notion-accent-purple rounded-xl rotate-12" />
           <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute bottom-[25%] left-[15%] w-12 h-12 bg-notion-accent-pink rounded-full -rotate-6" />
           <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 6, repeat: Infinity }} className="absolute top-[30%] right-[12%] w-14 h-14 bg-notion-accent-teal rounded-lg rotate-45" />
           <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 4.5, repeat: Infinity }} className="absolute bottom-[20%] right-[18%] w-10 h-10 bg-notion-accent-orange rounded-md -rotate-12" />
        </div>
      </section>

      {/* CORE PHILOSOPHY */}
      <section className="py-32 px-6">
        <div className="container max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <Badge variant="outline" className="text-notion-primary border-notion-primary/30">Philosophy</Badge>
              <h2 className="text-display-2 text-notion-ink leading-tight">Quiet chrome. <br /> Vibrant content.</h2>
              <p className="text-body-md text-notion-ink-secondary leading-relaxed max-w-lg">
                Notion looks like a well-organized desk in good daylight. We've applied that same document-like calm to Eventra, so your events breathe while the tools stay quiet.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4">
                 <div className="space-y-2">
                    <div className="w-10 h-10 rounded-md bg-notion-canvas border border-notion-hairline flex items-center justify-center shadow-notion-soft">
                       <Zap className="w-5 h-5 text-notion-primary" />
                    </div>
                    <h4 className="font-bold text-body-md">Inter-Tuned</h4>
                    <p className="text-caption text-notion-ink-muted">Tightly tracked typography for confident headlines.</p>
                 </div>
                 <div className="space-y-2">
                    <div className="w-10 h-10 rounded-md bg-notion-canvas border border-notion-hairline flex items-center justify-center shadow-notion-soft">
                       <Layers className="w-5 h-5 text-notion-primary" />
                    </div>
                    <h4 className="font-bold text-body-md">Paper-Soft</h4>
                    <p className="text-caption text-notion-ink-muted">Off-white canvas for a document-like feel.</p>
                 </div>
              </div>
            </div>
            
            <Card variant="elevated" className="aspect-[4/3] p-0 overflow-hidden relative group">
               <div className="absolute top-0 left-0 right-0 h-10 bg-notion-canvas-soft border-b border-notion-hairline flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-notion-hairline" />
                    <div className="w-3 h-3 rounded-full bg-notion-hairline" />
                    <div className="w-3 h-3 rounded-full bg-notion-hairline" />
                  </div>
               </div>
               <div className="mt-10 p-8 space-y-6">
                  <div className="h-8 w-1/3 bg-notion-canvas-soft rounded-md" />
                  <div className="space-y-3">
                     <div className="h-4 w-full bg-notion-canvas-soft rounded-sm" />
                     <div className="h-4 w-5/6 bg-notion-canvas-soft rounded-sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                     {[...Array(3)].map((_, i) => (
                       <div key={i} className="aspect-square bg-notion-canvas-soft rounded-lg border border-notion-hairline shadow-notion-soft" />
                     ))}
                  </div>
               </div>
               {/* Multi-color decoration */}
               <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-notion-accent-sky/10 blur-[100px] rounded-full" />
            </Card>
          </div>
        </div>
      </section>

      {/* MODULES & STICKERS */}
      <section id="features" className="py-32 bg-notion-canvas border-y border-notion-hairline px-6">
        <div className="container max-w-7xl mx-auto text-center space-y-20">
          <div className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-h1">The Sticker Palette</h2>
            <p className="text-body-md text-notion-ink-secondary">
              Personality without the clutter. We use a playful multi-color palette for decoration, while the structure stays monochrome-plus-blue.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {MODULES.map((module) => (
              <Card 
                key={module.id} 
                className="group p-0 overflow-hidden text-left hover:shadow-notion-elevated transition-shadow"
              >
                <div 
                  className="h-24 w-full" 
                  style={{ backgroundColor: module.color }}
                />
                <div className="p-8 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-notion-canvas border border-notion-hairline flex items-center justify-center -mt-14 shadow-notion-elevated transition-transform group-hover:scale-110">
                    <module.icon className="w-6 h-6 text-notion-ink" />
                  </div>
                  <h3 className="text-h3">{module.title}</h3>
                  <p className="text-body-sm text-notion-ink-secondary leading-relaxed">
                    {module.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* RECENT ACTIVITY / NETWORK */}
      <section id="events" className="py-32 px-6">
        <div className="container max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
             <div className="space-y-4">
                <Badge variant="outline" className="text-notion-primary border-notion-primary/30">Network Activity</Badge>
                <h2 className="text-h1">Live Experiences.</h2>
                <p className="text-body-md text-notion-ink-secondary max-w-xl">
                  Explore nodes and experience clusters currently active across the Eventra secure mesh.
                </p>
             </div>
             <Button variant="utility" asChild>
                <Link href="/explore">Scan Network <ArrowRight className="ml-2 h-4 w-4" /></Link>
             </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             {featuredEvents.length > 0 ? featuredEvents.slice(0, 3).map((event) => (
               <EventCard key={event.id} event={event} />
             )) : (
               [1, 2, 3].map(i => (
                 <Card key={i} className="p-10 space-y-6 hover:shadow-notion-soft transition-shadow">
                    <div className="flex justify-between items-start">
                       <div className="w-12 h-12 rounded-lg bg-notion-canvas-soft border border-notion-hairline flex items-center justify-center">
                          <Activity className="w-6 h-6 text-notion-ink-muted" />
                       </div>
                       <Badge variant="secondary" className="bg-notion-accent-green/10 text-notion-accent-green border-none">
                          Active
                       </Badge>
                    </div>
                    <div className="space-y-2">
                       <div className="h-6 w-3/4 bg-notion-canvas-soft rounded-md" />
                       <div className="h-4 w-1/2 bg-notion-canvas-soft rounded-sm" />
                    </div>
                    <div className="pt-6 border-t border-notion-hairline flex justify-between text-eyebrow text-notion-ink-faint uppercase">
                       <span>Node_0x{i}</span>
                       <span>US-East</span>
                    </div>
                 </Card>
               ))
             )}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-48 px-6 text-center bg-notion-canvas border-t border-notion-hairline">
        <div className="container max-w-4xl mx-auto space-y-12">
           <h2 className="text-display-2">Scale your mission.</h2>
           <p className="text-title text-notion-ink-secondary max-w-2xl mx-auto">
             Get started with the world's first document-first event management platform. Join 10k+ organizers building the future.
           </p>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button size="lg" variant="primary" className="h-16 px-12 text-xl" asChild>
                 <Link href="/register">Get Eventra free</Link>
              </Button>
              <Button size="lg" variant="secondary" className="h-16 px-12 text-xl" asChild>
                 <Link href="/login">Log in</Link>
              </Button>
           </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-24 bg-notion-canvas-soft border-t border-notion-hairline px-6">
        <div className="container max-w-7xl mx-auto">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
              <div className="col-span-2 md:col-span-1 space-y-6">
                 <Logo showText />
                 <p className="text-caption text-notion-ink-secondary leading-relaxed">
                    Building infrastructure for the next generation of live experiences. Warm, document-like, and human.
                 </p>
              </div>
              <div className="space-y-4">
                 <h4 className="text-eyebrow uppercase text-notion-ink">Product</h4>
                 <ul className="space-y-3 text-caption text-notion-ink-secondary">
                    <li><Link href="#" className="hover:text-notion-primary">Features</Link></li>
                    <li><Link href="#" className="hover:text-notion-primary">Pricing</Link></li>
                    <li><Link href="#" className="hover:text-notion-primary">Desktop App</Link></li>
                 </ul>
              </div>
              <div className="space-y-4">
                 <h4 className="text-eyebrow uppercase text-notion-ink">Company</h4>
                 <ul className="space-y-3 text-caption text-notion-ink-secondary">
                    <li><Link href="#" className="hover:text-notion-primary">About</Link></li>
                    <li><Link href="#" className="hover:text-notion-primary">Blog</Link></li>
                    <li><Link href="#" className="hover:text-notion-primary">Careers</Link></li>
                 </ul>
              </div>
              <div className="space-y-4">
                 <h4 className="text-eyebrow uppercase text-notion-ink">Resources</h4>
                 <ul className="space-y-3 text-caption text-notion-ink-secondary">
                    <li><Link href="#" className="hover:text-notion-primary">Guides</Link></li>
                    <li><Link href="#" className="hover:text-notion-primary">Help Center</Link></li>
                    <li><Link href="#" className="hover:text-notion-primary">Privacy</Link></li>
                 </ul>
              </div>
           </div>
           
           <div className="pt-8 border-t border-notion-hairline flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-8 text-eyebrow text-notion-ink-faint uppercase">
                 <span>© 2026 Eventra Inc.</span>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-notion-accent-green rounded-full shadow-notion-soft" />
                    <span>All Systems Operational</span>
                 </div>
              </div>
              <div className="flex gap-4">
                 <Link href="#" className="text-notion-ink-muted hover:text-notion-ink"><Globe className="w-5 h-5" /></Link>
                 <Link href="#" className="text-notion-ink-muted hover:text-notion-ink"><Terminal className="w-5 h-5" /></Link>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
