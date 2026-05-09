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
  Zap,
  Globe,
  Trophy,
  MessageSquare,
  ShieldCheck,
  BarChart,
  ArrowRight,
  ChevronRight,
  Terminal,
  Activity
} from 'lucide-react';
import { cn } from '@/core/utils/utils';

const FADE_UP = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const STAGGER = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 } 
  },
};

export default function LandingPage({ featuredEvents = [] }: { featuredEvents?: EventraEvent[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-lavender/30 selection:text-lavender font-sans overflow-x-hidden">
      
      {/* 01 HERO SECTION - Institutional Authority */}
      <section className="relative min-h-screen flex flex-col justify-center pt-20 border-b border-white/10 grid-bg">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={STAGGER} className="max-w-6xl">
            
            <motion.div variants={FADE_UP} className="flex items-center gap-4 mb-12">
               <div className="w-12 h-px bg-lavender" />
               <span className="text-[10px] font-mono font-bold tracking-[0.4em] text-lavender uppercase">Institutional Platform v2.0</span>
            </motion.div>

            <motion.h1 variants={FADE_UP} className="text-6xl md:text-[9rem] font-display font-bold leading-[0.85] tracking-tighter mb-16 uppercase">
              Solid <br />
              <span className="text-lavender">Foundation.</span> <br />
              Extraordinary <br />
              Events.
            </motion.h1>

            <div className="grid md:grid-cols-12 gap-12 items-end">
              <motion.div variants={FADE_UP} className="md:col-span-5 space-y-8">
                <p className="text-xl md:text-2xl text-zinc-400 font-medium leading-relaxed">
                  Eventra provides a high-performance infrastructure for organizations to deploy, manage, and scale physical and digital experiences with absolute precision.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="xl" className="group" asChild>
                    <Link href="/events/create">
                      Deploy Event <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-all" />
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" className="border-zinc-800" asChild>
                    <Link href="/explore">Infrastructure</Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div variants={FADE_UP} className="md:col-span-7 border-l border-white/10 pl-12 hidden md:block">
                 <div className="grid grid-cols-2 gap-12">
                   {[
                     { label: 'Network Uptime', value: '99.99%', sub: 'Global availability' },
                     { label: 'Security Protocol', value: 'AES-256', sub: 'End-to-end encryption' },
                   ].map((stat, i) => (
                     <div key={i} className="space-y-2">
                       <p className="text-4xl font-display font-bold text-white uppercase">{stat.value}</p>
                       <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                       <p className="text-[9px] text-zinc-600 font-bold uppercase">{stat.sub}</p>
                     </div>
                   ))}
                 </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* System Status Strip */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-zinc-950/50 backdrop-blur-md py-4 overflow-hidden">
           <div className="container mx-auto px-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">All Systems Operational</span>
                 </div>
                 <div className="h-4 w-px bg-white/10" />
                 <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest hidden sm:block">Syncing Global Data...</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono font-bold text-zinc-500 uppercase">
                 <span>Latency: 24ms</span>
                 <span>Region: TYO-01</span>
              </div>
           </div>
        </div>
      </section>

      {/* 02 CAPABILITIES - High Density Grid */}
      <section className="py-32 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <span className="text-[10px] font-mono font-bold text-lavender uppercase tracking-[0.4em] mb-4 block">02 / Ecosystem</span>
              <h2 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter">Core Engineering.</h2>
            </div>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs max-w-xs text-right">
              Integrated toolset designed for institutional scalability and social impact.
            </p>
          </div>

          <div className="grid md:grid-cols-4 border-t border-l border-white/10">
            {[
              { icon: Terminal, title: 'AI Automation', desc: 'Predictive analytics and automated workflows for event scaling.' },
              { icon: ShieldCheck, title: 'Secure Tiers', desc: 'Encrypted ticketing systems with multi-signature verification.' },
              { icon: Activity, title: 'Live Velocity', desc: 'Real-time telemetry on attendee movement and engagement.' },
              { icon: Globe, title: 'Hybrid Core', desc: 'Simultaneous deployment of digital and physical infrastructures.' },
              { icon: Users, title: 'Network Sync', desc: 'Automated matchmaking powered by corporate interest mapping.' },
              { icon: Zap, title: 'Instant Replay', desc: 'Sub-second session archiving and highlight distribution.' },
              { icon: BarChart, title: 'Deep Intel', desc: 'Institutional grade reporting and revenue visualization.' },
              { icon: MessageSquare, title: 'Social Nodes', desc: 'Persistent communication channels for lifecycle management.' },
            ].map((f, i) => (
              <div key={i} className="p-10 border-r border-b border-white/10 hover:bg-zinc-950 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ChevronRight className="w-4 h-4 text-lavender" />
                </div>
                <div className="w-12 h-12 border border-white/10 flex items-center justify-center mb-10 group-hover:border-lavender transition-all">
                  <f.icon className="w-5 h-5 text-zinc-500 group-hover:text-lavender" />
                </div>
                <h3 className="text-xl font-bold uppercase mb-4 tracking-tight">{f.title}</h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 03 EVENTS - The Registry */}
      <section className="py-32 border-b border-white/10 grid-bg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-24">
             <div>
                <span className="text-[10px] font-mono font-bold text-lavender uppercase tracking-[0.4em] mb-4 block">03 / Registry</span>
                <h2 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter text-white">Verified Ops.</h2>
             </div>
             <Button variant="outline" className="hidden md:flex border-zinc-800">
               View Full Archive <ChevronRight className="ml-2 w-4 h-4" />
             </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {featuredEvents.length > 0 ? featuredEvents.slice(0, 6).map((event) => (
              <div key={event.id} className="bg-black p-4">
                <EventCard event={event} />
              </div>
            )) : (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-zinc-950/50 p-12 text-center border-r border-white/10 last:border-0 h-[400px] flex flex-col justify-center items-center gap-6">
                   <div className="w-16 h-16 border border-white/5 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-zinc-800" />
                   </div>
                   <span className="text-[10px] font-mono font-bold text-zinc-700 uppercase tracking-widest">Entry_{i} Offline</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 04 CTA - Strategic Deployment */}
      <section className="py-40 bg-white text-black relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" variants={FADE_UP} className="max-w-4xl mx-auto space-y-12">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.4em]">04 / Access Control</span>
            <h2 className="text-6xl md:text-8xl font-display font-bold uppercase tracking-tighter leading-[0.9]">
               Deploy your <br /> next event on <br /> <span className="text-lavender">Eventra.</span>
            </h2>
            <div className="flex flex-col md:flex-row justify-center gap-6 pt-12">
              <Button size="xl" className="bg-black text-white hover:bg-zinc-900 rounded-none shadow-none text-base">
                 Request Access
              </Button>
              <Button size="xl" variant="outline" className="border-zinc-300 text-black rounded-none shadow-none text-base hover:bg-zinc-50">
                 Documentation
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* INSTITUTIONAL FOOTER */}
      <footer className="bg-zinc-950 border-t border-white/10 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-24">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-8 h-8 border border-lavender flex items-center justify-center">
                   <span className="text-[9px] font-mono font-bold text-lavender">EV</span>
                 </div>
                 <span className="text-xl font-display font-bold tracking-[0.2em] uppercase">Eventra</span>
              </div>
              <p className="text-zinc-500 font-bold text-sm uppercase leading-relaxed max-w-sm">
                Japan-centric Digital General Trading Entity. Pushing the boundaries of human connection through AI-driven event infrastructures.
              </p>
            </div>
            {['Operations', 'Resources'].map((cat, i) => (
              <div key={i}>
                <h4 className="text-[10px] font-mono font-bold text-lavender uppercase tracking-[0.4em] mb-8">{cat}</h4>
                <ul className="space-y-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  <li><Link href="#" className="hover:text-white transition-colors">Infrastructure</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Telemetry</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Protocol</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Nodes</Link></li>
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="flex items-center gap-8 text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest">
                <span>© 2026 Eventra Solid Corp</span>
                <span>All Systems Nomimal</span>
             </div>
             <div className="flex gap-8 text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest">
                <Link href="#" className="hover:text-white transition-colors">Privacy_Protocol</Link>
                <Link href="#" className="hover:text-white transition-colors">Auth_Terms</Link>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

