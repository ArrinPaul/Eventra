'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, MapPin, Clock, Users, ArrowRight, ChevronDown, X, Zap, ZapOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getEvents } from '@/app/actions/events';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  startDate: Date;
  endDate: Date;
  location: any;
  capacity: number;
  registeredCount: number;
  price: string;
  imageUrl: string | null;
  isPaid: boolean;
  status: string;
}

import { EventCard } from './event-card';

export default function ExploreClient() {
  const t = useTranslations('Events');
  const commonT = useTranslations('Common');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = [
    { value: 'All', label: t('categories.all') },
    { value: 'Technology', label: t('categories.technology') },
    { value: 'Business', label: t('categories.business') },
    { value: 'Design', label: t('categories.design') },
    { value: 'Science', label: t('categories.science') },
    { value: 'Arts', label: t('categories.arts') },
    { value: 'Health', label: t('categories.health') },
    { value: 'Sports', label: t('categories.sports') },
    { value: 'Music', label: t('categories.music') },
    { value: 'Education', label: t('categories.education') },
  ];

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEvents({
        search: search || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        limit: 50,
      });
      setEvents(result as EventItem[]);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchEvents]);

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-6">
           <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary rounded-full px-6 py-1.5 text-[10px] font-black uppercase tracking-[0.4em]">
             Mesh_Network_Scan
           </Badge>
           <h1 className="text-5xl md:text-8xl font-display font-bold tracking-tighter leading-[0.9] text-foreground">
             Global <span className="text-primary italic">Explore.</span>
           </h1>
           <p className="text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed opacity-80">
             Traverse the Eventra ecosystem. Real-time synchronization of nodes, experiences, and community activity.
           </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-12">
        <div className="relative group max-w-3xl">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground/40 group-focus-within:text-primary transition-all duration-500" />
          <Input
            placeholder={t('searchEvents')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-20 h-20 rounded-[2.5rem] bg-background/40 backdrop-blur-xl border-border/60 text-xl font-medium focus-visible:ring-primary shadow-2xl transition-all duration-500 hover:border-primary/30"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap transition-all duration-500 border-2 active:scale-95 ${
                selectedCategory === cat.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-glow shadow-primary/20'
                  : 'bg-background/40 backdrop-blur-md border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30 shadow-xl'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-[3rem] border border-border/40 bg-muted/10 overflow-hidden animate-pulse aspect-[4/5] shadow-xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <motion.div
          className="text-center py-60 bg-muted/5 rounded-[4rem] border-2 border-dashed border-border/60"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-24 h-24 bg-muted rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
            <ZapOff className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <div className="space-y-4">
            <h3 className="text-4xl font-display font-bold tracking-tighter">{t('noEvents')}</h3>
            <p className="text-lg text-muted-foreground font-medium max-w-sm mx-auto opacity-60">{t('adjustFilters')}</p>
            <div className="pt-8">
               <Button variant="outline" size="lg" onClick={() => { setSearch(''); setSelectedCategory('All'); }} className="rounded-full px-10">
                  Reset Protocol
               </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-10"
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
        >
          {events.map((event) => (
            <motion.div
              key={event.id}
              variants={{
                initial: { opacity: 0, y: 40, scale: 0.98 },
                animate: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <EventCard event={event as any} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
