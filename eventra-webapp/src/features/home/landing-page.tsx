'use client';

import { motion, useScroll, useTransform, Variants, AnimatePresence } from 'framer-motion';
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
  Search,
  Calendar,
  Users,
  MessageSquare,
  Bot,
  ZapOff,
  Clock,
  CheckCircle2
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
    title: 'Messaging',
    icon: MessageSquare,
    description: 'High-performance real-time networking for attendees and organizers.',
    preview: (
      <div className="w-full h-full bg-muted/30 rounded-2xl border border-border p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
           <div className="w-8 h-8 rounded-full bg-primary/20" />
           <div className="h-3 w-24 bg-muted rounded-full" />
        </div>
        <div className="flex flex-col gap-3">
           <div className="self-start bg-muted/50 p-3 rounded-2xl rounded-tl-none max-w-[70%]">
              <div className="h-2 w-32 bg-foreground/10 rounded-full" />
           </div>
           <div className="self-end bg-primary/20 p-3 rounded-2xl rounded-tr-none max-w-[70%] border border-primary/20 text-primary">
              <div className="h-2 w-24 bg-primary/30 rounded-full" />
           </div>
           <div className="self-start bg-muted/50 p-3 rounded-2xl rounded-tl-none max-w-[70%]">
              <div className="h-2 w-40 bg-foreground/10 rounded-full" />
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'tasks',
    title: 'Tasks',
    icon: CheckCircle2,
    description: 'Streamlined registry and task management for complex event workflows.',
    preview: (
      <div className="w-full h-full bg-muted/30 rounded-2xl border border-border p-6 flex flex-col gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
             <div className="w-4 h-4 rounded border border-border" />
             <div className={`h-2 rounded-full bg-muted ${i === 1 ? 'w-1/2' : i === 2 ? 'w-1/3' : 'w-2/3'}`} />
             <div className="ml-auto w-8 h-4 rounded bg-muted/50" />
          </div>
        ))}
      </div>
    )
  },
  {
    id: 'calendar',
    title: 'Calendar',
    icon: Calendar,
    description: 'Dynamic session tracks and personalized schedules for every attendee.',
    preview: (
      <div className="w-full h-full bg-muted/30 rounded-2xl border border-border p-6">
        <div className="grid grid-cols-7 gap-2 h-full">
           {Array.from({ length: 28 }).map((_, i) => (
             <div key={i} className={`rounded-md border border-border ${i === 12 ? 'bg-primary/20 border-primary/40' : 'bg-background'}`}>
                {i === 12 && <div className="w-full h-full flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow" /></div>}
             </div>
           ))}
        </div>
      </div>
    )
  },
  {
    id: 'boards',
    title: 'Boards',
    icon: Layers,
    description: 'Visualize your event pipeline with intuitive drag-and-drop boards.',
    preview: (
      <div className="w-full h-full bg-muted/30 rounded-2xl border border-border p-4 flex gap-4">
        {[1, 2, 3].map(col => (
          <div key={col} className="flex-1 flex flex-col gap-3">
             <div className="h-2 w-12 bg-muted rounded-full mb-2" />
             {[1, 2].map(card => (
               <div key={card} className="h-16 bg-background rounded-xl border border-border p-3">
                  <div className="h-1.5 w-full bg-muted rounded-full mb-2" />
                  <div className="h-1.5 w-2/3 bg-muted/50 rounded-full" />
               </div>
             ))}
          </div>
        ))}
      </div>
    )
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: BarChart3,
    description: 'Deep analytics and real-time telemetry on attendee behavior.',
    preview: (
      <div className="w-full h-full bg-muted/30 rounded-2xl border border-border p-6 flex flex-col justify-end">
        <div className="flex items-end gap-1 h-32">
          {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95].map((h, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t-sm"
            />
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: Cpu,
    description: 'The mission control for your entire event ecosystem.',
    preview: (
      <div className="w-full h-full bg-muted/30 rounded-2xl border border-border p-6 grid grid-cols-2 gap-4">
         <div className="rounded-xl bg-primary/10 border border-primary/20 flex flex-col justify-center items-center gap-2">
            <div className="text-xl font-bold text-primary">98%</div>
            <div className="text-[8px] uppercase tracking-widest text-primary/70">Uptime</div>
         </div>
         <div className="rounded-xl bg-background border border-border flex flex-col justify-center items-center gap-2">
            <div className="text-xl font-bold">12.4k</div>
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Check-ins</div>
         </div>
         <div className="col-span-2 rounded-xl bg-background border border-border p-4 flex flex-col gap-2">
            <div className="h-1.5 w-full bg-muted rounded-full" />
            <div className="h-1.5 w-3/4 bg-muted/50 rounded-full" />
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAIIndex((prev) => (prev + 1) % AI_FEATURES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary font-sans overflow-x-hidden">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full opacity-40 animate-glow" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full" />
      </div>

      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/60 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow shadow-primary/20">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display font-medium tracking-tight text-lg text-foreground">Eventra</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#ecosystem" className="hover:text-primary transition-colors">Ecosystem</Link>
            <Link href="#events" className="hover:text-primary transition-colors">Explore</Link>
          </div>
          <div className="flex items-center gap-4">
             <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Login</Link>
             <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5 border-none shadow-glow shadow-primary/20" asChild>
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
            <Link href="/updates" className="group relative flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm hover:bg-primary/10 transition-all">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold tracking-wide text-primary/80 uppercase">Announcing Eventra 2.0</span>
              <ArrowRight className="w-3 h-3 text-primary/60 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

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
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
              </div>
              <div className="mx-auto text-[10px] font-mono text-muted-foreground uppercase tracking-widest">eventra.cloud/dashboard</div>
           </div>
           
           <div className="p-12 pt-20 grid grid-cols-12 gap-6 opacity-40">
              <div className="col-span-8 space-y-6">
                 <div className="h-48 rounded-2xl bg-muted/50 border border-border" />
                 <div className="grid grid-cols-2 gap-6">
                    <div className="h-32 rounded-2xl bg-muted/50 border border-border" />
                    <div className="h-32 rounded-2xl bg-muted/50 border border-border" />
                 </div>
              </div>
              <div className="col-span-4 h-full rounded-2xl bg-muted/50 border border-border" />
           </div>
        </motion.div>
      </section>

      {/* TRUST BANNER */}
      <section className="py-12 border-y border-border bg-muted/20">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
           <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Trusted by teams worldwide</span>
           <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale contrast-125">
              <div className="text-xl font-bold tracking-tighter text-foreground uppercase">Vercel</div>
              <div className="text-xl font-bold tracking-tighter text-foreground uppercase">Linear</div>
              <div className="text-xl font-bold tracking-tighter text-foreground uppercase">Stripe</div>
              <div className="text-xl font-bold tracking-tighter text-foreground uppercase">Github</div>
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
            <div className="lg:col-span-7 aspect-video relative rounded-3xl border border-border bg-muted/20 backdrop-blur-sm overflow-hidden flex flex-col p-0">
               <div className="h-12 border-b border-border bg-muted/30 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-foreground/10" />
                    <div className="w-2 h-2 rounded-full bg-foreground/10" />
                    <div className="w-2 h-2 rounded-full bg-foreground/10" />
                  </div>
                  <div className="ml-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-foreground/50">
                    {MODULES.find(m => m.id === activeModule)?.title} Module Preview
                  </div>
               </div>
               
               <div className="flex-1 p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeModule}
                      initial={{ opacity: 0, scale: 0.98, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 1.02, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="w-full h-full"
                    >
                      {MODULES.find(m => m.id === activeModule)?.preview}
                      <div className="mt-8">
                         <h4 className="text-xl font-bold text-foreground mb-2">Key Features</h4>
                         <p className="text-muted-foreground text-sm font-medium">{MODULES.find(m => m.id === activeModule)?.description}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
               </div>
               
               {/* Decorative background for preview */}
               <div className="absolute inset-0 -z-10 opacity-30">
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
                         activeAIIndex === i ? 'bg-primary text-white shadow-glow' : 'bg-muted text-muted-foreground'
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
      <section className="py-60 relative bg-background overflow-hidden">
        <div className="container mx-auto px-6 text-center">
           <h2 className="text-5xl md:text-7xl font-display font-medium tracking-tight text-white mb-8">Unified Intelligence.</h2>
           <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-32">
              Eventra integrates your favorite tools into one high-performance ecosystem, flowing real-time data into your mission control.
           </p>
           
           <div className="relative max-w-5xl mx-auto h-[600px]">
              {/* Central Eventra Hub */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                 <motion.div 
                   animate={{ scale: [1, 1.05, 1] }}
                   transition={{ duration: 4, repeat: Infinity }}
                   className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-primary flex items-center justify-center shadow-glow shadow-primary/40 relative"
                 >
                    <Zap className="w-16 h-16 md:w-20 md:h-20 text-white fill-white" />
                    <div className="absolute inset-0 rounded-[2.5rem] border border-white/20 animate-pulse" />
                 </motion.div>
              </div>

              {/* Connecting Apps */}
              {[
                { label: "Slack", icon: MessageSquare, angle: 0 },
                { label: "Notion", icon: Layers, angle: 60 },
                { label: "Figma", icon: Globe, angle: 120 },
                { label: "Zoom", icon: Users, angle: 180 },
                { label: "Airtable", icon: Search, angle: 240 },
                { label: "Auth0", icon: ShieldCheck, angle: 300 }
              ].map((app, i) => {
                const radius = 320;
                const x = Math.cos((app.angle * Math.PI) / 180) * radius;
                const y = Math.sin((app.angle * Math.PI) / 180) * radius;
                
                return (
                  <div key={i} className="absolute top-1/2 left-1/2" style={{ transform: `translate(${x}px, ${y}px)` }}>
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.8 }}
                       whileInView={{ opacity: 1, scale: 1 }}
                       className="relative z-10 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center shadow-xl group"
                     >
                        <app.icon className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                           {app.label}
                        </span>
                     </motion.div>

                     {/* SVG Connection Line */}
                     <svg 
                       className="absolute top-0 left-0 overflow-visible pointer-events-none"
                       style={{ transform: 'translate(-50%, -50%)' }}
                     >
                        <motion.line
                          x1={0}
                          y1={0}
                          x2={-x}
                          y2={-y}
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-border/40"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          transition={{ duration: 1.5, delay: i * 0.1 }}
                        />
                        {/* Flowing Dots */}
                        {[0, 1, 2].map((dot) => (
                          <motion.circle
                            key={dot}
                            r="2"
                            fill="var(--primary)"
                            animate={{ 
                              offsetDistance: ["100%", "0%"]
                            }}
                            transition={{ 
                              duration: 3, 
                              repeat: Infinity, 
                              delay: dot * 1 + (i * 0.2),
                              ease: "linear"
                            }}
                            style={{ 
                              offsetPath: `path('M 0 0 L ${-x} ${-y}')`,
                              filter: 'drop-shadow(0 0 4px var(--primary))'
                            }}
                          />
                        ))}
                     </svg>
                  </div>
                );
              })}

              {/* Decorative Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full border border-border/20 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-border/10 pointer-events-none" />
           </div>
        </div>
      </section>

      {/* ACTIVE OPS */}
      <section id="events" className="py-40">
        <div className="container mx-auto px-6">
           <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-6">
              <div className="max-w-xl">
                 <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary rounded-full px-3 py-0.5 text-[10px] uppercase font-bold tracking-widest">Explore Operations</Badge>
                 <h2 className="text-4xl md:text-6xl font-display font-medium tracking-tight text-foreground">Latest Deployments.</h2>
              </div>
              <Button variant="outline" className="border-border hover:bg-muted rounded-full font-bold px-8 h-12 transition-all hover:scale-105" asChild>
                 <Link href="/explore">View All Events</Link>
              </Button>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
             {featuredEvents.length > 0 ? featuredEvents.slice(0, 3).map((event) => (
               <EventCard key={event.id} event={event} />
             )) : (
               [1, 2, 3].map(i => (
                 <div key={i} className="rounded-3xl border border-border bg-muted/20 h-[450px] flex flex-col justify-center items-center gap-6 opacity-60 group cursor-not-allowed">
                    <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center border border-border group-hover:border-primary/40 transition-all">
                       <Layers className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Entry_{i} Syncing</span>
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
                 <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary fill-primary" />
                    <span className="font-display font-medium tracking-tight text-xl text-foreground">Eventra</span>
                 </div>
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
