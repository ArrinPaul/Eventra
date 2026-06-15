'use client';

import { motion, useScroll, useTransform, Variants, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Cpu,
  Layers,
  Sparkles,
  BarChart3,
  Search,
  Calendar,
  Users,
  MessageSquare,
  MessageCircle,
  Bot,
  ZapOff,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Moon,
  Sun,
  Trophy,
  ChevronRight,
  Plus
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

const MODULES = [
  {
    id: 'networking',
    title: 'Networking',
    icon: MessageCircle,
    description: 'High-performance real-time networking for attendees and organizers.',
    preview: (
      <div className="w-full bg-background/40 backdrop-blur-md rounded-[2rem] border border-border/40 p-6 flex flex-col gap-4 overflow-hidden shadow-inner">
        <div className="flex items-center justify-between border-b border-border/20 pb-4">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-black text-[10px] shadow-glow shadow-primary/20">AC</div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-foreground leading-none uppercase tracking-wider">Alex Chen</span>
                 <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Connected
                 </span>
              </div>
           </div>
        </div>
        <div className="flex flex-col gap-3">
           <div className="self-start bg-muted/30 p-3 rounded-2xl rounded-tl-none max-w-[80%] border border-border/10 shadow-sm">
              <p className="text-[10px] text-foreground/70 leading-tight font-bold">Protocol check: Have you verified your session encryption keys?</p>
           </div>
           <div className="self-end bg-primary/10 p-3 rounded-2xl rounded-tr-none max-w-[80%] border border-primary/20 text-primary">
              <p className="text-[10px] font-black leading-tight">Uplink confirmed. Nodes are synchronized. 🚀</p>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'experience',
    title: 'Gamification',
    icon: Trophy,
    description: 'Gamified attendee progression with experience points and levels.',
    preview: (
      <div className="w-full bg-background/40 backdrop-blur-md rounded-[2rem] border border-border/40 p-6 flex flex-col gap-6 overflow-hidden shadow-inner">
        <div className="flex items-center justify-between">
           <h4 className="text-lg font-display font-bold tracking-tight text-foreground">Level 12</h4>
           <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Trophy className="w-5 h-5" />
           </div>
        </div>
        <div className="space-y-4">
           <div className="p-4 rounded-2xl bg-background/60 border border-border/30 shadow-sm flex items-center gap-4">
              <div className="flex-1">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-foreground uppercase tracking-widest">Next Unlock</span>
                    <span className="text-[9px] font-mono font-bold text-primary">850 / 1200 XP</span>
                 </div>
                 <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: '70%' }} className="h-full bg-primary" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'calendar',
    title: 'Schedule',
    icon: Calendar,
    description: 'Dynamic session tracks and personalized schedules for every attendee.',
    preview: (
      <div className="w-full bg-background/40 backdrop-blur-md rounded-[2rem] border border-border/40 p-6 flex flex-col overflow-hidden shadow-inner">
        <div className="grid grid-cols-7 gap-1.5">
           {Array.from({ length: 14 }).map((_, i) => (
             <div key={i} className={cn(
               "aspect-square rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5",
               i === 5 || i === 8 || i === 12 ? "bg-primary text-primary-foreground border-primary" : "bg-background/60 border-border/20 text-muted-foreground"
             )}>
                <span className="text-[8px] font-mono font-bold">{i + 1}</span>
             </div>
           ))}
        </div>
      </div>
    )
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    description: 'Real-time data visualization and attendance tracking across all event nodes.',
    preview: (
      <div className="w-full bg-background/40 backdrop-blur-md rounded-[2rem] border border-border/40 p-6 flex flex-col gap-4 overflow-hidden shadow-inner">
        <div className="h-32 flex items-end gap-1.5 px-2">
           {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95].map((h, i) => (
             <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} className="flex-1 bg-primary/20 rounded-full" />
           ))}
        </div>
        <p className="text-[9px] font-black uppercase text-center text-muted-foreground tracking-widest">Real-time Performance</p>
      </div>
    )
  },
  {
    id: 'ai-tools',
    title: 'AI Workspace',
    icon: Cpu,
    description: 'Intelligent automation layer for content summarization and action items.',
    preview: (
      <div className="w-full bg-background/40 backdrop-blur-md rounded-[2rem] border border-border/40 p-6 flex flex-col gap-4 overflow-hidden shadow-inner">
        <div className="space-y-3">
           <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/5 border border-primary/10">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black uppercase text-primary">Neural_Processor_Active</span>
           </div>
           <div className="h-2 w-3/4 bg-muted/40 rounded-full" />
           <div className="h-2 w-1/2 bg-muted/20 rounded-full" />
        </div>
      </div>
    )
  },
  {
    id: 'security',
    title: 'Security',
    icon: ShieldCheck,
    description: 'Enterprise-grade encryption and secure access protocols for all attendees.',
    preview: (
      <div className="w-full bg-background/40 backdrop-blur-md rounded-[2rem] border border-border/40 p-6 flex flex-col items-center justify-center gap-4 overflow-hidden shadow-inner min-h-[160px]">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
           <ShieldCheck className="w-8 h-8" />
        </div>
        <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em]">AES-256 SECURE</span>
      </div>
    )
  }
];

const AI_FEATURES = [
  {
    title: "Reply Suggestions",
    description: "Context-aware AI replies for networking and support chats.",
    icon: MessageSquare
  },
  {
    title: "Daily Recap",
    description: "Intelligent activity summaries and key takeaway extractions.",
    icon: Clock
  },
  {
    title: "Text to Diagram",
    description: "Automated flowchart and floor plan generation from prompts.",
    icon: Bot
  },
  {
    title: "Notes Formatter",
    description: "Instant action item extraction and structuring from session notes.",
    icon: Terminal
  }
];

export default function LandingPage({ featuredEvents = [] }: { featuredEvents?: EventraEvent[] }) {
  const [activeModule, setActiveModule] = useState(MODULES[0].id);
  const [activeAIIndex, setActiveAIIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveAIIndex((prev) => (prev + 1) % AI_FEATURES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary font-sans overflow-x-clip">
      
      {/* NAVIGATION */}
      <motion.nav 
        variants={{
          visible: { y: 0 },
          hidden: { y: "-100%" },
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl"
      >
        <div className="container mx-auto px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer transition-transform active:scale-95">
             <Logo iconClassName="w-10 h-10" showText />
          </div>
          <div className="hidden md:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#ecosystem" className="hover:text-primary transition-colors">Ecosystem</Link>
            <Link href="#events" className="hover:text-primary transition-colors">Explore</Link>
          </div>
          <div className="flex items-center gap-6">
             {mounted && (
               <button 
                 onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                 className="p-3 rounded-2xl bg-muted/40 border border-border/40 transition-all text-muted-foreground hover:text-foreground active:scale-90"
                 aria-label="Toggle Theme"
               >
                 {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
               </button>
             )}
             <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-all hidden sm:block">Login</Link>
             <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest text-[10px] px-8 h-11 border-none shadow-glow shadow-primary/20 transition-all active:scale-95" asChild>
                <Link href="/register">Get Started</Link>
             </Button>
          </div>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
        <motion.div 
          style={{ opacity, scale }}
          initial="hidden" 
          animate="visible" 
          variants={STAGGER} 
          className="relative z-10 w-full max-w-6xl space-y-12 flex flex-col items-center"
        >
          <motion.h1 variants={FADE_UP} className="text-5xl md:text-8xl font-display font-medium tracking-[-0.05em] leading-[0.85] text-foreground">
            Discussion to <br />
            <span className="text-primary italic">Execution.</span>
          </motion.h1>

          <motion.p variants={FADE_UP} className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium opacity-70">
            Eventra is your intelligent workspace for live experiences. <br className="hidden md:block" />
            Unified, AI-driven, and engineered for high-performance delivery.
          </motion.p>

          <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <Button size="xl" className="rounded-full px-12 h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest text-sm shadow-glow shadow-primary/30 border-none transition-all hover:scale-105 active:scale-95" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
            <Button size="xl" variant="outline" className="rounded-full px-12 h-14 border-border/60 bg-background/40 backdrop-blur-md hover:bg-muted font-black uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95 shadow-xl" asChild>
              <Link href="#ecosystem">Explore Mesh</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview - Professional High Fidelity App UI */}
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24 relative w-full max-w-7xl aspect-[16/10] mx-auto rounded-[3rem] border-[12px] border-muted/80 bg-background shadow-[0_100px_200px_-40px_rgba(0,0,0,0.5)] overflow-hidden group flex ring-1 ring-white/10"
        >
           {/* Sidebar Navigation */}
           <div className="w-20 md:w-64 border-r border-border/50 bg-muted/20 flex flex-col p-6 shrink-0 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-10 px-2">
                 <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Logo iconClassName="w-6 h-6 text-primary-foreground" />
                 </div>
                 <span className="font-display font-black text-xl hidden md:block tracking-tighter uppercase">Eventra<span className="text-primary italic">.</span></span>
              </div>
              
              <div className="space-y-1">
                 {[
                   { i: Activity, l: "Overview", a: true },
                   { i: Calendar, l: "Events" },
                   { i: Users, l: "Attendees" },
                   { i: BarChart3, l: "Revenue" },
                   { i: Bot, l: "AI Agent" },
                   { i: Globe, l: "Network" }
                 ].map((item, i) => (
                   <motion.div 
                     key={i} 
                     whileHover={{ x: 4, backgroundColor: 'rgba(var(--primary), 0.05)' }}
                     className={cn(
                       "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all cursor-pointer group/nav",
                       item.a ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30" : "text-muted-foreground hover:text-foreground"
                     )}
                   >
                      <item.i className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-bold hidden md:block tracking-tight">{item.l}</span>
                   </motion.div>
                 ))}
              </div>
              
              <div className="mt-auto space-y-6 px-2">
                 <div className="p-5 rounded-[2rem] bg-background/40 border border-border/40 hidden md:block shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                       <p className="text-[9px] font-black uppercase text-primary tracking-[0.2em]">Mesh Pro</p>
                       <Zap className="w-3 h-3 text-primary" />
                    </div>
                    <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         whileInView={{ width: '75%' }}
                         transition={{ duration: 1.5, delay: 1 }}
                         className="h-full bg-primary" 
                       />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-3 font-bold">14.2GB / 20GB Sync</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-muted to-border border border-border shrink-0 shadow-inner" />
                    <div className="hidden md:block">
                       <p className="text-xs font-black leading-none uppercase tracking-wider">Sarah Miller</p>
                       <p className="text-[9px] text-primary mt-1.5 font-black uppercase tracking-widest">Organizer</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Main App Area */}
           <div className="flex-1 flex flex-col min-w-0 bg-muted/5">
              {/* Browser Header Bar */}
              <div className="h-14 border-b border-border/50 flex items-center justify-between px-10 shrink-0 bg-background/40 backdrop-blur-md">
                 <div className="flex items-center gap-4 flex-1">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/30" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
                    </div>
                    <div className="h-8 flex-1 max-w-xl bg-muted/20 border border-border/40 rounded-xl flex items-center px-5 gap-3 ml-6">
                       <Globe className="w-3 h-3 text-muted-foreground/40" />
                       <span className="text-[10px] font-mono text-muted-foreground/50 tracking-widest select-none">https://eventra.cloud/mission-control</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Live</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted/40 border border-border/40" />
                 </div>
              </div>

              {/* Sub Header / Breadcrumbs */}
              <div className="h-16 border-b border-border/30 flex items-center justify-between px-10 shrink-0 bg-background/20">
                 <div className="flex items-center gap-6">
                    <h2 className="text-lg font-black tracking-tight uppercase tracking-widest text-foreground/80">Dashboard</h2>
                    <div className="h-4 w-px bg-border/40" />
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                       <Activity className="w-3 h-3 text-primary" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-primary">Operational</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-background/40 transition-colors"><Calendar className="w-4 h-4 text-muted-foreground" /></Button>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-background/40 transition-colors"><Users className="w-4 h-4 text-muted-foreground" /></Button>
                    <Button size="sm" variant="outline" className="rounded-xl px-5 font-black h-9 text-[9px] uppercase tracking-[0.2em] border-border/40 bg-background/40 shadow-sm hover:bg-background">Share Intel</Button>
                 </div>
              </div>

              {/* Dashboard Content */}
              <div className="flex-1 p-10 overflow-hidden flex flex-col gap-8">
                 {/* Top Metrics Row */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0">
                    {[
                      { l: "Monthly Revenue", v: "$124,500", c: "+12.4%", i: BarChart3, color: "text-emerald-500" },
                      { l: "Active Attendees", v: "14,202", c: "+8.1%", i: Users, color: "text-primary" },
                      { l: "Event Velocity", v: "98.2%", c: "+2.4%", i: Zap, color: "text-amber-500" }
                    ].map((m, i) => (
                      <motion.div 
                        key={i} 
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="p-8 rounded-[2.5rem] border border-border/40 bg-background flex flex-col justify-between h-44 shadow-sm hover:shadow-2xl hover:shadow-primary/5 cursor-pointer transition-all duration-500"
                      >
                         <div className="flex justify-between items-start">
                            <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.3em]">{m.l}</span>
                            <div className={cn("w-10 h-10 rounded-2xl bg-muted/40 flex items-center justify-center transition-colors border border-border/40", m.color)}>
                               <m.i className="w-5 h-5" />
                            </div>
                         </div>
                         <div className="flex items-end justify-between">
                            <span className="text-4xl font-display font-bold tracking-tighter">{m.v}</span>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black tracking-widest">
                               <ArrowRight className="w-3 h-3 -rotate-45" />
                               {m.c}
                            </div>
                         </div>
                      </motion.div>
                    ))}
                 </div>

                 {/* Main Chart Area - Refined Data Viz */}
                 <motion.div 
                   layout
                   className="flex-1 min-h-0 rounded-[3rem] border border-border/40 bg-background p-10 flex flex-col gap-8 relative overflow-hidden shadow-sm"
                 >
                    <div className="flex items-center justify-between relative z-10 shrink-0">
                       <div className="space-y-1.5">
                          <h3 className="text-xl font-bold tracking-tight">Growth Projection</h3>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Real-time attendance & revenue tracking across nodes</p>
                       </div>
                       <div className="flex bg-muted/30 p-1.5 rounded-2xl gap-1.5 border border-border/40">
                          {['D', 'W', 'M'].map(t => (
                            <button key={t} className={cn("w-10 h-10 rounded-xl text-[10px] font-black transition-all", t === 'W' ? 'bg-background shadow-lg text-primary border border-border/40' : 'text-muted-foreground hover:text-foreground hover:bg-background/20')}>{t}</button>
                          ))}
                       </div>
                    </div>

                    <div className="flex-1 flex items-end gap-3 px-2 relative z-10 min-h-0">
                       {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95, 75, 85, 60, 40, 55, 70, 90, 100, 80, 60, 85, 45, 75, 90, 60, 70, 50, 80, 65, 40].map((h, i) => (
                         <motion.div 
                           key={i} 
                           initial={{ height: 0 }}
                           whileInView={{ height: `${h}%` }}
                           whileHover={{ scaleY: 1.05, backgroundColor: 'var(--primary)', opacity: 1 }}
                           transition={{ 
                             height: { delay: i * 0.02, duration: 1, ease: [0.16, 1, 0.3, 1] },
                             scaleY: { duration: 0.2 }
                           }}
                           className="flex-1 bg-primary/10 rounded-full cursor-pointer transition-all duration-300 opacity-60" 
                         />
                       ))}
                    </div>

                    {/* Grid Overlay for realism */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />
                 </motion.div>
              </div>
           </div>
        </motion.div>
      </section>

      {/* TECHNICAL EXCELLENCE BANNER */}
      <section className="py-12 border-y border-border/60 bg-muted/20">
        <div className="container mx-auto px-10">
           <div className="flex flex-col md:flex-row items-center justify-around gap-12 md:gap-24">
              <div className="flex flex-col items-center md:items-start">
                 <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-2">Latency</span>
                 <span className="text-2xl font-display font-bold text-foreground tracking-tighter">0.4ms Global Avg.</span>
              </div>
              <div className="flex flex-col items-center md:items-start md:border-l border-border/60 md:pl-24 hidden md:flex">
                 <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-2">Reliability</span>
                 <span className="text-2xl font-display font-bold text-foreground tracking-tighter">99.99% Uptime</span>
              </div>
              <div className="flex flex-col items-center md:items-start md:border-l border-border/60 md:pl-24 hidden lg:flex">
                 <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-2">Security</span>
                 <span className="text-2xl font-display font-bold text-foreground tracking-tighter">AES-256 E2E</span>
              </div>
              <div className="flex flex-col items-center md:items-start md:border-l border-border/60 md:pl-24">
                 <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-2">Architecture</span>
                 <span className="text-2xl font-display font-bold text-foreground tracking-tighter">Edge-First Core</span>
              </div>
           </div>
        </div>
      </section>

      {/* MODULE NAVIGATION */}
      <section id="ecosystem" className="py-16 relative">
        <div className="container mx-auto px-6 md:px-10">
          <div className="max-w-3xl mb-12">
             <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary rounded-full px-5 py-1.5 text-[11px] uppercase font-black tracking-[0.3em]">Integrated Ecosystem</Badge>
             <h2 className="text-4xl md:text-7xl font-display font-bold tracking-tighter mb-6 text-foreground leading-[1.05]">Built for scale.</h2>
             <p className="text-lg text-muted-foreground leading-relaxed font-medium opacity-90 max-w-2xl">
               Hover through our core modules to see how Eventra orchestrates every layer of your experience with surgical precision.
             </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 items-start">
            {/* Module List */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
               {MODULES.map((module) => (
                 <button
                   key={module.id}
                   onMouseEnter={() => setActiveModule(module.id)}
                   className={`w-full text-left p-6 rounded-[2rem] border transition-all duration-500 flex flex-col gap-4 group relative ${
                     activeModule === module.id 
                       ? 'bg-muted border-primary shadow-glow shadow-primary/10 -translate-y-1' 
                       : 'bg-background border-border/60 hover:border-muted-foreground/30'
                   }`}
                 >
                   <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all duration-500 ${
                     activeModule === module.id ? 'bg-primary text-primary-foreground border-primary scale-110' : 'bg-muted border-border/60 text-muted-foreground group-hover:text-foreground'
                   }`}>
                     <module.icon className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className={`text-xs font-black uppercase tracking-widest transition-colors ${
                       activeModule === module.id ? 'text-foreground' : 'text-muted-foreground'
                     }`}>{module.title}</h3>
                   </div>
                   {activeModule === module.id && (
                     <motion.div 
                       layoutId="active-module-pill"
                       className="absolute inset-0 border border-primary/40 rounded-[2rem] pointer-events-none"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                     />
                   )}
                 </button>
               ))}
            </div>

            {/* Module Preview */}
            <div className="lg:col-span-7 relative rounded-[2.5rem] border border-border/60 bg-muted/20 backdrop-blur-md overflow-hidden flex flex-col p-0 min-h-[500px] shadow-2xl">
               <div className="h-12 border-b border-border/60 bg-muted/30 flex items-center px-6 gap-3 shrink-0">
                  <div className="flex gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/20 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/20 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/20 shadow-sm" />
                  </div>
                  <div className="ml-6 text-[10px] font-mono text-muted-foreground/60 uppercase tracking-[0.4em]">
                    {MODULES.find(m => m.id === activeModule)?.title} Module Preview
                  </div>
               </div>
               
               <div className="flex-1 p-8 md:p-12 flex flex-col min-h-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeModule}
                      initial={{ opacity: 0, scale: 0.98, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 1.02, x: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="flex-1 flex flex-col min-h-0"
                    >
                      <div className="flex-1 min-h-0">
                        {MODULES.find(m => m.id === activeModule)?.preview}
                      </div>
                      
                      <div className="mt-8 md:mt-10 pt-8 border-t border-border/60 shrink-0">
                         <h4 className="text-xl md:text-2xl font-bold text-foreground mb-3">Key Capabilities</h4>
                         <p className="text-muted-foreground text-sm md:text-base font-medium leading-loose">
                            {MODULES.find(m => m.id === activeModule)?.description}
                         </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
               </div>
               
               {/* Decorative background for preview */}
               <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] blur-3xl" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* SMART TOOLS CAROUSEL */}
      <section id="features" className="py-32 bg-muted/20 overflow-hidden">
        <div className="container mx-auto px-10">
           <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-20">
              <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary rounded-full px-5 py-1.5 text-[11px] uppercase font-black tracking-[0.3em]">Neural Augmentation</Badge>
              <h2 className="text-4xl md:text-7xl font-display font-bold tracking-tighter mb-6 text-foreground leading-[1.05]">Smart Tools for <br /> Smarter Events.</h2>
              <p className="text-base text-muted-foreground leading-loose font-medium opacity-90 max-w-3xl">
                Our neural layer automates the heavy lifting, extracting actionable insights from every interaction.
              </p>
           </div>

           <div className="relative">
              <div className="flex justify-center gap-6 mb-12">
                 {AI_FEATURES.map((_, i) => (
                   <button 
                     key={i}
                     onMouseEnter={() => setActiveAIIndex(i)}
                     className={`group relative h-10 w-10 flex items-center justify-center`}
                   >
                      <span className={`text-sm font-mono font-bold transition-colors ${activeAIIndex === i ? 'text-primary' : 'text-muted-foreground/60'}`}>0{i+1}</span>
                      {activeAIIndex === i && (
                        <motion.div 
                          layoutId="ai-indicator"
                          className="absolute inset-0 border-b-2 border-primary"
                        />
                      )}
                   </button>
                 ))}
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                 {AI_FEATURES.map((feature, i) => (
                   <motion.div
                     key={i}
                     initial={false}
                     animate={{ 
                       opacity: activeAIIndex === i ? 1 : 0.4,
                       y: activeAIIndex === i ? 0 : 20,
                       scale: activeAIIndex === i ? 1 : 0.95,
                     }}
                     transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                     className={`p-8 rounded-[2rem] border transition-all cursor-pointer ${
                        activeAIIndex === i 
                          ? 'border-primary bg-background shadow-2xl shadow-primary/10' 
                          : 'border-border/60 bg-background/50 hover:border-muted-foreground/30'
                     }`}
                     onMouseEnter={() => setActiveAIIndex(i)}
                   >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                         activeAIIndex === i ? 'bg-primary text-primary-foreground shadow-glow scale-110' : 'bg-muted text-muted-foreground'
                      }`}>
                         <feature.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold mb-4 text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground text-xs md:text-sm leading-relaxed font-medium opacity-90">{feature.description}</p>
                   </motion.div>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* INTEGRATION VISUALIZATION */}
      <section className="py-24 relative bg-background/50 overflow-hidden">
        <div className="container mx-auto px-10 text-center">
           <h2 className="text-5xl md:text-7xl font-display font-bold tracking-tighter text-foreground mb-8 leading-[0.95]">
              Unified <span className="text-primary italic font-black">Control.</span>
           </h2>
           <p className="text-base text-muted-foreground max-w-3xl mx-auto mb-20 font-medium leading-loose opacity-90">
             Eventra consolidates your stack into a single, high-performance ecosystem, streaming real-time operational data into your core dashboard.
           </p>
           
           <div className="relative max-w-6xl mx-auto min-h-[500px] flex items-center justify-between gap-12 px-6 md:px-24">
              {/* Connecting Lines SVG */}
              <div className="absolute inset-0 pointer-events-none hidden md:block" style={{ zIndex: 0 }}>
                 <svg className="w-full h-full" viewBox="0 0 800 500" fill="none" preserveAspectRatio="none">
                    {[
                      "M 280 100 Q 400 100 520 250",
                      "M 280 180 Q 400 180 520 250",
                      "M 280 260 Q 400 260 520 250",
                      "M 280 340 Q 400 340 520 250",
                      "M 280 420 Q 400 420 520 250"
                    ].map((d, i) => (
                      <g key={i}>
                        <path d={d} stroke="currentColor" strokeWidth="1" className="text-primary/10 dark:text-primary/20" />
                        <motion.path
                          d={d}
                          stroke="url(#line-gradient)"
                          strokeWidth="2"
                          strokeDasharray="20 100"
                          initial={{ strokeDashoffset: 120 }}
                          animate={{ strokeDashoffset: -120 }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity, 
                            ease: "linear",
                            delay: i * 0.4
                          }}
                        />
                      </g>
                    ))}
                    <defs>
                      <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                 </svg>
              </div>

              {/* Left Side: Tool Cards */}
              <div className="flex flex-col gap-6 relative z-10 w-full md:w-auto">
                 {[
                   { label: "Confluence", icon: Layers, color: "text-blue-500" },
                   { label: "Notion", icon: Search, color: "text-foreground" },
                   { label: "Slack", icon: MessageSquare, color: "text-purple-500" },
                   { label: "Todoist", icon: CheckCircle2, color: "text-red-500" },
                   { label: "Miro Board", icon: Globe, color: "text-yellow-500" }
                 ].map((tool, i) => (
                   <motion.div
                     key={i}
                     initial={{ opacity: 0, x: -30 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.1, duration: 0.8 }}
                     className="flex items-center gap-5 bg-background/80 backdrop-blur-sm border border-border/40 px-8 py-5 rounded-[1.5rem] shadow-2xl ring-1 ring-white/5 w-full md:w-72 group hover:border-primary/40 transition-all cursor-default hover:-translate-y-1"
                   >
                      <div className={cn("w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-muted border border-border/20", tool.color)}>
                         <tool.icon className="w-6 h-6" />
                      </div>
                      <span className="font-black text-foreground text-base tracking-tight uppercase">{tool.label}</span>
                   </motion.div>
                 ))}
              </div>

              {/* Right Side: Central Eventra Hub */}
              <div className="relative z-10 hidden md:block">
                 <motion.div 
                   animate={{ scale: [1, 1.02, 1] }}
                   transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                   className="relative group rounded-[5rem]"
                 >
                    <div className="w-64 h-64 rounded-[4.5rem] bg-primary flex items-center justify-center relative overflow-hidden border-4 border-white/10 shadow-[0_0_100px_rgba(var(--primary),0.3)]">
                       <Logo 
                         iconClassName="w-40 h-48 bg-transparent shadow-none p-0" 
                         className="gap-0" 
                       />
                       <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none opacity-50" />
                    </div>
                    {/* Animated outer rings */}
                    <div className="absolute inset-0 -m-6 border-2 border-primary/20 rounded-[5rem] animate-pulse" />
                    <div className="absolute inset-0 -m-12 border border-primary/10 rounded-[5.5rem] animate-pulse delay-700" />
                 </motion.div>
              </div>
           </div>
        </div>
      </section>

      {/* LIVE INFRASTRUCTURE STATUS */}
      <section id="events" className="py-24 bg-background/50">
        <div className="container mx-auto px-10">
           <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="max-w-2xl text-left">
                 <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary rounded-full px-5 py-1.5 text-[11px] uppercase font-black tracking-[0.3em]">Infrastructure Pulse</Badge>
                 <h2 className="text-4xl md:text-7xl font-display font-bold tracking-tighter text-foreground leading-[1.05]">Edge Nodes.</h2>
                 <p className="mt-4 text-lg text-muted-foreground font-medium opacity-90 leading-relaxed">
                   Real-time synchronization status across our global high-availability network.
                 </p>
              </div>
              <Button size="xl" variant="outline" className="border-border/60 hover:bg-muted rounded-full font-black px-10 h-14 transition-all hover:scale-105 text-lg" asChild>
                 <Link href="/explore">View Network</Link>
              </Button>
           </div>

           <div className="grid md:grid-cols-3 gap-10">
             {featuredEvents.length > 0 ? featuredEvents.slice(0, 3).map((event) => (
               <EventCard key={event.id} event={event} />
             )) : (
               [
                 { name: "North_America_East", region: "Virginia, US" },
                 { name: "Europe_Central_1", region: "Frankfurt, DE" },
                 { name: "Asia_Pacific_South", region: "Mumbai, IN" }
               ].map((node, i) => (
                 <div key={i} className="rounded-[3rem] border border-border/60 bg-muted/10 p-10 flex flex-col gap-8 group relative overflow-hidden transition-all hover:border-primary/30 hover:-translate-y-2 shadow-xl hover:shadow-primary/5">
                    <div className="flex justify-between items-start">
                       <div className="w-14 h-14 rounded-2xl bg-background border border-border/60 flex items-center justify-center shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:border-primary/20">
                          <Activity className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                       </div>
                       <div className="px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                          Active
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="h-6 w-full bg-muted/40 rounded-full overflow-hidden relative border border-border/10">
                          <motion.div 
                            className="absolute inset-y-0 left-0 bg-primary/40 shadow-[0_0_20px_var(--primary)]"
                            animate={{ 
                              x: ['-100%', '100%'],
                              width: ['20%', '40%', '20%']
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          />
                       </div>
                       <div className="h-4 w-2/3 bg-muted/20 rounded-full" />
                    </div>
                    <div className="pt-8 mt-auto border-t border-border/60 flex justify-between items-center text-[11px] font-mono font-black text-muted-foreground/50 uppercase tracking-[0.3em]">
                       <span>{node.name}</span>
                       <span className="flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-primary" />
                         {node.region}
                       </span>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 relative overflow-hidden border-t border-border/60">
        <div className="absolute inset-0 bg-primary/5 blur-[150px] rounded-full translate-y-1/2" />
        <div className="container mx-auto px-10 relative z-10 text-center space-y-12">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md mb-6"
           >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span className="text-[11px] font-black tracking-[0.3em] uppercase text-primary">Public Beta v0.1_Operational</span>
           </motion.div>
           
           <h2 className="text-5xl md:text-8xl font-display font-bold tracking-tighter leading-[0.9] text-foreground">Scale your next <br /> <span className="text-primary italic">experience.</span></h2>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-6">
              <Button size="xl" className="rounded-full px-16 h-16 bg-primary text-primary-foreground hover:bg-primary/90 font-black text-lg shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 shadow-glow border-none" asChild>
                 <Link href="/register">Get Started Free</Link>
              </Button>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-all flex items-center gap-4 group font-black text-base px-12 py-4 rounded-full hover:bg-muted ring-1 ring-border/40">
                 Contact Sales <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
           </div>
        </div>
      </section>

      <footer className="border-t border-border/60 pt-16 pb-10 bg-background relative z-10">
        <div className="container mx-auto px-10">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-16">
              <div className="col-span-2 md:col-span-1 space-y-6">
                 <Logo showText />
                 <p className="text-sm text-muted-foreground leading-relaxed max-w-xs font-bold opacity-70">
                    Engineered for high-performance delivery of modern live experiences.
                 </p>
              </div>
              {['Product', 'Company', 'Support'].map((cat) => (
                <div key={cat} className="space-y-6">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-50">{cat}</h4>
                   <ul className="space-y-4 text-xs text-muted-foreground font-black uppercase tracking-widest">
                      {['Features', 'Ecosystem', 'Network'].map((item) => (
                        <li key={item}><Link href="#" className="hover:text-primary transition-colors">{item}</Link></li>
                      ))}
                   </ul>
                </div>
              ))}
           </div>
           
           <div className="pt-10 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-10 text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.4em]">
                 <span>© 2026 Eventra Protocol Inc.</span>
                 <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-glow" />
                    <span className="text-emerald-500/80">Systems_Nominal</span>
                 </div>
              </div>
              <div className="flex gap-6">
                 {[Globe, Terminal, MessageSquare].map((Icon, i) => (
                   <div key={i} className="w-10 h-10 rounded-2xl border border-border/40 flex items-center justify-center hover:bg-muted transition-all cursor-pointer text-muted-foreground hover:text-primary shadow-sm hover:-translate-y-1">
                      <Icon className="w-4 h-4" />
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
