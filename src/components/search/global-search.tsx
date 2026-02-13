'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, MapPin, Users, X } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface GlobalSearchProps {
  className?: string;
}

export default function GlobalSearch({ className }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchResults = useQuery(api.search.globalSearch, { query }) ?? { events: [], users: [], communities: [] };

  const hasResults = (searchResults.events?.length ?? 0) > 0 || 
                     (searchResults.users?.length ?? 0) > 0 || 
                     (searchResults.communities?.length ?? 0) > 0;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          ref={inputRef}
          placeholder="Search... (Ctrl+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full mt-2 w-full bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[500px] overflow-y-auto">
          {!hasResults ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No results found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="p-2 space-y-4">
              {searchResults.events && searchResults.events.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 px-3 mb-1">Events</p>
                  <div className="space-y-1">
                    {searchResults.events.map((event: any) => (
                      <Link key={event._id} href={`/events/${event._id}`} onClick={() => { setIsOpen(false); setQuery(''); }}>
                        <div className="px-3 py-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                          <p className="text-sm font-medium text-white group-hover:text-cyan-400">{event.title}</p>
                          <p className="text-[10px] text-gray-500">{event.category}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.users && searchResults.users.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 px-3 mb-1">People</p>
                  <div className="space-y-1">
                    {searchResults.users.map((u: any) => (
                      <Link key={u._id} href={`/profile/${u._id}`} onClick={() => { setIsOpen(false); setQuery(''); }}>
                        <div className="px-3 py-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer flex items-center gap-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={u.image} />
                            <AvatarFallback className="bg-cyan-500/10 text-cyan-500 text-[8px]">{u.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-white">{u.name}</p>
                            <p className="text-[10px] text-gray-500 capitalize">{u.role}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.communities && searchResults.communities.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 px-3 mb-1">Communities</p>
                  <div className="space-y-1">
                    {searchResults.communities.map((c: any) => (
                      <Link key={c._id} href={`/community/${c._id}`} onClick={() => { setIsOpen(false); setQuery(''); }}>
                        <div className="px-3 py-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                          <p className="text-sm font-medium text-white">{c.name}</p>
                          <p className="text-[10px] text-gray-500">{c.category}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
