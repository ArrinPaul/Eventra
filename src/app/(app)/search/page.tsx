'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Calendar, Users, MessageSquare, Loader2, ArrowRight, Activity, ZapOff } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';
import { globalSearch } from '@/app/actions/search';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/core/utils/utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [results, setResults] = useState<{ events: any[], users: any[], communities: any[] }>({
    events: [],
    users: [],
    communities: []
  });
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setResults({ events: [], users: [], communities: [] });
      setLoading(false);
      return;
    }

    async function doSearch() {
      setLoading(true);
      try {
        const res = await globalSearch(debouncedQuery);
        setResults(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    doSearch();
  }, [debouncedQuery]);

  const hasResults = results.events.length > 0 || results.users.length > 0 || results.communities.length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-16 pb-24 px-6 md:px-10">
      {/* Search Header */}
      <div className="text-center space-y-10">
        <div className="space-y-4">
           <Badge variant="outline" className="bg-notion-canvas border-notion-hairline text-notion-ink-faint font-bold px-4 py-1 rounded-md shadow-sm uppercase text-[10px] tracking-[0.3em]">
             Neural Search
           </Badge>
           <h1 className="text-4xl md:text-7xl font-display font-black tracking-tighter text-notion-ink uppercase">
             Discover <span className="text-notion-primary italic">Everything.</span>
           </h1>
           <p className="text-lg text-notion-ink-muted font-medium max-w-2xl mx-auto leading-relaxed">
             Find events, connect with experts, and discovery activity nodes across the Eventra mesh.
           </p>
        </div>
        
        <div className="relative max-w-3xl mx-auto group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-notion-ink-faint group-focus-within:text-notion-primary transition-colors" />
          <Input 
            autoFocus
            placeholder="Search mission codes, nodes, or expertise..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-16 h-20 text-xl font-bold uppercase tracking-tight bg-white dark:bg-zinc-950 border-notion-hairline rounded-[2.5rem] focus-visible:ring-notion-primary shadow-notion-elevated transition-all"
          />
          {loading && (
             <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-notion-primary" />
             </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!query.trim() ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {[
              { label: 'Event Nodes', desc: 'Workshops, conferences, and live ops', icon: Calendar, color: 'text-notion-primary', bg: 'bg-notion-primary/5' },
              { label: 'Experts', desc: 'Network with professionals and nodes', icon: Users, color: 'text-notion-accent-orange', bg: 'bg-notion-accent-orange/5' },
              { label: 'Mesh Feeds', desc: 'Join interest-based activity telemetry', icon: MessageSquare, color: 'text-notion-accent-teal', bg: 'bg-notion-accent-teal/5' },
            ].map((item, i) => (
              <div key={i} className="p-10 bg-white dark:bg-zinc-950 border border-notion-hairline rounded-[2.5rem] text-center space-y-6 shadow-notion-soft hover:shadow-notion-elevated hover:-translate-y-1 transition-all group">
                <div className={cn("w-16 h-16 rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform", item.bg)}>
                   <item.icon className={cn("w-8 h-8", item.color)} />
                </div>
                <div>
                   <h3 className="text-xl font-display font-black tracking-tight uppercase text-notion-ink">{item.label}</h3>
                   <p className="text-xs font-bold text-notion-ink-muted mt-2 leading-relaxed uppercase tracking-widest">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        ) : query.length < 2 ? (
          <motion.div key="short" className="py-20 text-center animate-pulse">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-notion-ink-faint">Streaming data from mesh...</p>
          </motion.div>
        ) : !hasResults && !loading ? (
          <motion.div 
            key="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-40 bg-notion-canvas-soft/50 rounded-[3rem] border-2 border-dashed border-notion-hairline"
          >
            <div className="w-20 h-20 bg-white dark:bg-zinc-950 border border-notion-hairline rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
              <ZapOff className="w-10 h-10 text-notion-ink-faint/30" />
            </div>
            <h3 className="text-3xl font-display font-black uppercase text-notion-ink">Sector Empty.</h3>
            <p className="text-sm font-medium text-notion-ink-muted max-w-sm mx-auto mt-4 uppercase tracking-widest">Neural filters returned zero matches for &quot;{query}&quot;.</p>
          </motion.div>
        ) : hasResults ? (
          <motion.div 
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-20 max-w-5xl mx-auto"
          >
             {/* EVENT RESULTS */}
             {results.events.length > 0 && (
               <section className="space-y-8">
                  <div className="flex items-center gap-3 border-b border-notion-hairline pb-4">
                     <Calendar className="w-5 h-5 text-notion-primary" />
                     <h2 className="text-sm font-black uppercase tracking-[0.3em] text-notion-ink">Event Nodes</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {results.events.map(event => (
                       <Link key={event.id} href={`/events/${event.id}`} className="group block">
                          <Card className="border-notion-hairline bg-white dark:bg-zinc-950 p-6 rounded-[2rem] hover:shadow-notion-elevated transition-all flex items-center gap-6 group">
                             <div className="w-20 h-20 rounded-2xl bg-notion-canvas-soft shrink-0 overflow-hidden border border-notion-hairline">
                                {event.imageUrl ? <Image src={event.imageUrl} width={80} height={80} className="object-cover w-full h-full" alt="" unoptimized /> : <Calendar className="w-full h-full p-6 text-notion-ink-faint/20" />}
                             </div>
                             <div className="flex-1 min-w-0 space-y-1">
                                <h3 className="font-bold text-lg text-notion-ink group-hover:text-notion-primary transition-colors truncate">{event.title}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-notion-ink-faint">{event.category} • {format(new Date(event.startDate), 'MMM d, yyyy')}</p>
                             </div>
                             <ArrowRight className="w-5 h-5 text-notion-ink-faint group-hover:translate-x-1 group-hover:text-notion-primary transition-all shrink-0" />
                          </Card>
                       </Link>
                     ))}
                  </div>
               </section>
             )}

             {/* USER RESULTS */}
             {results.users.length > 0 && (
               <section className="space-y-8">
                  <div className="flex items-center gap-3 border-b border-notion-hairline pb-4">
                     <Users className="w-5 h-5 text-notion-accent-orange" />
                     <h2 className="text-sm font-black uppercase tracking-[0.3em] text-notion-ink">Expert Network</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {results.users.map(u => (
                        <Card key={u.id} className="border-notion-hairline bg-white dark:bg-zinc-950 p-6 rounded-[2rem] hover:shadow-notion-elevated transition-all flex items-center gap-4 group cursor-pointer">
                           <Avatar className="w-12 h-12 rounded-xl border border-notion-hairline">
                              <AvatarImage src={u.image} />
                              <AvatarFallback className="font-black text-xs uppercase">{u.name?.slice(0, 2)}</AvatarFallback>
                           </Avatar>
                           <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-notion-ink truncate uppercase tracking-tight">{u.name}</h3>
                              <p className="text-[9px] font-black uppercase tracking-widest text-notion-ink-faint">{u.role}</p>
                           </div>
                           <Activity className="w-3 h-3 text-emerald-500 opacity-40" />
                        </Card>
                     ))}
                  </div>
               </section>
             )}

             {/* COMMUNITY RESULTS */}
             {results.communities.length > 0 && (
               <section className="space-y-8">
                  <div className="flex items-center gap-3 border-b border-notion-hairline pb-4">
                     <MessageSquare className="w-5 h-5 text-notion-accent-teal" />
                     <h2 className="text-sm font-black uppercase tracking-[0.3em] text-notion-ink">Activity Feeds</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {results.communities.map(c => (
                        <Card key={c.id} className="border-notion-hairline bg-white dark:bg-zinc-950 p-6 rounded-[2rem] hover:shadow-notion-elevated transition-all flex items-center justify-between group cursor-pointer">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-2xl bg-notion-accent-teal/10 flex items-center justify-center text-notion-accent-teal border border-notion-hairline shadow-sm">
                                 <MessageSquare className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                 <h3 className="font-bold text-sm text-notion-ink uppercase tracking-tight">{c.name}</h3>
                                 <p className="text-[9px] font-black uppercase tracking-widest text-notion-ink-faint">{c.category} • {c.memberCount} Nodes Connected</p>
                              </div>
                           </div>
                           <Button size="sm" variant="ghost" className="rounded-xl font-bold uppercase text-[9px] tracking-widest hover:bg-notion-accent-teal hover:text-white transition-all">Join Mesh</Button>
                        </Card>
                     ))}
                  </div>
               </section>
             )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
