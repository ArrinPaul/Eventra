'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
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
  ArrowRight,
  PlayCircle
} from 'lucide-react';
import { cn } from '@/core/utils/utils';

const FADE_UP_VARIANTS = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function LandingPage({ featuredEvents = [] }: { featuredEvents?: EventraEvent[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categories = ['Technology', 'Music', 'Business', 'Sports', 'Arts'];

  return (
    <div ref={containerRef} className="min-h-screen bg-background selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      
      {/* HERO SECTION - Immersive Aurora */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-info/10 blur-[150px] rounded-full animate-pulse [animation-delay:2s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[linear-gradient(to_right,hsl(var(--border)/0.15)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.15)_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
        </div>

        <motion.div 
          style={{ y, opacity }}
          className="container relative z-10 mx-auto px-4 text-center"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={STAGGER_CONTAINER}
            className="max-w-5xl mx-auto space-y-10"
          >
            <motion.div variants={FADE_UP_VARIANTS} className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 bg-primary/5 text-primary text-sm font-bold shadow-neon">
                <Sparkles className="w-4 h-4" /> 
                <span>Intelligent Event Discovery</span>
                <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
              </div>
            </motion.div>

            <motion.h1 variants={FADE_UP_VARIANTS} className="text-6xl md:text-8xl font-display font-extrabold tracking-tight text-foreground leading-[1] text-balance">
              Where Every Moment <br />
              <span className="text-gradient">Becomes Memorable.</span>
            </motion.h1>

            <motion.p variants={FADE_UP_VARIANTS} className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
              Eventra leverages AI to connect you with the most impactful conferences, meetups, and experiences tailored to your professional and social goals.
            </motion.p>

            {/* Premium Search Bar */}
            <motion.div variants={FADE_UP_VARIANTS} className="max-w-3xl mx-auto pt-4 space-y-6">
              <form onSubmit={handleSearch} className="group relative flex items-center shadow-2xl rounded-2xl bg-card/40 backdrop-blur-2xl border border-white/10 p-2 transition-all hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-info opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity rounded-3xl" />
                <Search className="w-6 h-6 text-muted-foreground ml-4 shrink-0 transition-colors group-focus-within:text-primary" />
                <Input 
                  type="text" 
                  placeholder="Find your next breakthrough event..." 
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-xl font-medium h-14 pl-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" size="xl" className="rounded-xl px-10 hidden sm:flex font-bold bg-primary hover:bg-primary/90 shadow-glow">
                  Explore
                </Button>
              </form>

              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((cat) => (
                  <button 
                    key={cat} 
                    onClick={() => router.push(`/explore?category=${cat}`)} 
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-neon transition-all"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div variants={FADE_UP_VARIANTS} className="pt-10 flex flex-wrap justify-center gap-8 text-muted-foreground/60 font-bold uppercase tracking-widest text-xs">
              <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> Global Coverage</div>
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Secure Ticketing</div>
              <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> Real-time Analytics</div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground opacity-50"
        >
          <div className="w-6 h-10 rounded-full border-2 border-current flex justify-center p-2">
            <div className="w-1 h-2 bg-current rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* STATS OVERLAY - Glass Floating */}
      <section className="relative z-20 -mt-20 px-4">
        <div className="container mx-auto">
          <div className="glass-card rounded-[2.5rem] p-10 md:p-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              {[
                { label: 'Active Users', value: '150K+', color: 'text-primary' },
                { label: 'Events Hosted', value: '42K', color: 'text-info' },
                { label: 'Cities Covered', value: '120+', color: 'text-success' },
                { label: 'Trust Score', value: '4.9/5', color: 'text-warning' },
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <div className={cn("text-4xl md:text-5xl font-display font-black tracking-tighter", stat.color)}>{stat.value}</div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED EVENTS - Grid Redesign */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="space-y-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full font-bold">What's Hot</Badge>
              <h2 className="text-4xl md:text-6xl font-display font-black text-foreground">Featured Experiences</h2>
              <p className="text-muted-foreground text-xl max-w-xl font-medium">Curated selection of the most anticipated events happening around the world.</p>
            </div>
            <Button variant="outline" size="lg" className="rounded-2xl group border-2 px-8 h-14 font-bold" asChild>
              <Link href="/explore">
                View All Events <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {featuredEvents.length > 0 ? (
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Massive Main Feature */}
              <div className="lg:col-span-8">
                <Link href={`/events/${featuredEvents[0].id}`}>
                  <Card className="group relative h-[600px] overflow-hidden rounded-[3rem] border-0 bg-foreground group shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                    <div className="absolute inset-0 scale-105 group-hover:scale-100 transition-transform duration-1000 bg-gradient-to-br from-indigo-950 to-primary/40" />
                    
                    <div className="absolute top-8 left-8 z-20 flex gap-3">
                      <Badge className="bg-primary text-white border-none font-bold px-4 py-1.5 rounded-full shadow-neon">Featured Choice</Badge>
                      <Badge variant="outline" className="glass border-white/20 text-white font-bold px-4 py-1.5 rounded-full backdrop-blur-md">
                        {featuredEvents[0].category}
                      </Badge>
                    </div>

                    <div className="absolute bottom-10 left-10 right-10 z-20 space-y-6">
                      <h3 className="text-4xl md:text-5xl font-black text-white leading-tight">{featuredEvents[0].title}</h3>
                      <p className="text-white/70 text-lg md:text-xl line-clamp-2 max-w-2xl font-medium">{featuredEvents[0].description}</p>
                      <div className="flex flex-wrap items-center gap-8 text-white/90 font-bold">
                        <div className="flex items-center gap-2.5"><Calendar className="w-5 h-5 text-primary" /> {new Date(featuredEvents[0].startDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                        <div className="flex items-center gap-2.5"><MapPin className="w-5 h-5 text-primary" /> {featuredEvents[0].location?.venue || 'Global Experience'}</div>
                        <div className="flex items-center gap-2.5"><Users className="w-5 h-5 text-primary" /> {featuredEvents[0].registeredCount} attending</div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>

              {/* Stacked Side Cards */}
              <div className="lg:col-span-4 flex flex-col gap-8">
                {featuredEvents.slice(1, 3).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center glass-card rounded-[3rem]">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-6 opacity-20" />
              <p className="text-muted-foreground text-xl font-medium">New experiences are being curated as we speak.</p>
            </div>
          )}
        </div>
      </section>

      {/* CORE CAPABILITIES - Grid Redesign */}
      <section className="py-32 bg-muted/30 border-y border-border relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute left-0 top-0 w-[400px] h-[400px] bg-info/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-24 space-y-6">
            <h2 className="text-5xl md:text-7xl font-display font-black text-foreground">Next-Gen Toolkit.</h2>
            <p className="text-muted-foreground text-xl font-medium">Eventra provides a comprehensive ecosystem for the modern experience economy.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Zap, title: 'AI Matchmaking', desc: 'Smarter networking powered by behavioral analytics and interest mapping.', color: 'bg-primary/10 text-primary' },
              { icon: ShieldCheck, title: 'Secure Ticketing', desc: 'Blockchain-inspired verification systems to eliminate fraud and scalping.', color: 'bg-info/10 text-info' },
              { icon: Trophy, title: 'Gamification', desc: 'Boost engagement with dynamic points, badges, and competitive leaderboards.', color: 'bg-success/10 text-success' },
              { icon: MessageSquare, title: 'Community Hubs', desc: 'Persistent social spaces that keep the energy alive before and after events.', color: 'bg-warning/10 text-warning' },
              { icon: Sparkles, title: 'AI Marketing', desc: 'Generate high-converting copy and social media assets in seconds.', color: 'bg-destructive/10 text-destructive' },
              { icon: Globe, title: 'Hybrid Engine', desc: 'Unified control center for simultaneous physical and digital participation.', color: 'bg-primary/10 text-primary' },
              { icon: BarChart, title: 'Live Intelligence', desc: 'Deep-dive analytics on attendance patterns and revenue generation.', color: 'bg-info/10 text-info' },
              { icon: PlayCircle, title: 'Instant Replays', desc: 'Automated highlights and session recordings delivered instantly.', color: 'bg-success/10 text-success' },
            ].map((feature, i) => (
              <Card key={i} className="group relative bg-card/40 backdrop-blur-xl border-border/50 hover:border-primary/50 transition-all duration-500 rounded-3xl overflow-hidden hover:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-8">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm", feature.color)}>
                    <feature.icon className="w-7 h-7" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION - Dramatic Reveal */}
      <section className="py-40">
        <div className="container mx-auto px-4">
          <div className="relative rounded-[4rem] overflow-hidden bg-foreground shadow-neon">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-indigo-900 to-info opacity-90 mix-blend-multiply" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
            
            <div className="relative z-10 px-8 py-24 md:py-32 text-center max-w-4xl mx-auto flex flex-col items-center gap-10">
              <h2 className="text-5xl md:text-8xl font-display font-black text-white leading-[0.9] text-balance">
                The Future of Events <br /> is Already Here.
              </h2>
              <p className="text-xl md:text-2xl text-white/80 max-w-2xl leading-relaxed font-medium">
                Join 5,000+ organizations building unforgettable physical and digital experiences with Eventra.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto pt-6">
                <Button size="xl" className="bg-white text-primary hover:bg-white/90 rounded-2xl font-black shadow-2xl px-12 h-16 text-lg">
                  Start Building Now
                </Button>
                <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-2xl font-black px-12 h-16 text-lg backdrop-blur-md">
                  Book VIP Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREMIUM FOOTER */}
      <footer className="bg-card border-t border-border pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-24">
            <div className="col-span-2 lg:col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-info flex items-center justify-center shadow-glow">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-display font-black text-foreground tracking-tighter">Eventra</span>
              </div>
              <p className="text-muted-foreground text-lg max-w-xs leading-relaxed font-medium">
                Pioneering the next generation of event management and human connection.
              </p>
            </div>
            <div>
              <h4 className="font-black text-foreground uppercase tracking-widest text-xs mb-8">Platform</h4>
              <ul className="space-y-4 text-sm font-bold text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-all">Feature Suite</Link></li>
                <li><Link href="#" className="hover:text-primary transition-all">AI Engine</Link></li>
                <li><Link href="#" className="hover:text-primary transition-all">Mobile Apps</Link></li>
                <li><Link href="#" className="hover:text-primary transition-all">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-foreground uppercase tracking-widest text-xs mb-8">Resources</h4>
              <ul className="space-y-4 text-sm font-bold text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-all">Developer Hub</Link></li>
                <li><Link href="#" className="hover:text-primary transition-all">Help Center</Link></li>
                <li><Link href="#" className="hover:text-primary transition-all">Success Stories</Link></li>
                <li><Link href="#" className="hover:text-primary transition-all">Event Guides</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-foreground uppercase tracking-widest text-xs mb-8">Company</h4>
              <ul className="space-y-4 text-sm font-bold text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-all">Our Story</Link></li>
                <li><Link href="#" className="hover:text-primary transition-all">Careers</Link></li>
                <li><Link href="#" className="hover:text-primary transition-all">Brand Kit</Link></li>
                <li><Link href="#" className="hover:text-primary transition-all">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8">
            <p className="text-sm font-bold text-muted-foreground/60">
              © {new Date().getFullYear()} Eventra Labs Inc. Built for the future.
            </p>
            <div className="flex gap-10 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

