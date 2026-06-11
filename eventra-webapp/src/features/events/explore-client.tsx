'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, MapPin, Clock, Users, ArrowRight, ChevronDown, X, Zap } from 'lucide-react';
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getLocationText = (location: any) => {
    if (!location) return commonT('tbd');
    if (typeof location === 'string') return location;
    return location.venue || location.address || commonT('tbd');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-4">
           <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em]">
             Global Mesh
           </Badge>
           <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter leading-none">
             Explore <span className="text-primary italic">Events.</span>
           </h1>
           <p className="text-lg text-muted-foreground font-medium max-w-xl">
             Discover amazing experiences across the network. Unified, intelligent, and real-time.
           </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-10">
        <div className="relative group max-w-2xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={t('searchEvents')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-16 h-16 rounded-[1.5rem] bg-background border-border/80 text-lg font-medium focus-visible:ring-primary shadow-xl"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 border-2 ${
                selectedCategory === cat.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-glow shadow-primary/20'
                  : 'bg-background border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/30'
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
            <div key={i} className="rounded-[3rem] border border-border/60 bg-muted/20 overflow-hidden animate-pulse aspect-[4/5]" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <motion.div
          className="text-center py-40 bg-background rounded-[3rem] border-2 border-dashed border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Calendar className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-3xl font-display font-bold mb-4">{t('noEvents')}</h3>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto">{t('adjustFilters')}</p>
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
                initial: { opacity: 0, y: 30 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Link href={`/events/${event.id}`} className="group block h-full">
                <div className="h-full bg-background border border-border/80 rounded-[3rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col group-hover:-translate-y-1">
                  {/* Image Area */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted m-4 rounded-[2.2rem]">
                    {event.imageUrl ? (
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-1000"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                        <Zap className="w-14 h-14 text-primary/10" />
                      </div>
                    )}
                    {/* Category Badge */}
                    <div className="absolute top-5 left-5 z-10">
                      <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full">
                        {event.category}
                      </Badge>
                    </div>
                    {/* Free Badge */}
                    <div className="absolute bottom-5 right-5 z-10">
                      <Badge className="text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-xl shadow-lg bg-emerald-500 text-white border-none">
                        {t('free')}
                      </Badge>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-10 pt-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6 line-clamp-2 group-hover:text-primary transition-colors tracking-tight leading-tight">
                        {event.title}
                      </h3>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <span className="leading-none">{formatDate(event.startDate)} · {formatTime(event.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <span className="truncate leading-none">{getLocationText(event.location)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-4 border-background bg-muted shadow-sm" />
                            ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                          {event.registeredCount} / {event.capacity}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-black uppercase tracking-widest border-border/60 px-4 py-1 rounded-full opacity-60"
                      >
                      {event.type === 'physical'
                        ? t('physical')
                        : event.type === 'virtual'
                          ? t('virtual')
                          : event.type === 'hybrid'
                            ? t('hybrid')
                            : event.type}
                    </Badge>
                  </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
