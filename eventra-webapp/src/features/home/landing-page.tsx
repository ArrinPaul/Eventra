'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Calendar, Users, BarChart3, Shield, Sparkles, QrCode,
  ArrowRight, CheckCircle2, Globe, Zap, Award, MessageCircle
} from 'lucide-react';
import Header from '@/components/layout/header';

const features = [
  {
    icon: Calendar,
    title: 'Smart Event Creation',
    description: 'Create and manage events with AI-assisted scheduling, ticketing tiers, and automated workflows.',
  },
  {
    icon: QrCode,
    title: 'Secure Check-In',
    description: 'HMAC-signed QR tickets with real-time verification, offline mode, and anti-fraud protection.',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    description: 'Track attendance, revenue, engagement, and NPS scores with real-time dashboards.',
  },
  {
    icon: Users,
    title: 'Community & Networking',
    description: 'AI-powered matchmaking, live chat, discussion boards, and community spaces.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Tools',
    description: 'Marketing copilot, predictive attendance, personalized recommendations, and auto-reports.',
  },
  {
    icon: Award,
    title: 'Gamification',
    description: 'XP, levels, badges, leaderboards, and challenges to boost attendee engagement.',
  },
];

const stats = [
  { value: '10K+', label: 'Events Created' },
  { value: '500K+', label: 'Attendees Served' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★', label: 'User Rating' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4 sm:px-6 overflow-hidden">
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
        </div>

        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Event Management
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.1] mb-6"
          >
            Events that leave a{' '}
            <span className="text-primary">lasting impression</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Create, manage, and grow your events with intelligent tools.
            From intimate workshops to large conferences — Eventra handles it all.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl px-8 text-base h-12">
              <Link href="/register">
                Start for Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl px-8 text-base h-12">
              <Link href="/explore">Browse Events</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to run great events
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete platform with powerful tools for organizers, engaging experiences for attendees.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="group p-6 rounded-2xl border border-border bg-card hover:shadow-card-hover hover:border-primary/20 transition-all duration-200"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-card border border-border"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of organizers who trust Eventra to deliver exceptional events.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl px-8 text-base h-12">
              <Link href="/register">
                Create Your First Event
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">E</span>
              </div>
              <span className="text-sm font-semibold text-foreground">Eventra</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/explore" className="hover:text-foreground transition-colors">Events</Link>
              <Link href="/community" className="hover:text-foreground transition-colors">Community</Link>
              <Link href="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Eventra. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
