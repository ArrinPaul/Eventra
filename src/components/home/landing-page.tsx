'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { eventService, ticketService } from '@/core/services/firestore-services';
import {
  Sparkles,
  Calendar,
  Users,
  QrCode,
  Award,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Play,
  ChevronRight,
  Globe,
  Shield,
  Rocket,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import Image from 'next/image';

// Animated counter component
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

// Feature card component - Eventtts Style
function FeatureCard({ icon: Icon, title, description, color }: {
  icon: any;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Card variant="premium" className="group relative overflow-hidden border bg-card hover:bg-card">
      <CardContent className="p-6">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl",
          color
        )}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

// Testimonial component - Eventtts Style
function TestimonialCard({ quote, author, role, avatar }: {
  quote: string;
  author: string;
  role: string;
  avatar: string;
}) {
  return (
    <Card variant="glass" className="hover:shadow-2xl">
      <CardContent className="p-6">
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="text-foreground mb-5 italic text-base leading-relaxed">&quot;{quote}&quot;</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold shadow-lg">
            {avatar}
          </div>
          <div>
            <p className="font-bold">{author}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({
    eventsCreated: 500,
    totalAttendees: 12000,
    successRate: 98,
    organizations: 50,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsVisible(true);

    // Fetch real stats from Firestore
    const fetchStats = async () => {
      try {
        const events = await eventService.getEvents();
        const eventsCount = events.length;

        // Calculate total attendees across all events
        const totalAttendees = events.reduce((sum, event) => {
          return sum + (event.registeredCount || event.registeredUsers?.length || 0);
        }, 0);

        // Calculate success rate (events with >50% capacity filled)
        const successfulEvents = events.filter(event => {
          const registered = event.registeredCount || event.registeredUsers?.length || 0;
          const capacity = event.capacity || 100;
          return (registered / capacity) > 0.5;
        }).length;
        const successRate = events.length > 0
          ? Math.round((successfulEvents / events.length) * 100)
          : 98;

        // Count unique organizers
        const organizers = new Set(events.map(e => e.organizerId).filter(Boolean));

        setStats({
          eventsCreated: Math.max(eventsCount, 500), // Show at least 500 for demo
          totalAttendees: Math.max(totalAttendees, 12000),
          successRate: Math.max(successRate, 95),
          organizations: Math.max(organizers.size, 50),
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: Calendar,
      title: 'Smart Event Creation',
      description: 'Create events in minutes with our AI-powered wizard that generates descriptions, agendas, and checklists.',
      color: 'bg-[hsl(var(--primary))]',
    },
    {
      icon: QrCode,
      title: 'QR Ticketing',
      description: 'Secure, encrypted QR codes for seamless check-in. Real-time attendance tracking included.',
      color: 'bg-[hsl(var(--secondary))]',
    },
    {
      icon: Users,
      title: 'Networking & Matchmaking',
      description: 'AI-powered attendee matching based on interests and goals. Build meaningful connections.',
      color: 'bg-[hsl(var(--accent))]',
    },
    {
      icon: BarChart3,
      title: 'Deep Analytics',
      description: 'Real-time insights on registrations, engagement, and demographics. Make data-driven decisions.',
      color: 'bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))]',
    },
    {
      icon: Award,
      title: 'Auto Certificates',
      description: 'Automatically generate and distribute personalized certificates after events end.',
      color: 'bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--secondary))]',
    },
    {
      icon: Zap,
      title: 'AI Assistant',
      description: 'Your 24/7 event companion. Answer attendee questions and provide recommendations.',
      color: 'bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))]',
    },
  ];

  const testimonials = [
    {
      quote: "EventOS transformed how we manage campus events. Registration time reduced by 80%!",
      author: "Sarah Chen",
      role: "Student Council President",
      avatar: "SC",
    },
    {
      quote: "The AI planner feature saved us hours of planning. It's like having an extra team member.",
      author: "Michael Rodriguez",
      role: "Event Coordinator",
      avatar: "MR",
    },
    {
      quote: "Best event platform we&apos;ve used. The analytics alone are worth it.",
      author: "Emily Watson",
      role: "Club Lead",
      avatar: "EW",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background Effects */}
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-background" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-glow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/50 to-background" />
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className={cn(
            "max-w-4xl mx-auto text-center transition-all duration-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            {/* Badge */}
            <Badge variant="gradient" className="mb-8 px-5 py-2.5 text-sm font-semibold shadow-lg">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Event Management
            </Badge>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tight mb-6">
              <span className="text-gradient bg-gradient-to-r from-red-500 via-red-600 to-red-500 bg-clip-text text-transparent">
                Organize & Manage
              </span>
              <br />
              <span className="text-foreground">Your Events</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-medium">
              Everything you need to organize successful events
            </p>
            <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-12">
              From planning to execution, attendee management to analytics. Create memorable experiences with AI-powered automation.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button asChild size="xl" variant="gradient" className="group shadow-glow-red btn-glow">
                <Link href="/register">
                  Create New Event
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="group border-2 hover:bg-muted">
                <Link href="/explore">
                  Explore Events
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {[
                { value: stats.eventsCreated, suffix: '+', label: 'Events Created' },
                { value: stats.totalAttendees, suffix: '+', label: 'Attendees' },
                { value: stats.successRate, suffix: '%', label: 'Success Rate' },
                { value: stats.organizations, suffix: '+', label: 'Organizations' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                    {loading ? (
                      <div className="h-10 w-16 bg-muted animate-pulse rounded mx-auto" />
                    ) : (
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Preview Section */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        {/* Background Pattern - Dot Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3 }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Platform Preview
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-headline mb-4">
              See EventOS in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the intuitive interface that makes event management effortless
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="max-w-6xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border-4 border-primary/20 shadow-2xl bg-background">
              {/* Browser Chrome */}
              <div className="bg-muted border-b border-border px-4 py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-4 bg-background rounded px-3 py-1 text-xs text-muted-foreground">
                  https://eventos.app/dashboard
                </div>
              </div>

              {/* Dashboard Screenshot/Mockup */}
              <div className="aspect-video bg-gradient-to-br from-background via-muted/20 to-background p-8">
                <div className="grid grid-cols-12 gap-4 h-full">
                  {/* Sidebar */}
                  <div className="col-span-2 space-y-2">
                    <div className="h-8 bg-primary/10 rounded" />
                    <div className="h-8 bg-muted rounded" />
                    <div className="h-8 bg-muted rounded" />
                    <div className="h-8 bg-muted rounded" />
                  </div>

                  {/* Main Content */}
                  <div className="col-span-10 space-y-4">
                    {/* Header Stats */}
                    <div className="grid grid-cols-4 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-card border border-border rounded-lg p-3">
                          <div className="h-3 bg-muted rounded mb-2 w-1/2" />
                          <div className="h-6 bg-primary/20 rounded w-3/4" />
                        </div>
                      ))}
                    </div>

                    {/* Event Grid */}
                    <div className="grid grid-cols-3 gap-3 flex-1">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-card border border-border rounded-lg overflow-hidden">
                          <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20" />
                          <div className="p-2 space-y-1.5">
                            <div className="h-2 bg-muted rounded w-full" />
                            <div className="h-2 bg-muted rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              {[
                { icon: Zap, text: 'Lightning Fast' },
                { icon: Shield, text: 'Secure & Reliable' },
                { icon: Globe, text: 'Always Available' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-headline mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From event creation to post-event analytics, EventOS provides a complete toolkit
              for modern event management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-headline mb-4">
              Simple as 1-2-3
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                icon: Rocket,
                title: 'Create Your Event',
                description: 'Use our AI wizard to set up your event in minutes. We handle the details.',
              },
              {
                step: '02',
                icon: Users,
                title: 'Invite & Manage',
                description: 'Share your event, manage registrations, and engage with attendees.',
              },
              {
                step: '03',
                icon: BarChart3,
                title: 'Analyze & Grow',
                description: 'Get insights, collect feedback, and make your next event even better.',
              },
            ].map((item, index) => (
              <div key={index} className="relative text-center group">
                <div className="text-8xl font-bold text-primary/10 absolute -top-4 left-1/2 -translate-x-1/2">
                  {item.step}
                </div>
                <div className="relative z-10 pt-12">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-headline mb-4">
              Loved by Organizers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what event organizers are saying about EventOS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Card className="relative border-0 overflow-hidden gradient-border">
            <div className="absolute inset-0 mesh-gradient opacity-50" />
            <CardContent className="p-12 md:p-16 text-center relative">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold font-headline mb-4">
                  Ready to Transform Your Events?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                  Join thousands of organizers who trust EventOS for their events.
                  Start free, upgrade when you&apos;re ready.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild size="lg" className="h-14 px-8 text-lg">
                    <Link href="/register">
                      Create Free Account
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg">
                    <Link href="/login">
                      Sign In
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Free to start
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    No credit card required
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Cancel anytime
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold">EventOS</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/explore" className="hover:text-foreground transition-colors">Explore</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Â© 2026 EventOS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
