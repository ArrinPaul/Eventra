'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Sparkles,
  Grid3X3,
  List,
  X,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  Brain,
  RefreshCw
} from 'lucide-react';
import { EventCard } from '@/components/events/event-card';
import { eventService } from '@/core/services/firestore-services';
import { useAuth } from '@/hooks/use-auth';
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

  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const fetchedEvents = await eventService.getEvents();
        // Filter to only show published and upcoming events
        const publicEvents = fetchedEvents.filter(event => {
          const eventDate = event.startDate ? new Date(event.startDate) : new Date(event.date || '');
          return event.status !== 'cancelled' && event.visibility !== 'private';
        });
        setEvents(publicEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Fetch AI Recommendations when events are loaded
  const fetchAIRecommendations = useCallback(async () => {
    if (events.length === 0) return;
    
    setAiLoading(true);
    setAiError(null);
    
    try {
      // Get user preferences from their profile using type-safe helpers
      const userInterests = getUserInterests(user) || ['Tech', 'Networking', 'Career'];
      const userSkills = getUserSkills(user) || ['networking', 'learning'];
      const pastEventTypes = getUserAttendedEvents(user).slice(0, 5).map(() => 'Workshop');
      
      const result = await getAIRecommendations(
        user?.id || 'guest',
        userInterests,
        userSkills,
        pastEventTypes,
        events
      );
      
      setAiRecommendations(result.recommendations);
      setAiInsights(result.insights || null);
      if (result.error) {
        setAiError(result.error);
      }
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error);
      setAiError('Unable to load personalized recommendations');
    } finally {
      setAiLoading(false);
    }
  }, [events, user]);

  // Trigger AI recommendations when events change
  useEffect(() => {
    if (events.length > 0 && aiRecommendations.length === 0) {
      fetchAIRecommendations();
    }
  }, [events, fetchAIRecommendations, aiRecommendations.length]);

  // Apply filters
  useEffect(() => {
    let result = [...events];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter(event => event.category === selectedCategory);
    }

    // Date filter
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

    // Free events filter
    if (showOnlyFree) {
      result = result.filter(event => event.pricing?.isFree || event.pricing?.type === 'free');
    }

    // Location filter
    if (locationFilter) {
      result = result.filter(event => {
        const location = typeof event.location === 'string' 
          ? event.location 
          : event.location?.venue?.name || '';
        return location.toLowerCase().includes(locationFilter.toLowerCase());
      });
    }

    // Sort
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

  // Infinite scroll observer
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

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [handleObserver]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (dateFilter !== 'all') params.set('date', dateFilter);
    if (sortBy !== 'date-asc') params.set('sort', sortBy);
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [searchQuery, selectedCategory, dateFilter, sortBy]);

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

  // Get featured event (most registered upcoming)
  const featuredEvent = events
    .filter(e => {
      const eventDate = e.startDate ? new Date(e.startDate) : new Date(e.date || '');
      return eventDate > new Date();
    })
    .sort((a, b) => ((b.registeredCount || b.registeredUsers?.length || 0) - (a.registeredCount || a.registeredUsers?.length || 0)))[0];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[100px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge className="mb-6 px-4 py-2 bg-white/10 border-white/20 text-white backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
              Discover Amazing Events
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Explore </span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Events
              </span>
            </h1>
            <p className="text-xl text-gray-400">
              Find events that match your interests. Filter by category, date, or search for something specific.
            </p>
          </div>

          {/* Search Bar */}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full mr-2"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Content */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-6 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full whitespace-nowrap px-5 py-2 transition-all duration-300",
                selectedCategory === category 
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700" 
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-white/10 mb-8">
          <div className="flex items-center gap-3">
            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white rounded-xl">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10">
                {dateFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value} className="text-gray-300 hover:text-white focus:text-white focus:bg-white/10">
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-gray-300 hover:text-white focus:text-white focus:bg-white/10">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* More Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-1 bg-purple-500 text-white">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-black/95 backdrop-blur-xl border-white/10">
                <SheetHeader>
                  <SheetTitle className="text-white">Filter Events</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  {/* Location Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-300">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Filter by location..."
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Free Events Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="font-medium text-white">Free Events Only</p>
                      <p className="text-sm text-gray-400">Show only free events</p>
                    </div>
                    <Button
                      variant={showOnlyFree ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowOnlyFree(!showOnlyFree)}
                      className={cn(
                        "rounded-full",
                        showOnlyFree 
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                          : "border-white/20 text-gray-400"
                      )}
                    >
                      {showOnlyFree ? 'On' : 'Off'}
                    </Button>
                  </div>

                  {/* Clear Filters */}
                  {activeFiltersCount > 0 && (
                    <Button 
                      variant="outline" 
                      className="w-full border-white/20 text-white hover:bg-white/10 rounded-xl" 
                      onClick={clearFilters}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Clear filters button */}
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400 hover:text-white">
                Clear all
              </Button>
            )}
          </div>

          {/* View Toggle & Count */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {filteredEvents.length} events found
            </span>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg",
                  viewMode === 'grid' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                )}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg",
                  viewMode === 'list' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                )}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            {/* Featured Event */}
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

            {/* AI Recommendations - For You Section */}
            {!searchQuery && selectedCategory === 'All' && events.length > 4 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    Recommended For You
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border border-purple-500/30">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Powered
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={fetchAIRecommendations}
                      disabled={aiLoading}
                      className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                    >
                      <RefreshCw className={cn("h-4 w-4", aiLoading && "animate-spin")} />
                    </Button>
                  </div>
                </div>
                
                {/* AI Insights Banner */}
                {aiInsights?.weeklyPlan && !aiError && (
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 mb-6 border border-purple-500/20">
                    <p className="text-sm text-gray-300 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 mt-0.5 text-purple-400 flex-shrink-0" />
                      <span><strong className="text-white">AI Tip:</strong> {aiInsights.weeklyPlan}</span>
                    </p>
                  </div>
                )}
                
                {aiError && (
                  <p className="text-sm text-gray-400 mb-6">
                    {aiError}
                  </p>
                )}
                
                {aiLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-[300px] rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {aiRecommendations.slice(0, 4).map((rec) => {
                      const event = events.find(e => e.id === rec.eventId);
                      if (!event) return null;
                      
                      return (
                        <div key={event.id} className="relative group">
                          {/* AI Match Badge */}
                          <div className="absolute -top-2 -left-2 z-10">
                            <Badge 
                              className={cn(
                                "text-white text-xs shadow-lg",
                                rec.confidenceLevel === 'high' 
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                  : rec.confidenceLevel === 'medium'
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                                    : "bg-gradient-to-r from-blue-500 to-indigo-500"
                              )}
                            >
                              {rec.relevanceScore}% Match
                            </Badge>
                          </div>
                          
                          {/* AI Reason Tooltip on Hover */}
                          <div className="absolute -top-12 left-0 right-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-black/90 backdrop-blur-xl text-white text-xs p-3 rounded-xl shadow-lg border border-white/10 mx-2">
                              <p className="font-medium">{rec.reason}</p>
                            </div>
                          </div>
                          
                          <EventCard event={event} variant="default" />
                        </div>
                      );
                    })}
                    
                    {/* Fallback if no AI recommendations */}
                    {aiRecommendations.length === 0 && events
                      .filter(e => {
                        const eventDate = e.startDate ? new Date(e.startDate) : new Date(e.date || '');
                        return eventDate > new Date() && e.id !== featuredEvent?.id;
                      })
                      .slice(0, 4)
                      .map((event) => (
                        <div key={event.id} className="relative">
                          <div className="absolute -top-2 -left-2 z-10">
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs shadow-lg">
                              Suggested
                            </Badge>
                          </div>
                          <EventCard event={event} variant="default" />
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {/* All Events Section */}
            {filteredEvents.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-6 text-white">All Events</h2>
              </div>
            )}

            {/* Events Grid/List */}
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-white/5 border border-white/10">
                <Search className="h-16 w-16 text-gray-600 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">No events found</h3>
                <p className="text-gray-400 text-center max-w-md mb-6">
                  Try adjusting your filters or search query to find more events.
                </p>
                <Button 
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10 rounded-full"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                )}>
                  {displayedEvents.map((event) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      variant={viewMode === 'list' ? 'compact' : 'default'}
                    />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && displayedEvents.length < filteredEvents.length && (
                  <div ref={loadMoreRef} className="flex justify-center py-10">
                    {loadingMore && (
                      <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                    )}
                  </div>
                )}

                {/* End of results */}
                {displayedEvents.length >= filteredEvents.length && filteredEvents.length > ITEMS_PER_PAGE && (
                  <p className="text-center text-gray-500 py-10">
                    You&apos;ve reached the end! {filteredEvents.length} events shown.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
