'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Sparkles,
  Grid3X3,
  List,
  X,
  Loader2,
  SlidersHorizontal,
  Brain,
  RefreshCw
} from 'lucide-react';
import { EventCard } from '@/components/events/event-card';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { getAIRecommendations, AIRecommendation } from '@/app/actions/ai-recommendations';
import { cn } from '@/core/utils/utils';
import type { Event } from '@/types';
import { getUserInterests, getUserSkills, getUserAttendedEvents } from '@/types';

const categories = [
  'All',
  'Tech',
  'Workshop',
  'Networking',
  'Social',
  'Career',
  'Academic',
  'Sports',
  'Arts',
  'Music',
];

const dateFilters = [
  { label: 'Any time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'This year', value: 'year' },
];

const sortOptions = [
  { label: 'Date (Soonest)', value: 'date-asc' },
  { label: 'Date (Latest)', value: 'date-desc' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Recently Added', value: 'recent' },
];

export default function ExploreClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Convex Query
  const allEventsRaw = useQuery(api.events.get);

  // State
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // AI Recommendations state
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<{ weeklyPlan?: string; learningPath?: string[] } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'date-asc');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [showOnlyFree, setShowOnlyFree] = useState(false);

  const ITEMS_PER_PAGE = 12;

  const loading = allEventsRaw === undefined;
  const events: Event[] = (allEventsRaw || []).map((e: any) => ({
    ...e,
    id: e._id,
  })).filter((event: Event) => {
    return event.status !== 'cancelled' && event.visibility !== 'private';
  });

  // Fetch AI Recommendations when events are loaded
  const fetchAIRecommendations = useCallback(async () => {
    if (events.length === 0) return;
    
    setAiLoading(true);
    setAiError(null);
    
    try {
      const userInterests = getUserInterests(user) || ['Tech', 'Networking', 'Career'];
      const userSkills = getUserSkills(user) || ['networking', 'learning'];
      const pastEventTypes = getUserAttendedEvents(user).slice(0, 5).map(() => 'Workshop');
      
      const result = await getAIRecommendations(
        user?._id || user?.id || 'guest',
        userInterests,
        userSkills,
        pastEventTypes,
        events
      );
      
      setAiRecommendations(result.recommendations);
      setAiInsights(result.insights || null);
      if (result.error) setAiError(result.error);
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error);
      setAiError('Unable to load personalized recommendations');
    } finally {
      setAiLoading(false);
    }
  }, [events, user]);

  useEffect(() => {
    if (events.length > 0 && aiRecommendations.length === 0) {
      fetchAIRecommendations();
    }
  }, [events, fetchAIRecommendations, aiRecommendations.length]);

  // Apply filters
  useEffect(() => {
    let result = [...events];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter(event => event.category === selectedCategory);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      result = result.filter(event => {
        const eventDate = event.startDate ? new Date(event.startDate) : new Date(event.date || '');
        eventDate.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case 'today':
            return eventDate.getTime() === now.getTime();
          case 'week':
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return eventDate >= now && eventDate <= weekEnd;
          case 'month':
            const monthEnd = new Date(now);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            return eventDate >= now && eventDate <= monthEnd;
          case 'year':
            const yearEnd = new Date(now);
            yearEnd.setFullYear(yearEnd.getFullYear() + 1);
            return eventDate >= now && eventDate <= yearEnd;
          default:
            return true;
        }
      });
    }

    if (showOnlyFree) {
      result = result.filter(event => event.pricing?.isFree || event.pricing?.type === 'free' || event.isPaid === false);
    }

    if (locationFilter) {
      result = result.filter(event => {
        const location = typeof event.location === 'string' 
          ? event.location 
          : event.location?.venue?.name || '';
        return location.toLowerCase().includes(locationFilter.toLowerCase());
      });
    }

    result.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate) : new Date(a.date || '');
      const dateB = b.startDate ? new Date(b.startDate) : new Date(b.date || '');

      switch (sortBy) {
        case 'date-asc':
          return dateA.getTime() - dateB.getTime();
        case 'date-desc':
          return dateB.getTime() - dateA.getTime();
        case 'popular':
          return ((b.registeredCount || b.registeredUsers?.length || 0) - (a.registeredCount || a.registeredUsers?.length || 0));
        case 'recent':
          const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return createdB - createdA;
        default:
          return 0;
      }
    });

    setFilteredEvents(result);
    setPage(1);
    setHasMore(result.length > ITEMS_PER_PAGE);
  }, [events, searchQuery, selectedCategory, dateFilter, sortBy, locationFilter, showOnlyFree]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !loadingMore) {
      setLoadingMore(true);
      setTimeout(() => {
        setPage(prev => prev + 1);
        setLoadingMore(false);
      }, 500);
    }
  }, [hasMore, loadingMore]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [handleObserver]);

  const displayedEvents = filteredEvents.slice(0, page * ITEMS_PER_PAGE);
  const activeFiltersCount = [
    selectedCategory !== 'All',
    dateFilter !== 'all',
    showOnlyFree,
    locationFilter,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory('All');
    setDateFilter('all');
    setShowOnlyFree(false);
    setLocationFilter('');
    setSearchQuery('');
  };

  const featuredEvent = events
    .filter(e => {
      const eventDate = e.startDate ? new Date(e.startDate) : new Date(e.date || '');
      return eventDate > new Date();
    })
    .sort((a, b) => ((b.registeredCount || b.registeredUsers?.length || 0) - (a.registeredCount || a.registeredUsers?.length || 0)))[0];

  return (
    <div className="min-h-screen bg-black">
      <section className="relative pt-32 pb-16">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[100px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge className="mb-6 px-4 py-2 bg-white/10 border-white/20 text-white backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2 text-purple-400" /> Discover Amazing Events
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Explore </span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">Events</span>
            </h1>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
              <div className="relative flex items-center bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-2">
                <Search className="w-5 h-5 text-gray-400 ml-4" />
                <Input
                  placeholder="Search events, categories, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-500 focus-visible:ring-0 text-lg h-12"
                />
                {searchQuery && (
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white mr-2" onClick={() => setSearchQuery('')}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-6 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full whitespace-nowrap px-5 py-2 transition-all duration-300",
                selectedCategory === category 
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-white/10 mb-8">
          <div className="flex items-center gap-3">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white rounded-xl">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" /> <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/10">
                {dateFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value} className="text-gray-300">{filter.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/10">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-gray-300">{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="bg-white/5 border-white/10 text-white rounded-xl">
                  <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
                  {activeFiltersCount > 0 && <Badge className="ml-1 bg-purple-500">{activeFiltersCount}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-black/95 border-white/10 text-white">
                <SheetHeader><SheetTitle className="text-white">Filter Events</SheetTitle></SheetHeader>
                <div className="py-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Filter by location..."
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <p>Free Events Only</p>
                    <Button
                      variant={showOnlyFree ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowOnlyFree(!showOnlyFree)}
                      className={showOnlyFree ? "bg-purple-600" : ""}
                    >
                      {showOnlyFree ? 'On' : 'Off'}
                    </Button>
                  </div>
                  {activeFiltersCount > 0 && <Button variant="outline" className="w-full text-white" onClick={clearFilters}>Clear All</Button>}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{filteredEvents.length} events found</span>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", viewMode === 'grid' ? "bg-white/10 text-white" : "text-gray-400")}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", viewMode === 'list' ? "bg-white/10 text-white" : "text-gray-400")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>
        ) : (
          <>
            {featuredEvent && !searchQuery && selectedCategory === 'All' && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  Featured Event
                </h2>
                <EventCard event={featuredEvent} variant="featured" />
              </div>
            )}

            {!searchQuery && selectedCategory === 'All' && events.length > 4 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"><Brain className="h-5 w-5 text-white" /></div>
                    Recommended For You
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600/20 text-purple-300 border border-purple-500/30">AI Powered</Badge>
                    <Button variant="ghost" size="icon" onClick={fetchAIRecommendations} disabled={aiLoading}><RefreshCw className={cn("h-4 w-4", aiLoading && "animate-spin")} /></Button>
                  </div>
                </div>
                
                {aiLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-[300px] rounded-2xl bg-white/5 animate-pulse" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {aiRecommendations.slice(0, 4).map((rec) => {
                      const event = events.find(e => e.id === rec.eventId);
                      if (!event) return null;
                      return <EventCard key={event.id} event={event} variant="default" />;
                    })}
                  </div>
                )}
              </div>
            )}

            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                <Search className="h-16 w-16 text-gray-600 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">No events found</h3>
                <Button variant="outline" className="border-white/20 text-white mt-6" onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <div className={cn(viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4")}>
                {displayedEvents.map((event) => <EventCard key={event.id} event={event} variant={viewMode === 'list' ? 'compact' : 'default'} />)}
              </div>
            )}
            
            {hasMore && displayedEvents.length < filteredEvents.length && (
              <div ref={loadMoreRef} className="flex justify-center py-10">
                {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-purple-500" />}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}