'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Calendar, Users, MessageSquare, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  
  // Mock results for UI design
  const results = {
    events: [],
    users: [],
    communities: []
  };
  
  const hasResults = results.events.length > 0 || results.users.length > 0 || results.communities.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-20">
      {/* Search Header */}
      <div className="text-center space-y-8">
        <div className="space-y-4">
           <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em]">
             Neural Search
           </Badge>
           <h1 className="text-4xl md:text-7xl font-display font-bold text-foreground tracking-tighter leading-none">
             Discover <span className="text-primary italic">Everything.</span>
           </h1>
           <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
             Find events, connect with experts, and discovery activity nodes across the Eventra mesh.
           </p>
        </div>
        
        <div className="relative max-w-3xl mx-auto group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            autoFocus
            placeholder="Search mission codes, nodes, or expertise..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-16 h-20 text-xl font-medium bg-background border-border/80 rounded-[2rem] focus-visible:ring-primary shadow-2xl transition-all"
          />
        </div>
      </div>

      {!query.trim() ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { label: 'Events', desc: 'Workshops, conferences, and live ops', icon: Calendar, color: 'text-primary' },
              { label: 'Experts', desc: 'Network with professionals and nodes', icon: Users, color: 'text-emerald-500' },
              { label: 'Channels', desc: 'Join interest-based activity feeds', icon: MessageSquare, color: 'text-cyan-500' },
            ].map((item, i) => (
              <div key={i} className="p-10 bg-background border border-border/80 rounded-[2.5rem] text-center space-y-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                   <item.icon className="w-8 h-8 text-primary" />
                </div>
                <div>
                   <h3 className="text-xl font-display font-bold tracking-tight">{item.label}</h3>
                   <p className="text-xs font-medium text-muted-foreground mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : query.length < 2 ? (
        <div className="py-20 text-center animate-pulse">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Streaming data from mesh...</p>
        </div>
      ) : !hasResults ? (
        <div className="text-center py-40 bg-background rounded-[3rem] border-2 border-dashed border-border animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Search className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-3xl font-display font-bold mb-4">No results found.</h3>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto">Neural filters returned zero matches for &quot;{query}&quot;.</p>
        </div>
      ) : (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* Results would be mapped here */}
        </div>
      )}
    </div>
  );
}


