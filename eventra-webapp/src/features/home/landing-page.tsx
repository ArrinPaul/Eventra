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
  Bot,
  ZapOff,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Moon,
  Sun,
  Trophy
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
    id: 'messaging',
    title: 'Networking',
    icon: MessageSquare,
    description: 'High-performance real-time networking for attendees and organizers.',
    preview: (
      <div className="w-full bg-muted/30 rounded-2xl border border-border p-6 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
           <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-[10px]">JD</div>
           <div className="flex flex-col">
              <span className="text-[10px] font-bold text-foreground leading-none">John Doe</span>
              <span className="text-[8px] text-emerald-500 font-medium italic">Authorized</span>
           </div>
        </div>
        <div className="flex flex-col gap-3">
           <div className="self-start bg-muted/50 p-2.5 rounded-2xl rounded-tl-none max-w-[85%]">
              <p className="text-[10px] text-foreground/80 leading-tight font-medium">Verified your session track for tomorrow?</p>
           </div>
           <div className="self-end bg-primary p-2.5 rounded-2xl rounded-tr-none max-w-[85%] border border-primary text-primary-foreground">
              <p className="text-[10px] font-bold leading-tight">Yes! Registered for the AI Strategy workshop. 🚀</p>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'experience',
    title: 'Experience',
    icon: Sparkles,
    description: 'Gamified attendee progression with experience points and levels.',
    preview: (
      <div className="w-full bg-muted/30 rounded-2xl border border-border p-6 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
           <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Growth progression</span>
           <Badge variant="secondary" className="text-[8px] font-black uppercase py-0 px-1.5 bg-primary text-primary-foreground border-none">Level 12</Badge>
        </div>
        <div className="space-y-4">
           <div className="p-4 rounded-xl bg-background border border-border shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                 <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                 <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-foreground uppercase">Next Milestone</span>
                    <span className="text-[9px] font-mono text-muted-foreground">850 / 1200 XP</span>
                 </div>
                 <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[70%]" />
                 </div>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-background border border-border shadow-sm flex flex-col gap-1">
                 <span className="text-[8px] font-black text-muted-foreground uppercase">Badges</span>
                 <span className="text-xs font-black text-foreground">8 / 15</span>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border shadow-sm flex flex-col gap-1">
                 <span className="text-[8px] font-black text-muted-foreground uppercase">Streak</span>
                 <span className="text-xs font-black text-foreground">5 Days</span>
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
      <div className="w-full bg-muted/30 rounded-2xl border border-border p-6 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4">
           <span className="text-[10px] font-black text-foreground uppercase">May 2026</span>
           <div className="flex gap-1.5">
              <div className="w-5 h-5 rounded-md border border-border flex items-center justify-center text-[8px] bg-background">‹</div>
              <div className="w-5 h-5 rounded-md border border-border flex items-center justify-center text-[8px] bg-background">›</div>
           </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
           {Array.from({ length: 14 }).map((_, i) => {
             const isEvent = i === 5 || i === 8 || i === 12;
             return (
               <div key={i} className={cn(
                 "aspect-square rounded-lg border p-1 transition-all flex flex-col gap-0.5",
                 isEvent ? "bg-primary/20 border-primary/40 shadow-glow shadow-primary/10" : "bg-background border-border/50"
               )}>
                  <span className="text-[7px] font-mono text-muted-foreground">{i + 1}</span>
                  {isEvent && (
                    <div className="h-1 w-full bg-primary rounded-full" />
                  )}
               </div>
             );
           })}
        </div>
        <div className="mt-4 p-2 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
           <span className="text-[9px] font-bold text-foreground">Next: Keynote Session @ 10 AM</span>
        </div>
      </div>
    )
  },
  {
    id: 'boards',
    title: 'Campaigns',
    icon: Layers,
    description: 'Visualize your event pipeline with intuitive drag-and-drop boards.',
    preview: (
      <div className="w-full bg-muted/30 rounded-2xl border border-border p-6 flex gap-3 overflow-hidden">
        {[
          { label: "Pipeline", cards: ["Sponsors", "Artist"] },
          { label: "Approved", cards: ["Venue"] }
        ].map((col, idx) => (
          <div key={idx} className="flex-1 flex flex-col gap-2.5">
             <span className="text-[8px] font-black uppercase text-muted-foreground px-1">{col.label}</span>
             {col.cards.map((card, cIdx) => (
               <div key={cIdx} className="bg-background rounded-xl border border-border p-2.5 shadow-sm">
                  <p className="text-[9px] font-bold text-foreground">{card}</p>
                  <div className="h-1 w-2/3 bg-muted rounded-full mt-2" />
               </div>
             ))}
             <div className="border-2 border-dashed border-border rounded-xl h-8 flex items-center justify-center text-[8px] text-muted-foreground font-black uppercase bg-muted/10">
                + Add
             </div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 'reports',
    title: 'Revenue',
    icon: BarChart3,
    description: 'Deep analytics and real-time ticketing revenue tracking.',
    preview: (
      <div className="w-full bg-muted/30 rounded-2xl border border-border p-6 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6">
           <div className="space-y-0.5">
              <span className="text-[10px] font-black text-foreground uppercase text-primary">Ticketing Flow</span>
              <p className="text-[8px] text-muted-foreground font-medium uppercase tracking-tight italic">Live generated value</p>
           </div>
           <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              <span className="text-[8px] font-black text-primary uppercase">Active</span>
           </div>
        </div>
        <div className="h-24 flex items-end gap-1 px-1">
          {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95, 75, 80, 55, 90, 100].map((h, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.03, duration: 0.5 }}
              className="flex-1 bg-gradient-to-t from-primary to-primary/40 rounded-t-[1px]"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border/50">
           <div className="space-y-0.5">
              <span className="text-[7px] font-bold text-muted-foreground uppercase">Total Revenue</span>
              <p className="text-[10px] font-mono font-black text-foreground tracking-tighter">$12,450.00</p>
           </div>
           <div className="space-y-0.5 text-right">
              <span className="text-[7px] font-bold text-muted-foreground uppercase">Avg Ticket</span>
              <p className="text-[10px] font-mono font-black text-primary tracking-tighter">$45.00</p>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'dashboard',
    title: 'Command',
    icon: Cpu,
    description: 'The mission control for your entire experience delivery.',
    preview: (
      <div className="w-full bg-muted/30 rounded-2xl border border-border p-6 flex flex-col gap-4 overflow-hidden">
         <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-primary border border-primary p-3 flex flex-col justify-center gap-0.5 shadow-sm">
               <span className="text-[7px] uppercase font-black text-primary-foreground/70 tracking-widest">Active Events</span>
               <div className="text-sm font-black text-primary-foreground italic leading-none">24</div>
            </div>
            <div className="rounded-xl bg-background border border-border p-3 flex flex-col justify-center gap-0.5 shadow-sm">
               <span className="text-[7px] uppercase font-black text-muted-foreground tracking-widest">Reach</span>
               <div className="text-sm font-black text-foreground italic leading-none">14.2k</div>
            </div>
         </div>
         <div className="flex-1 rounded-xl bg-background border border-border p-3 flex flex-col gap-2.5 shadow-sm">
            <span className="text-[9px] font-black text-foreground uppercase tracking-wider">Campaign Velocity</span>
            <div className="space-y-1.5">
               {[
                 { t: "Winter Tech Summit", s: "92%", c: "text-primary" },
                 { t: "Global Hackathon", s: "45%", c: "text-muted-foreground" }
               ].map((act, i) => (
                 <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-[9px] font-bold text-foreground/80">{act.t}</span>
                    <span className={cn("text-[8px] font-mono font-black uppercase", act.c)}>{act.s}</span>
                 </div>
               ))}
            </div>
         </div>
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
    <div ref={containerRef} className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary font-sans overflow-x-hidden">
      
      {/* NAVIGATION */}
      <motion.nav 
        variants={{
          visible: { y: 0 },
          hidden: { y: "-100%" },
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="fixed top-0 w-full z-50 border-b border-border bg-background backdrop-blur-md"
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-display font-bold tracking-tight text-lg text-foreground">Eventra</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#ecosystem" className="hover:text-primary transition-colors">Ecosystem</Link>
            <Link href="#events" className="hover:text-primary transition-colors">Explore</Link>
          </div>
          <div className="flex items-center gap-4">
             {mounted && (
               <button 
                 onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                 className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                 aria-label="Toggle Theme"
               >
                 {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
               </button>
             )}
             <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Login</Link>
             <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5 border-none" asChild>
                <Link href="/register">Sign Up</Link>
             </Button>
          </div>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <section className="relative pt-44 pb-32 px-4 flex flex-col items-center justify-center text-center overflow-hidden">
        <motion.div 
          style={{ opacity, scale }}
          initial="hidden" 
          animate="visible" 
          variants={STAGGER} 
          className="relative z-10 max-w-4xl space-y-8"
        >
          <motion.h1 variants={FADE_UP} className="text-5xl md:text-8xl font-display font-medium tracking-tight leading-[1.05] text-foreground">
            Discussion to <br />
            <span className="text-primary italic">Execution.</span>
          </motion.h1>

          <motion.p variants={FADE_UP} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
            Eventra is your smart work management suite for live experiences. Unified, AI-driven, and built for performance.
          </motion.p>

          <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button size="lg" className="rounded-full px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-transform hover:scale-105 shadow-glow shadow-primary/20 border-none" asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12 border-border bg-background/50 backdrop-blur-sm hover:bg-muted font-bold transition-transform hover:scale-105" asChild>
              <Link href="#ecosystem">Discover More</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24 relative w-full max-w-6xl aspect-[16/9] mx-auto rounded-3xl border border-border bg-muted/20 backdrop-blur-sm overflow-hidden shadow-2xl"
        >
           <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
           <div className="absolute top-0 left-0 right-0 h-12 border-b border-border bg-muted/30 flex items-center px-4 gap-2 z-20">
              <div className="flex gap-2 mr-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/20 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/20 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/20 shadow-sm" />
              </div>
              <div className="mx-auto text-[10px] font-mono text-muted-foreground uppercase tracking-widest pl-12">eventra.cloud/dashboard</div>
           </div>
           
           <div className="p-8 pt-20 grid grid-cols-12 gap-6">
              {/* Main Content Area */}
              <div className="col-span-8 space-y-6">
                 {/* Live Analytics Chart Area */}
                 <div className="h-56 rounded-2xl bg-background/40 border border-border/50 p-6 flex flex-col gap-4 shadow-xl">
                    <div className="flex items-center justify-between">
                       <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase text-primary tracking-widest">Campaign Pulse</span>
                          <span className="text-xs font-bold text-foreground italic">Live Revenue Visualization</span>
                       </div>
                       <div className="flex items-center gap-2 px-2 py-1 rounded bg-primary text-primary-foreground border border-primary text-[8px] font-black uppercase">
                          Real-time
                       </div>
                    </div>
                    <div className="flex-1 flex items-end gap-2 px-2">
                       {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95, 75, 85, 60, 40, 55].map((h, i) => (
                         <div key={i} className="flex-1 bg-primary/80 rounded-t-sm" style={{ height: `${h}%` }} />
                       ))}
                    </div>
                 </div>
                 
                 {/* Bottom Stats Cards */}
                 <div className="grid grid-cols-3 gap-6">
                    {[
                      { l: "Active Campaigns", v: "24" },
                      { l: "Total Reach", v: "1.2M" },
                      { l: "Generated Value", v: "$42.5k" }
                    ].map((stat, i) => (
                      <div key={i} className="h-28 rounded-2xl bg-background/40 border border-border/50 p-5 flex flex-col justify-between shadow-lg">
                         <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{stat.l}</span>
                         <span className="text-lg font-black text-foreground italic">{stat.v}</span>
                      </div>
                    ))}
                 </div>
              </div>
              
              {/* Sidebar Info Area */}
              <div className="col-span-4 space-y-6">
                 <div className="h-full rounded-2xl bg-muted/40 border border-border/50 p-6 space-y-6 shadow-xl">
                    <span className="text-[10px] font-black uppercase text-foreground tracking-widest block mb-4">Activity Center</span>
                    {[
                      { t: "New Ticket Registered", s: "4s ago" },
                      { t: "Campaign Created", s: "12m ago" },
                      { t: "Revenue Milestone", s: "1h ago" },
                      { t: "Team Member Invited", s: "2h ago" },
                      { t: "Feedback Batch Recv.", s: "4h ago" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-glow shadow-primary/40" />
                         <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-foreground truncate">{item.t}</span>
                            <span className="text-[8px] font-medium text-muted-foreground uppercase">{item.s}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </motion.div>
      </section>

      {/* TECHNICAL EXCELLENCE BANNER */}
      <section className="py-12 border-y border-border bg-muted/20">
        <div className="container mx-auto px-6">
           <div className="flex flex-col md:flex-row items-center justify-around gap-8 md:gap-16">
              <div className="flex flex-col items-center md:items-start">
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Latency</span>
                 <span className="text-xl font-display font-bold text-foreground tracking-tighter">0.4ms Global Avg.</span>
              </div>
              <div className="flex flex-col items-center md:items-start md:border-l border-border md:pl-16 hidden md:flex">
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Reliability</span>
                 <span className="text-xl font-display font-bold text-foreground tracking-tighter">99.99% Uptime</span>
              </div>
              <div className="flex flex-col items-center md:items-start md:border-l border-border md:pl-16 hidden lg:flex">
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Security</span>
                 <span className="text-xl font-display font-bold text-foreground tracking-tighter">AES-256 E2E</span>
              </div>
              <div className="flex flex-col items-center md:items-start md:border-l border-border md:pl-16">
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Architecture</span>
                 <span className="text-xl font-display font-bold text-foreground tracking-tighter">Edge-First Core</span>
              </div>
           </div>
        </div>
      </section>

      {/* MODULE NAVIGATION */}
      <section id="ecosystem" className="py-40 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-24">
             <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary rounded-full px-3 py-0.5 text-[10px] uppercase font-bold tracking-widest">Integrated Ecosystem</Badge>
             <h2 className="text-4xl md:text-6xl font-display font-medium tracking-tight mb-6 text-foreground">Built for scale.</h2>
             <p className="text-lg text-muted-foreground leading-relaxed">Hover through our core modules to see how Eventra orchestrates every layer of your experience.</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Module List */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
               {MODULES.map((module) => (
                 <button
                   key={module.id}
                   onMouseEnter={() => setActiveModule(module.id)}
                   className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 flex flex-col gap-4 group relative ${
                     activeModule === module.id 
                       ? 'bg-muted border-primary shadow-glow shadow-primary/10' 
                       : 'bg-background border-border hover:border-muted-foreground/30'
                   }`}
                 >
                   <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                     activeModule === module.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border text-muted-foreground group-hover:text-foreground'
                   }`}>
                     <module.icon className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className={`text-sm font-bold transition-colors ${
                       activeModule === module.id ? 'text-foreground' : 'text-muted-foreground'
                     }`}>{module.title}</h3>
                   </div>
                   {activeModule === module.id && (
                     <motion.div 
                       layoutId="active-module-pill"
                       className="absolute inset-0 border border-primary/40 rounded-2xl pointer-events-none"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                     />
                   )}
                 </button>
               ))}
            </div>

            {/* Module Preview */}
            <div className="lg:col-span-7 relative rounded-3xl border border-border bg-muted/20 backdrop-blur-sm overflow-hidden flex flex-col p-0 min-h-[500px]">
               <div className="h-12 border-b border-border bg-muted/30 flex items-center px-4 gap-2 shrink-0">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 border border-red-600/20 shadow-sm" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 border border-amber-600/20 shadow-sm" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 border border-emerald-600/20 shadow-sm" />
                  </div>
                  <div className="ml-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-foreground/50">
                    {MODULES.find(m => m.id === activeModule)?.title} Module Preview
                  </div>
               </div>
               
               <div className="flex-1 p-6 md:p-8 flex flex-col min-h-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeModule}
                      initial={{ opacity: 0, scale: 0.98, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 1.02, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="flex-1 flex flex-col min-h-0"
                    >
                      <div className="flex-1 min-h-0">
                        {MODULES.find(m => m.id === activeModule)?.preview}
                      </div>
                      
                      <div className="mt-6 md:mt-8 pt-6 border-t border-border/50 shrink-0">
                         <h4 className="text-lg md:text-xl font-bold text-foreground mb-2">Key Features</h4>
                         <p className="text-muted-foreground text-xs md:text-sm font-medium leading-relaxed">
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
      <section id="features" className="py-40 bg-muted/20 overflow-hidden">
        <div className="container mx-auto px-6">
           <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-24">
              <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary rounded-full px-3 py-0.5 text-[10px] uppercase font-bold tracking-widest">Amplify Productivity</Badge>
              <h2 className="text-4xl md:text-6xl font-display font-medium tracking-tight mb-6 text-foreground">Smart Tools for <br /> Smarter Events.</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">Our neural layer automates the heavy lifting, allowing you to focus on the experience.</p>
           </div>

           <div className="relative">
              <div className="flex justify-center gap-4 mb-12">
                 {AI_FEATURES.map((_, i) => (
                   <button 
                     key={i}
                     onMouseEnter={() => setActiveAIIndex(i)}
                     className={`group relative h-10 w-10 flex items-center justify-center`}
                   >
                      <span className={`text-xs font-mono font-bold transition-colors ${activeAIIndex === i ? 'text-primary' : 'text-muted-foreground'}`}>0{i+1}</span>
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
                       opacity: activeAIIndex === i ? 1 : 0.5,
                       y: activeAIIndex === i ? 0 : 20,
                       scale: activeAIIndex === i ? 1 : 0.95,
                     }}
                     transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                     className={`p-8 rounded-3xl border transition-all cursor-pointer ${
                        activeAIIndex === i 
                          ? 'border-primary bg-background shadow-glow shadow-primary/10' 
                          : 'border-border bg-background/50 hover:border-muted-foreground/30'
                     }`}
                     onMouseEnter={() => setActiveAIIndex(i)}
                   >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                         activeAIIndex === i ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-muted text-muted-foreground'
                      }`}>
                         <feature.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold mb-4 text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed font-medium">{feature.description}</p>
                   </motion.div>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* INTEGRATION VISUALIZATION */}
      <section className="py-60 relative bg-background/50 overflow-hidden">
        <div className="container mx-auto px-6 text-center">
           <h2 className="text-5xl md:text-7xl font-display font-medium tracking-tight text-foreground mb-8">
              Replace Multiple Tools with <span className="text-primary italic font-black">Eventra</span>
           </h2>
           <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-32 font-medium">
              Eventra integrates your favorite tools into one high-performance ecosystem, flowing real-time data into your mission control.
           </p>
           
           <div className="relative max-w-6xl mx-auto min-h-[600px] flex items-center justify-between gap-12 px-4 md:px-20">
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
                     initial={{ opacity: 0, x: -20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.1 }}
                     className="flex items-center gap-4 bg-background border border-border px-6 py-4 rounded-2xl shadow-xl shadow-foreground/[0.02] w-full md:w-64 group hover:border-primary/30 transition-all cursor-default"
                     id={`tool-card-${i}`}
                   >
                      <div className={cn("w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center transition-transform group-hover:scale-110", tool.color)}>
                         <tool.icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-foreground text-sm tracking-tight">{tool.label}</span>
                   </motion.div>
                 ))}
              </div>

              {/* Center: SVG Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" style={{ zIndex: 0 }}>
                 <defs>
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                       <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                       <stop offset="50%" stopColor="currentColor" stopOpacity="0.3" />
                       <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
                    </linearGradient>
                 </defs>
                 {[0, 1, 2, 3, 4].map((i) => {
                    // Coordinates for paths (approximated based on card positions)
                    const startX = 350; // Approximated right edge of cards
                    const startY = 110 + (i * 88); // Approximated center Y of each card
                    const endX = 900; // Left edge of Eventra hub
                    const endY = 300; // Center Y of Eventra hub
                    
                    const controlX = startX + (endX - startX) / 2;
                    
                    const path = `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`;
                    
                    return (
                      <g key={i} className="text-muted-foreground/20">
                         <motion.path
                           d={path}
                           fill="none"
                           stroke="currentColor"
                           strokeWidth="1.5"
                           initial={{ pathLength: 0 }}
                           whileInView={{ pathLength: 1 }}
                           transition={{ duration: 1.5, delay: i * 0.1 }}
                         />
                         {/* Flowing Dots */}
                         {[0, 1, 2].map((dot) => (
                           <motion.circle
                             key={dot}
                             r="2.5"
                             fill="currentColor"
                             className="text-foreground/40"
                             animate={{ 
                               offsetDistance: ["0%", "100%"]
                             }}
                             transition={{ 
                               duration: 4, 
                               repeat: Infinity, 
                               delay: dot * 1.3 + (i * 0.4),
                               ease: "linear"
                             }}
                             style={{ 
                               offsetPath: `path('${path}')`
                             }}
                           />
                         ))}
                      </g>
                    );
                 })}
              </svg>

              {/* Right Side: Central Eventra Hub */}
              <div className="relative z-10 hidden md:block">
                 <motion.div 
                   animate={{ scale: [1, 1.02, 1] }}
                   transition={{ duration: 4, repeat: Infinity }}
                   className="relative group shadow-2xl shadow-primary/20 rounded-[3rem]"
                 >
                    <div className="w-48 h-48 rounded-[3rem] bg-primary flex items-center justify-center relative overflow-hidden border border-white/10">
                       <Logo 
                         iconClassName="w-32 h-32 bg-transparent shadow-none p-0" 
                         className="gap-0" 
                       />
                       <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                    </div>
                    {/* Animated outer ring */}
                    <div className="absolute inset-0 -m-4 border border-primary/10 rounded-[3.5rem] animate-pulse" />
                    <div className="absolute inset-0 -m-8 border border-primary/5 rounded-[4rem] animate-pulse delay-700" />
                 </motion.div>
              </div>
           </div>
        </div>
      </section>

      {/* NETWORK ACTIVITY */}
      <section id="events" className="py-40 bg-background/50">
        <div className="container mx-auto px-6">
           <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-6">
              <div className="max-w-xl">
                 <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary rounded-full px-3 py-0.5 text-[10px] uppercase font-bold tracking-widest">Global Network</Badge>
                 <h2 className="text-4xl md:text-6xl font-display font-medium tracking-tight text-foreground">Live Operations.</h2>
                 <p className="mt-4 text-muted-foreground font-medium">Real-time status of event clusters and nodes deployed across the Eventra mesh.</p>
              </div>
              <Button variant="outline" className="border-border hover:bg-muted rounded-full font-bold px-8 h-12 transition-all hover:scale-105" asChild>
                 <Link href="/explore">Scan Network</Link>
              </Button>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
             {featuredEvents.length > 0 ? featuredEvents.slice(0, 3).map((event) => (
               <EventCard key={event.id} event={event} />
             )) : (
               [1, 2, 3].map(i => (
                 <div key={i} className="rounded-3xl border border-border bg-muted/20 p-8 flex flex-col gap-6 group relative overflow-hidden">
                    <div className="flex justify-between items-start">
                       <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center shadow-sm">
                          <Activity className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                       </div>
                       <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                          Operational
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="h-4 w-48 bg-muted rounded-full overflow-hidden relative">
                          <motion.div 
                            className="absolute inset-0 bg-primary/30 shadow-[0_0_10px_var(--primary)]"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                       </div>
                       <div className="h-3 w-32 bg-muted/50 rounded-full" />
                    </div>
                    <div className="pt-6 mt-auto border-t border-border flex justify-between items-center text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-tighter">
                       <span>Node_00{i}</span>
                       <span>Region: US-East-1</span>
                    </div>
                    
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                 </div>
               ))
             )}
           </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-60 relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full translate-y-1/2" />
        <div className="container mx-auto px-6 relative z-10 text-center space-y-12">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-4"
           >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[11px] font-bold tracking-widest uppercase text-primary">Free Public Beta</span>
           </motion.div>
           
           <h2 className="text-5xl md:text-8xl font-display font-medium tracking-tight leading-tight text-foreground">Scale your next <br /> <span className="text-primary italic">experience.</span></h2>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Button size="xl" className="rounded-full px-12 h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg shadow-2xl shadow-primary/20 transition-transform hover:scale-105 active:scale-95 shadow-glow border-none" asChild>
                 <Link href="/register">Get Started Free</Link>
              </Button>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group font-bold px-8 py-3 rounded-full hover:bg-muted transition-all">
                 Contact Sales <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
           </div>
        </div>
      </section>

      <footer className="border-t border-border pt-24 pb-12 bg-background relative z-10">
        <div className="container mx-auto px-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
              <div className="col-span-2 md:col-span-1 space-y-4">
                 <Logo showText />
                 <p className="text-sm text-muted-foreground leading-relaxed max-w-xs font-bold">
                    Building the infrastructure for the next generation of live experiences.
                 </p>
              </div>
              <div className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Product</h4>
                 <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li><Link href="#" className="hover:text-primary transition-colors">Features</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Ecosystem</Link></li>
                    <li><Link href="#" className="hover:text-primary transition-colors">Integrations</Link></li>
                 </ul>
              </div>
              <div className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Company</h4>
                 <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li><Link href="#" className="hover:text-primary transition-colors">About</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                 </ul>
              </div>
              <div className="space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Support</h4>
                 <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                    <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                 </ul>
              </div>
           </div>
           
           <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-8 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                 <span>© 2026 Eventra Inc.</span>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-glow" />
                    <span>All Systems Operational</span>
                 </div>
              </div>
              <div className="flex gap-6">
                 <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
                    <Globe className="w-4 h-4" />
                 </div>
                 <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
                    <Terminal className="w-4 h-4" />
                 </div>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
