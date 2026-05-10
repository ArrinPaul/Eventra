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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('exploreEvents')}</h1>
        <p className="text-muted-foreground">{t('exploreSubtitle')}</p>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchEvents')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-card border-border"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat.value
                  ? 'bg-foreground text-background'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="h-48 bg-muted" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">{t('noEvents')}</h3>
          <p className="text-muted-foreground text-sm">{t('adjustFilters')}</p>
        </motion.div>
      ) : (
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
        >
          {events.map((event) => (
            <motion.div
              key={event.id}
              variants={{
                initial: { opacity: 0, y: 12 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.3 }}
            >
              <Link href={`/events/${event.id}`} className="group block">
                <div className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-card-hover hover:border-primary/20 transition-all duration-200">
                  {/* Image */}
                  <div className="relative h-48 bg-muted overflow-hidden">
                    {event.imageUrl ? (
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                        <Calendar className="w-10 h-10 text-primary/30" />
                      </div>
                    )}
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-medium">
                        {event.category}
                      </Badge>
                    </div>
                    {/* Price Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className={`text-xs font-medium ${
                        event.isPaid
                          ? 'bg-foreground text-background'
                          : 'bg-green-500/90 text-foreground'
                      }`}>
                        {event.isPaid ? `$${event.price}` : t('free')}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>

                    <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{formatDate(event.startDate)} · {formatTime(event.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{getLocationText(event.location)}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{event.registeredCount}/{event.capacity}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${
                          event.type === 'virtual' ? 'border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400' :
                          event.type === 'hybrid' ? 'border-purple-200 text-purple-600 dark:border-purple-800 dark:text-purple-400' :
                          'border-green-200 text-green-600 dark:border-green-800 dark:text-success'
                      }`}
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
