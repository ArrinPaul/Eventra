'use client';

import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventCard } from '@/features/events/event-card';
import { EventraEvent } from '@/types';
import {
  Zap,
  ArrowRight,
  Globe,
  Terminal,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  BarChart3,
  ShieldCheck
} from 'lucide-react';

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
  },
};

const STAGGER: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
  },
};

export default function LandingPage({ featuredEvents = [] }: { featuredEvents?: EventraEvent[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary font-sans overflow-x-hidden">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full opacity-30 animate-glow" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[100px] rounded-full" />
      </div>

      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-glow">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display font-medium tracking-tight text-lg">Eventra</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#ecosystem" className="hover:text-white transition-colors">Ecosystem</Link>
            <Link href="#events" className="hover:text-white transition-colors">Explore</Link>
          </div>
          <div className="flex items-center gap-4">
             <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">Login</Link>
             <Button size="sm" className="rounded-full bg-white text-black hover:bg-zinc-200 font-semibold px-5" asChild>
                <Link href="/register">Sign Up</Link>
             </Button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-44 pb-32 px-4 flex flex-col items-center justify-center text-center overflow-hidden">
        <motion.div 
          style={{ opacity, scale }}
          initial="hidden" 
          animate="visible" 
          variants={STAGGER} 
          className="relative z-10 max-w-4xl space-y-8"
        >
          <motion.div variants={FADE_UP} className="flex justify-center">
            <Link href="/updates" className="group relative flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-medium tracking-wide text-zinc-300">Announcing Eventra 2.0</span>
              <ArrowRight className="w-3 h-3 text-zinc-300 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

          <motion.h1 variants={FADE_UP} className="text-5xl md:text-8xl font-display font-medium tracking-tight leading-[1.05] text-gradient">
            The operating system <br />
            for your events.
          </motion.h1>

          <motion.p variants={FADE_UP} className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Eventra provides the high-performance infrastructure to manage, scale, and secure your mission-critical experiences with AI-driven intelligence.
          </motion.p>

          <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button size="lg" className="rounded-full px-8 h-12 bg-white text-black hover:bg-zinc-200 font-bold transition-transform hover:scale-105" asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12 border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 font-bold" asChild>
              <Link href="/explore">View Demo</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24 relative w-full max-w-6xl aspect-[16/9] mx-auto rounded-3xl border border-white/10 bg-zinc-900/20 backdrop-blur-sm overflow-hidden shadow-2xl"
        >
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
           <div className="absolute top-0 left-0 right-0 h-12 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2 z-20">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              </div>
              <div className="mx-auto text-[10px] font-mono text-zinc-300 uppercase tracking-widest">eventra.cloud/dashboard</div>
           </div>
           
           <div className="p-12 pt-20 grid grid-cols-12 gap-6 opacity-40">
              <div className="col-span-8 space-y-6">
                 <div className="h-48 rounded-2xl bg-white/5 border border-white/5" />
                 <div className="grid grid-cols-2 gap-6">
                    <div className="h-32 rounded-2xl bg-white/5 border border-white/5" />
                    <div className="h-32 rounded-2xl bg-white/5 border border-white/5" />
                 </div>
              </div>
              <div className="col-span-4 h-full rounded-2xl bg-white/5 border border-white/5" />
           </div>
        </motion.div>
      </section>

      {/* TRUST BANNER */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
           <span className="text-xs font-medium text-zinc-300 uppercase tracking-[0.2em]">Trusted by teams worldwide</span>
           <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale contrast-125">
              <div className="text-xl font-bold tracking-tighter">VERCEL</div>
              <div className="text-xl font-bold tracking-tighter">LINEAR</div>
              <div className="text-xl font-bold tracking-tighter">STRIPE</div>
              <div className="text-xl font-bold tracking-tighter">GITHUB</div>
           </div>
        </div>
      </section>

      {/* BENTO ECOSYSTEM */}
      <section id="ecosystem" className="py-40 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-24">
             <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary rounded-full px-3 py-0.5 text-[10px] uppercase font-bold tracking-widest">The Ecosystem</Badge>
             <h2 className="text-4xl md:text-6xl font-display font-medium tracking-tight mb-6">Built for performance.</h2>
             <p className="text-lg text-zinc-300 leading-relaxed">Everything you need to orchestrate complex events, from AI-powered matchmaking to real-time analytics.</p>
          </div>

          <div className="bento-grid min-h-[700px]">
            <div className="bento-item md:col-span-2 md:row-span-2 flex flex-col justify-between group cursor-pointer overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-8 group-hover:scale-110 transition-transform">
                     <Sparkles className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-medium tracking-tight mb-4">AI Matchmaking</h3>
                  <p className="text-zinc-300 text-lg leading-relaxed max-w-sm">Connect your attendees with laser precision using our behavioral interest engine.</p>
               </div>
               <div className="relative z-10 flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                  Learn more <ArrowRight className="w-4 h-4" />
               </div>
            </div>

            <div className="bento-item md:col-span-2 flex items-center justify-between group">
               <div className="max-w-xs">
                  <h3 className="text-xl font-medium tracking-tight mb-2">Real-time Telemetry</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed">Monitor every node and interaction as it happens with sub-millisecond latency.</p>
               </div>
               <BarChart3 className="w-12 h-12 text-zinc-700 group-hover:text-primary transition-colors" />
            </div>

            <div className="bento-item md:col-span-1 flex flex-col justify-between group">
               <Globe className="w-8 h-8 text-zinc-300 group-hover:text-white transition-colors" />
               <div>
                  <h3 className="text-lg font-medium mb-1">Global Core</h3>
                  <p className="text-zinc-300 text-xs font-medium">Edge-first delivery.</p>
               </div>
            </div>

            <div className="bento-item md:col-span-1 flex flex-col justify-between group">
               <ShieldCheck className="w-8 h-8 text-zinc-300 group-hover:text-emerald-500 transition-colors" />
               <div>
                  <h3 className="text-lg font-medium mb-1">E2E Secure</h3>
                  <p className="text-zinc-300 text-xs font-medium">Military-grade enc.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE LIST */}
      <section id="features" className="py-40 bg-white/[0.01]">
        <div className="container mx-auto px-6">
           <div className="grid md:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                 <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-display font-medium tracking-tight">Streamlined work, <br /> better events.</h2>
                    <p className="text-zinc-300 text-lg">Stop jumping between tools. Eventra unifies your stack into one cohesive platform.</p>
                 </div>
                 
                 <div className="space-y-8">
                    {[
                      { icon: Layers, title: "Unified Registry", desc: "Manage all events from a single source of truth." },
                      { icon: Cpu, title: "Automated Workflows", desc: "Reduce manual overhead with intelligent automation." },
                      { icon: Activity, title: "Live Insights", desc: "Adapt on the fly with real-time feedback loops." }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 group">
                        <div className="mt-1 w-10 h-10 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                           <item.icon className="w-5 h-5 text-zinc-300 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="space-y-1">
                           <h4 className="font-medium text-white">{item.title}</h4>
                           <p className="text-sm text-zinc-300 font-medium">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="relative">
                 <div className="aspect-square rounded-full bg-primary/10 blur-[100px] absolute -inset-20 z-0" />
                 <div className="relative z-10 rounded-2xl border border-white/10 bg-zinc-900/40 p-8 glass-card overflow-hidden">
                    <div className="space-y-6">
                       <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-sm font-medium text-zinc-300">Node Status</span>
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold">ACTIVE</Badge>
                       </div>
                       <div className="space-y-3">
                          {[80, 45, 90, 60].map((w, i) => (
                            <div key={i} className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 whileInView={{ width: `${w}%` }}
                                 transition={{ delay: i * 0.1, duration: 1 }}
                                 className="h-full bg-primary"
                               />
                            </div>
                          ))}
                       </div>
                       <div className="pt-4 flex gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest font-bold">Optimizing_Vectors...</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* ACTIVE OPS */}
      <section id="events" className="py-40">
        <div className="container mx-auto px-6">
           <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-6">
              <div className="max-w-xl">
                 <Badge variant="outline" className="mb-4 border-indigo-500/20 bg-indigo-500/5 text-indigo-400 rounded-full px-3 py-0.5 text-[10px] uppercase font-bold tracking-widest">Explore Operations</Badge>
                 <h2 className="text-4xl md:text-6xl font-display font-medium tracking-tight text-white">Latest Deployments.</h2>
              </div>
              <Button variant="outline" className="border-white/10 hover:bg-white/5 rounded-full font-bold px-8 h-12 transition-all hover:scale-105" asChild>
                 <Link href="/explore">View All Events</Link>
              </Button>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
             {featuredEvents.length > 0 ? featuredEvents.slice(0, 3).map((event) => (
               <EventCard key={event.id} event={event} />
             )) : (
               [1, 2, 3].map(i => (
                 <div key={i} className="rounded-3xl border border-white/10 bg-zinc-900/10 h-[450px] flex flex-col justify-center items-center gap-6 opacity-30 group cursor-not-allowed">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-all">
                       <Layers className="w-8 h-8 text-zinc-700 group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Entry_{i} Syncing</span>
                 </div>
               ))
             )}
           </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-60 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full translate-y-1/2" />
        <div className="container mx-auto px-6 relative z-10 text-center space-y-12">
           <h2 className="text-5xl md:text-8xl font-display font-medium tracking-tight leading-tight">Scale your next <br /> experience.</h2>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Button size="xl" className="rounded-full px-12 h-14 bg-white text-black hover:bg-zinc-200 font-bold text-lg shadow-2xl shadow-primary/20" asChild>
                 <Link href="/register">Start Building</Link>
              </Button>
              <Link href="#" className="text-zinc-300 hover:text-white transition-colors flex items-center gap-2 group font-medium">
                 Contact Sales <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
           </div>
        </div>
      </section>

      <footer className="border-t border-white/5 pt-24 pb-12 bg-black relative z-10">
        <div className="container mx-auto px-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
              <div className="col-span-2 md:col-span-1 space-y-4">
                 <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary fill-primary" />
                    <span className="font-display font-medium tracking-tight text-xl">Eventra</span>
                 </div>
                 <p className="text-sm text-zinc-300 leading-relaxed max-w-xs font-medium">
                    Building the infrastructure for the next generation of live experiences.
                 </p>
              </div>
              <div className="space-y-4">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-white">Product</h4>
                 <ul className="space-y-2 text-sm text-zinc-300 font-medium">
                    <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Ecosystem</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
                 </ul>
              </div>
              <div className="space-y-4">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-white">Company</h4>
                 <ul className="space-y-2 text-sm text-zinc-300 font-medium">
                    <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                 </ul>
              </div>
              <div className="space-y-4">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-white">Support</h4>
                 <ul className="space-y-2 text-sm text-zinc-300 font-medium">
                    <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                 </ul>
              </div>
           </div>
           
           <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-8 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                 <span>© 2026 Eventra Inc.</span>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span>All Systems Operational</span>
                 </div>
              </div>
              <div className="flex gap-6">
                 <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer text-zinc-300 hover:text-white">
                    <Globe className="w-4 h-4" />
                 </div>
                 <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer text-zinc-300 hover:text-white">
                    <Terminal className="w-4 h-4" />
                 </div>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
