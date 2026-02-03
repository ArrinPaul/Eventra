'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Calendar,
  Users,
  MapPin,
  ArrowRight,
  Search,
  Star,
  Clock,
  Ticket,
  ChevronRight,
  Play,
  Zap,
  Globe,
  Shield,
  TrendingUp,
  Heart,
  Share2,
  Filter,
  ChevronDown,
  CheckCircle2,
  ArrowUpRight,
  Instagram,
  Twitter,
  Linkedin,
  Github,
  Mail,
  Phone,
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

// ============================================
// ANIMATED BACKGROUND COMPONENT
// ============================================
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient Background - Maroon to Dark Red */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#3D1515] via-[#5D2020] to-[#4A1818]" />
      
      {/* Subtle Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-red-400/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-red-600/10 rounded-full blur-[140px]" />
    </div>
  );
}

// ============================================
// NAVBAR COMPONENT
// ============================================
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled 
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10" 
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-red-500 to-red-600 rounded-xl blur opacity-40" />
            </div>
            <span className="text-2xl font-bold text-red-400">
              Eventra
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/explore" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Explore Events
            </Link>
            <Link href="/create" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Create Event
            </Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Pricing
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              About
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button asChild variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-red-500 hover:bg-red-400 text-white font-semibold border-0 rounded-full">
              <Link href="/register">Sign In</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={cn("h-0.5 w-full bg-white transition-all", mobileMenuOpen && "rotate-45 translate-y-2")} />
              <span className={cn("h-0.5 w-full bg-white transition-all", mobileMenuOpen && "opacity-0")} />
              <span className={cn("h-0.5 w-full bg-white transition-all", mobileMenuOpen && "-rotate-45 -translate-y-2")} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10"
          >
            <div className="px-6 py-6 space-y-4">
              <Link href="/explore" className="block text-gray-300 hover:text-white py-2">Explore Events</Link>
              <Link href="/create" className="block text-gray-300 hover:text-white py-2">Create Event</Link>
              <Link href="/pricing" className="block text-gray-300 hover:text-white py-2">Pricing</Link>
              <Link href="/about" className="block text-gray-300 hover:text-white py-2">About</Link>
              <div className="pt-4 flex flex-col gap-3">
                <Button asChild variant="outline" className="w-full border-white/20 text-white">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="w-full bg-red-500 hover:bg-red-400 text-white font-semibold rounded-full">
                  <Link href="/register">Sign In</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// ============================================
// HERO SECTION
// ============================================
function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <AnimatedBackground />
      
      <motion.div style={{ y, opacity }} className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Badge className="mb-8 px-6 py-3 bg-white/10 border-white/20 text-white/90 backdrop-blur-sm rounded-full">
            <Sparkles className="w-4 h-4 mr-2 text-white/80" />
            Professional Event Organization Platform
          </Badge>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight"
        >
          <span className="text-white">Organize & Manage</span>
          <br />
          <span className="text-red-300">
            Your Events
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-12"
        >
          Everything you need to organize successful events - from planning
          to execution, attendee management to analytics.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button asChild size="lg" className="h-14 px-10 bg-red-500 hover:bg-red-400 text-white rounded-full text-lg font-semibold">
            <Link href="/create">
              Create New Event
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 px-10 border-white/30 text-white hover:bg-white/10 rounded-full text-lg bg-white/10 backdrop-blur-sm">
            <Link href="/dashboard">
              Manage My Events
            </Link>
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {[
            { value: '500+', label: 'Events Created', icon: Calendar },
            { value: '95%', label: 'Success Rate', icon: TrendingUp },
            { value: '10K+', label: 'Total Attendees', icon: Users },
          ].map((stat, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <stat.icon className="w-8 h-8 text-red-400 mb-4 mx-auto" />
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-white/60">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-3 bg-white/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================
// EVENT CARD COMPONENT
// ============================================
interface EventCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
  category: string;
  price: string;
  attendees: number;
  featured?: boolean;
}

function EventCard({ title, date, time, location, image, category, price, attendees, featured }: EventCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={cn(
        "group relative rounded-3xl overflow-hidden bg-gradient-to-b from-white/10 to-white/5 border border-white/10 backdrop-blur-sm",
        featured && "md:col-span-2 md:row-span-2"
      )}
    >
      {/* Image */}
      <div className={cn("relative overflow-hidden", featured ? "h-64 md:h-80" : "h-48")}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Category Badge */}
        <Badge className="absolute top-4 left-4 z-20 bg-white/20 backdrop-blur-sm border-0 text-white">
          {category}
        </Badge>

        {/* Like Button */}
        <button className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
          <Heart className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className={cn("font-bold text-white mb-3 line-clamp-2 group-hover:text-red-300 transition-colors", featured ? "text-2xl" : "text-lg")}>
          {title}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-400 text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            {date} • {time}
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <MapPin className="w-4 h-4 mr-2" />
            {location}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-red-500 border-2 border-[#3D1515]" />
              ))}
            </div>
            <span className="text-white/60 text-sm">+{attendees} going</span>
          </div>
          <div className="text-white font-bold">
            {price === 'Free' ? (
              <span className="text-green-400">Free</span>
            ) : (
              price
            )}
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent" />
      </div>
    </motion.div>
  );
}

// ============================================
// FEATURED EVENTS SECTION
// ============================================
function FeaturedEventsSection() {
  const events = [
    {
      title: "Tech Innovation Summit 2026",
      date: "Feb 15, 2026",
      time: "9:00 AM",
      location: "Main Auditorium, Tech Park",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
      category: "Technology",
      price: "₹499",
      attendees: 234,
      featured: true,
    },
    {
      title: "Music Festival Night",
      date: "Feb 20, 2026",
      time: "6:00 PM",
      location: "Open Air Theatre",
      image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
      category: "Music",
      price: "₹299",
      attendees: 512,
    },
    {
      title: "Startup Pitch Competition",
      date: "Feb 18, 2026",
      time: "10:00 AM",
      location: "Business School",
      image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800",
      category: "Business",
      price: "Free",
      attendees: 89,
    },
    {
      title: "Art & Design Workshop",
      date: "Feb 22, 2026",
      time: "2:00 PM",
      location: "Creative Studio",
      image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800",
      category: "Art",
      price: "₹199",
      attendees: 45,
    },
    {
      title: "Hackathon 2026",
      date: "Feb 25, 2026",
      time: "8:00 AM",
      location: "Engineering Block",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
      category: "Technology",
      price: "Free",
      attendees: 156,
    },
  ];

  return (
    <section className="relative py-32 bg-gradient-to-b from-[#4A1818] to-[#3D1515]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <Badge className="mb-4 bg-red-500/20 text-red-300 border-red-500/30">
              <TrendingUp className="w-3 h-3 mr-2" />
              Trending Now
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Featured Events
            </h2>
            <p className="text-white/60 text-lg max-w-xl">
              Discover the most popular events happening around you. Don&apos;t miss out on these amazing experiences.
            </p>
          </div>
          <Button asChild variant="outline" className="mt-6 md:mt-0 border-white/20 text-white hover:bg-white/10">
            <Link href="/explore">
              View All Events
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <EventCard key={i} {...event} featured={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// CATEGORIES SECTION
// ============================================
function CategoriesSection() {
  const categories = [
    { name: 'Technology', icon: Zap, color: 'from-blue-500 to-cyan-500', count: 234 },
    { name: 'Music', icon: Play, color: 'from-pink-500 to-rose-500', count: 189 },
    { name: 'Business', icon: TrendingUp, color: 'from-green-500 to-emerald-500', count: 156 },
    { name: 'Sports', icon: Star, color: 'from-orange-500 to-amber-500', count: 98 },
    { name: 'Art', icon: Heart, color: 'from-purple-500 to-violet-500', count: 87 },
    { name: 'Education', icon: Globe, color: 'from-indigo-500 to-blue-500', count: 203 },
  ];

  return (
    <section className="relative py-32 bg-gradient-to-b from-[#3D1515] via-[#4A1818] to-[#3D1515]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Browse by Category
          </h2>
          <p className="text-white/60 text-lg">
            Find events that match your interests
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group cursor-pointer"
            >
              <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all text-center">
                <div className={cn("w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br flex items-center justify-center", cat.color)}>
                  <cat.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-1">{cat.name}</h3>
                <p className="text-white/50 text-sm">{cat.count} events</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// FEATURES SECTION
// ============================================
function FeaturesSection() {
  const features = [
    {
      icon: Ticket,
      title: "Smart Ticketing",
      description: "Secure QR-based tickets with instant delivery and easy check-in process.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Users,
      title: "Community Building",
      description: "Connect with like-minded people and build lasting relationships.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Sparkles,
      title: "AI-Powered Recommendations",
      description: "Discover events tailored to your interests using advanced AI.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Bank-grade security for all transactions with multiple payment options.",
      color: "from-orange-500 to-amber-500"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Host and attend events from anywhere in the world.",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Track your event performance with detailed insights and reports.",
      color: "from-indigo-500 to-violet-500"
    },
  ];

  return (
    <section className="relative py-32 bg-[#3D1515] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[150px] -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-red-400/10 rounded-full blur-[150px] -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-white/10 text-white border-white/20">
            <Zap className="w-3 h-3 mr-2" />
            Powerful Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            From event creation to post-event analytics, we&apos;ve got you covered with all the tools you need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all"
            >
              <div className={cn("w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br flex items-center justify-center", feature.color)}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
              
              {/* Hover effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={cn("absolute inset-0 rounded-3xl bg-gradient-to-br opacity-10", feature.color)} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// CTA SECTION
// ============================================
// Main CTA
function CTASection() {
  return (
    <section className="relative py-32 bg-[#2A0F0F] overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[3rem] overflow-hidden"
        >
          {/* Background Gradient - Red/Coral */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />
          <div className={"absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"30\" height=\"30\" viewBox=\"0 0 30 30\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M1.22676 0C1.91374 0 2.45351 0.539773 2.45351 1.22676C2.45351 1.91374 1.91374 2.45351 1.22676 2.45351C0.539773 2.45351 0 1.91374 0 1.22676C0 0.539773 0.539773 0 1.22676 0Z\" fill=\"rgba(255,255,255,0.07)\"%3E%3C/path%3E%3C/svg%3E')] opacity-50"} />
          
          <div className="relative z-10 p-12 md:p-20 text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Create Your Event?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Join thousands of organizers who are already creating amazing events on Eventra.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-10 bg-white text-red-600 hover:bg-gray-100 rounded-full text-lg font-semibold">
                <Link href="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-10 border-white/30 text-white hover:bg-white/10 rounded-full text-lg">
                <Link href="/contact">
                  Contact Sales
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// FOOTER COMPONENT
// ============================================
function Footer() {
  const footerLinks = {
    Product: ['Features', 'Pricing', 'Integrations', 'API'],
    Company: ['About', 'Blog', 'Careers', 'Press'],
    Resources: ['Documentation', 'Help Center', 'Community', 'Status'],
    Legal: ['Privacy', 'Terms', 'Cookies', 'Licenses'],
  };

  return (
    <footer className="relative bg-[#2A0F0F] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          {/* Logo & Description */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-red-400">Eventra</span>
            </Link>
            <p className="text-gray-400 mb-6">
              The modern event platform for creating, discovering, and managing unforgettable experiences.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Twitter className="w-5 h-5 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram className="w-5 h-5 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Linkedin className="w-5 h-5 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Github className="w-5 h-5 text-gray-400" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 Eventra. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// MAIN LANDING PAGE COMPONENT
// ============================================
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#3D1515] text-white">
      <Navbar />
      <HeroSection />
      <FeaturedEventsSection />
      <CategoriesSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
}