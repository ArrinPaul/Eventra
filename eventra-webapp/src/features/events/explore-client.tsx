'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, MapPin, Clock, Users, ArrowRight, ChevronDown, X } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-black font-headline text-foreground mb-3 tracking-tighter">{t('exploreEvents')}</h1>
        <p className="text-xl text-muted-foreground font-medium">{t('exploreSubtitle')}</p>
      </div>

      {/* Search & Filters */}
      <div className="mb-12 space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={t('searchEvents')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 rounded-2xl bg-card border-border/50 text-lg focus-visible:ring-primary shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-6 py-2.5 rounded-xl text-sm font-black whitespace-nowrap transition-all duration-300 border-2 ${
                selectedCategory === cat.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-glow'
                  : 'bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-[2rem] border border-border/50 bg-card overflow-hidden animate-pulse aspect-[4/5]" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <motion.div
          className="text-center py-32 bg-card rounded-[3rem] border border-dashed border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-2">{t('noEvents')}</h3>
          <p className="text-muted-foreground font-medium">{t('adjustFilters')}</p>
        </motion.div>
      ) : (
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
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
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Link href={`/events/${event.id}`} className="group block h-full">
                <div className="rounded-[2rem] border border-border/50 bg-card overflow-hidden hover:shadow-elevated hover:border-primary/40 transition-all duration-500 h-full flex flex-col group">
                  {/* Image */}
                  <div className="relative h-60 bg-muted overflow-hidden">
                    {event.imageUrl ? (
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                        <Calendar className="w-12 h-12 text-primary/10" />
                      </div>
                    )}
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <Badge variant="glass" className="backdrop-blur-md border-white/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                        {event.category}
                      </Badge>
                    </div>
                    {/* Free Badge */}
                    <div className="absolute bottom-4 right-4 z-10">
                      <Badge className="text-xs font-black px-4 py-1.5 rounded-xl shadow-lg bg-emerald-500 text-white">
                        {t('free')}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-2xl font-black text-foreground mb-4 line-clamp-2 group-hover:text-primary transition-colors tracking-tight leading-tight">
                      {event.title}
                    </h3>

                    <div className="space-y-3 text-sm font-bold text-muted-foreground mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <span>{formatDate(event.startDate)} · {formatTime(event.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <span className="truncate">{getLocationText(event.location)}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] font-black">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {event.registeredCount} / {event.capacity}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-black uppercase tracking-tighter border-border/50 px-3 py-1"
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
