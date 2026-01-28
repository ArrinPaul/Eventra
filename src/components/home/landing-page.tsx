'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Feature card component
function FeatureCard({ icon: Icon, title, description, color }: { 
  icon: any; 
  title: string; 
  description: string;
  color: string;
}) {
  return (
    <Card className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardContent className="p-6">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
          color
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

// Testimonial component
function TestimonialCard({ quote, author, role, avatar }: {
  quote: string;
  author: string;
  role: string;
  avatar: string;
}) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-0">
      <CardContent className="p-6">
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-foreground mb-4 italic">"{quote}"</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
            {avatar}
          </div>
          <div>
            <p className="font-semibold text-sm">{author}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
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
      quote: "Best event platform we've used. The analytics alone are worth it.",
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
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 mesh-gradient" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className={cn(
            "max-w-4xl mx-auto text-center transition-all duration-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            {/* Badge */}
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Event Management
            </Badge>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tight mb-6">
              <span className="gradient-text">
                EventOS
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              The Intelligent Event Management Platform
            </p>
            <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-10">
              Create, manage, and scale events effortlessly. From registration to certificates, 
              we've got everything covered with AI-powered automation.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button asChild size="lg" className="h-14 px-8 text-lg group">
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg group">
                <Link href="/explore">
                  Explore Events
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {[
                { value: 500, suffix: '+', label: 'Events Created' },
                { value: 12000, suffix: '+', label: 'Attendees' },
                { value: 98, suffix: '%', label: 'Success Rate' },
                { value: 50, suffix: '+', label: 'Organizations' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
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
                  Start free, upgrade when you're ready.
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
              © 2026 EventOS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
