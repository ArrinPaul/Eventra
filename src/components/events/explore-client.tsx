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
import { eventService } from '@/lib/firestore-services';
import { useAuth } from '@/hooks/use-auth';
import { getAIRecommendations, AIRecommendation } from '@/app/actions/ai-recommendations';
import { cn } from '@/lib/utils';
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24">
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
              <span className="gradient-text">Explore</span> Events
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover amazing events happening around you. Filter by category, date, or search for something specific.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search events, categories, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 text-lg rounded-xl border-2 focus:border-primary"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Content */}
      <section className="container mx-auto px-4 py-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              className="rounded-full whitespace-nowrap"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b mb-6">
          <div className="flex items-center gap-3">
            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* More Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Events</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  {/* Location Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Filter by location..."
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Free Events Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Free Events Only</p>
                      <p className="text-sm text-muted-foreground">Show only free events</p>
                    </div>
                    <Button
                      variant={showOnlyFree ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowOnlyFree(!showOnlyFree)}
                    >
                      {showOnlyFree ? 'On' : 'Off'}
                    </Button>
                  </div>

                  {/* Clear Filters */}
                  {activeFiltersCount > 0 && (
                    <Button variant="outline" className="w-full" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Clear filters button */}
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </div>

          {/* View Toggle & Count */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {filteredEvents.length} events found
            </span>
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-l-none"
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
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Featured Event */}
            {featuredEvent && !searchQuery && selectedCategory === 'All' && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Featured Event
                </h2>
                <EventCard event={featuredEvent} variant="featured" />
              </div>
            )}

            {/* AI Recommendations - For You Section */}
            {!searchQuery && selectedCategory === 'All' && events.length > 4 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Brain className="h-5 w-5 text-secondary" />
                    Recommended For You
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI Powered
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={fetchAIRecommendations}
                      disabled={aiLoading}
                      className="h-7 px-2"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", aiLoading && "animate-spin")} />
                    </Button>
                  </div>
                </div>
                
                {/* AI Insights Banner */}
                {aiInsights?.weeklyPlan && !aiError && (
                  <div className="bg-gradient-to-r from-secondary/10 to-primary/10 rounded-lg p-3 mb-4 border border-secondary/20">
                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                      <Sparkles className="h-4 w-4 mt-0.5 text-secondary flex-shrink-0" />
                      <span><strong>AI Tip:</strong> {aiInsights.weeklyPlan}</span>
                    </p>
                  </div>
                )}
                
                {aiError && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {aiError}
                  </p>
                )}
                
                {aiLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-[300px] rounded-lg bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                    ? "bg-gradient-to-r from-secondary to-primary"
                                    : "bg-gradient-to-r from-blue-500 to-indigo-500"
                              )}
                            >
                              {rec.relevanceScore}% Match
                            </Badge>
                          </div>
                          
                          {/* AI Reason Tooltip on Hover */}
                          <div className="absolute -top-12 left-0 right-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-popover text-popover-foreground text-xs p-2 rounded-lg shadow-lg border mx-2">
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
                            <Badge className="bg-gradient-to-r from-secondary to-primary text-white text-xs shadow-lg">
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

            {/* Events Grid/List */}
            {filteredEvents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No events found</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Try adjusting your filters or search query to find more events.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-2"
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
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {loadingMore && (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    )}
                  </div>
                )}

                {/* End of results */}
                {displayedEvents.length >= filteredEvents.length && filteredEvents.length > ITEMS_PER_PAGE && (
                  <p className="text-center text-muted-foreground py-8">
                    You've reached the end! {filteredEvents.length} events shown.
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
