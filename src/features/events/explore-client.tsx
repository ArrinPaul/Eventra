'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ZapOff, Activity, Compass, ChevronRight, SlidersHorizontal, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getEvents } from '@/app/actions/events';
import { useTranslations } from 'next-intl';
import { EventCard } from './event-card';
import { cn } from '@/core/utils/utils';
import { useDebounce } from '@/hooks/use-debounce';

interface EventItem {
  id: string; title: string; description: string; category: string;
  type: string; startDate: Date; endDate: Date; location: any;
  capacity: number; registeredCount: number; price: string;
  imageUrl: string | null; isPaid: boolean; status: string;
}

export default function ExploreClient() {
  const t = useTranslations('Events');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const debouncedSearch = useDebounce(search, 500);

  const categories = [
    { value: 'All', label: 'All Categories' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Business', label: 'Business' },
    { value: 'Design', label: 'Design' },
    { value: 'Science', label: 'Science' },
    { value: 'Arts', label: 'Arts' },
  ];

  const types = ['physical', 'virtual', 'hybrid'];

  const fetchEvents = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEvents({
        search: debouncedSearch || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        limit: 20,
      });
      
      // Client-side type filtering until getEvents supports it
      let filtered = result as EventItem[];
      if (selectedType) {
        filtered = filtered.filter(e => e.type === selectedType);
      }
      
      setEvents(filtered);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, selectedType]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 pb-24 px-6 md:px-10">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-notion-hairline pb-10">
        <div className="space-y-3 text-left">
           <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-notion-canvas border-notion-hairline text-notion-ink-faint font-bold px-3 py-0.5 rounded-md shadow-sm uppercase text-[9px] tracking-widest">
                Network Scan
              </Badge>
           </div>
           <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-notion-ink uppercase">
             Global <span className="text-notion-primary italic">Explore.</span>
           </h1>
           <p className="text-lg text-notion-ink-muted font-medium max-w-2xl leading-relaxed">
             Real-time synchronization of event nodes, digital experiences, and global community activity.
           </p>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
           <div className="relative group flex-1 w-full">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-notion-ink-faint group-focus-within:text-primary transition-colors" />
             <Input
               placeholder="Search event title or tags..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-11 h-12 rounded-xl bg-notion-canvas-soft border-notion-hairline text-sm font-bold uppercase tracking-widest focus:bg-white transition-all shadow-sm"
             />
             {search && (
               <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-notion-ink-faint hover:text-notion-ink transition-colors p-1 rounded-md">
                 <X className="w-4 h-4" />
               </button>
             )}
           </div>
           <Button 
             variant={showFilters ? "primary" : "outline"} 
             onClick={() => setShowFilters(!showFilters)}
             className={cn(
               "h-12 rounded-xl border-notion-hairline font-bold text-xs gap-2 px-6 shadow-sm shrink-0 transition-all",
               showFilters ? "shadow-glow shadow-primary/20" : "bg-white"
             )}
           >
              <SlidersHorizontal className="w-4 h-4" /> Filters
           </Button>
        </div>

        <AnimatePresence>
           {showFilters && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="overflow-hidden"
             >
                <div className="p-6 rounded-[1.5rem] bg-notion-canvas-soft border border-notion-hairline grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-notion-ink-faint">Event Environment</p>
                      <div className="flex flex-wrap gap-2">
                         {types.map(type => (
                           <button 
                             key={type}
                             onClick={() => setSelectedType(selectedType === type ? null : type)}
                             className={cn(
                               "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2",
                               selectedType === type 
                                ? "bg-notion-primary text-white border-primary" 
                                : "bg-white border-notion-hairline text-notion-ink-muted hover:border-notion-ink-faint"
                             )}
                           >
                              {selectedType === type && <Check className="w-3 h-3" />}
                              {type}
                           </button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-notion-ink-faint">Active Filters</p>
                      <div className="flex flex-wrap gap-2">
                         {selectedCategory !== 'All' && <Badge className="bg-notion-primary/10 text-primary border-none">Category: {selectedCategory}</Badge>}
                         {selectedType && <Badge className="bg-notion-primary/10 text-primary border-none">Type: {selectedType}</Badge>}
                         {!selectedType && selectedCategory === 'All' && <p className="text-xs font-medium text-notion-ink-faint italic">No active filters</p>}
                         {(selectedType || selectedCategory !== 'All') && (
                            <button 
                              onClick={() => { setSelectedCategory('All'); setSelectedType(null); }}
                              className="text-[10px] font-black text-notion-ink-faint hover:text-red-500 uppercase tracking-widest ml-2"
                            >
                               Clear All
                            </button>
                         )}
                      </div>
                   </div>
                </div>
             </motion.div>
           )}
        </AnimatePresence>

        {/* Category Pills */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shadow-sm active:scale-95",
                selectedCategory === cat.value
                  ? "bg-primary text-white border-primary shadow-glow shadow-primary/20"
                  : "bg-white dark:bg-zinc-950 border-notion-hairline text-notion-ink-muted hover:text-notion-ink hover:border-notion-ink-faint"
              )}
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
            <div key={i} className="rounded-[1.5rem] border border-notion-hairline bg-notion-canvas-soft/50 overflow-hidden animate-pulse aspect-[4/5] shadow-sm" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-32 bg-notion-canvas-soft/50 rounded-[2.5rem] border-2 border-dashed border-notion-hairline space-y-6">
          <div className="w-16 h-16 bg-white dark:bg-zinc-950 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-notion-hairline">
            <ZapOff className="w-8 h-8 text-notion-ink-faint/30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-notion-ink">Sector Empty</h3>
            <p className="text-sm text-notion-ink-muted font-medium max-w-xs mx-auto">No events detected matching your current scan parameters.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedType(null); }} className="rounded-xl font-bold px-8 h-10">
             Reset Scan
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
           <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <h2 className="text-xs font-black uppercase tracking-widest text-notion-ink-faint">Live Nodes Found</h2>
              </div>
              <span className="text-[10px] font-black text-notion-ink-faint uppercase">{events.length} results</span>
           </div>
           <motion.div
             className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
             initial="initial" animate="animate"
             variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
           >
             {events.map((event) => (
               <motion.div
                 key={event.id}
                 variants={{
                   initial: { opacity: 0, y: 20 },
                   animate: { opacity: 1, y: 0 },
                 }}
                 transition={{ duration: 0.5, ease: "easeOut" }}
               >
                 <EventCard event={event as any} />
               </motion.div>
             ))}
           </motion.div>
           
           <div className="pt-10 flex justify-center">
              <Button variant="outline" size="lg" className="rounded-xl font-bold border-notion-hairline hover:bg-white px-10 h-12">
                 Load More Nodes
              </Button>
           </div>
        </div>
      )}
    </div>
  );
}
