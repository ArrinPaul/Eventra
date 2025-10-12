'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Tag, 
  SlidersHorizontal,
  X,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { collection, query, where, orderBy, getDocs, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SearchFilters {
  category: string;
  location: string;
  dateRange: string;
  priceRange: string;
  eventType: string;
  skill: string;
  sortBy: string;
}

interface SearchResult {
  id: string;
  type: 'event' | 'community' | 'user' | 'discussion';
  title: string;
  description: string;
  category?: string;
  location?: string;
  startTime?: Date;
  price?: number;
  tags?: string[];
  imageUrl?: string;
  memberCount?: number;
  attendeeCount?: number;
  relevanceScore?: number;
}

interface SavedSearch {
  id: string;
  query: string;
  filters: SearchFilters;
  name: string;
  createdAt: Date;
}

export default function AdvancedSearchInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    location: '',
    dateRange: '',
    priceRange: '',
    eventType: '',
    skill: '',
    sortBy: 'relevance'
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [bookmarkedResults, setBookmarkedResults] = useState<string[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const categories = [
    'Technology', 'Business', 'Marketing', 'Design', 'Data Science', 'AI/ML',
    'Healthcare', 'Education', 'Finance', 'Engineering', 'Sales', 'HR'
  ];

  const eventTypes = [
    'Conference', 'Workshop', 'Webinar', 'Meetup', 'Networking', 'Training',
    'Panel Discussion', 'Hackathon', 'Social Event', 'Competition'
  ];

  useEffect(() => {
    loadSavedSearches();
    loadBookmarkedResults();
  }, [user]);

  const loadSavedSearches = async () => {
    if (!user) return;

    try {
      const savedSearchesQuery = query(
        collection(db, 'savedSearches'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(savedSearchesQuery);
      
      const searches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as SavedSearch[];
      
      setSavedSearches(searches);
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const loadBookmarkedResults = async () => {
    if (!user) return;

    try {
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('uid', '==', user.uid)
      ));
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        setBookmarkedResults(userData.bookmarkedSearchResults || []);
      }
    } catch (error) {
      console.error('Error loading bookmarked results:', error);
    }
  };

  const performSearch = async (isLoadMore = false) => {
    if (!searchQuery.trim() && Object.values(filters).every(f => !f)) return;

    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];
      
      // Search events
      if (!filters.eventType || eventTypes.includes(filters.eventType)) {
        const eventsResults = await searchEvents(isLoadMore);
        searchResults.push(...eventsResults);
      }

      // Search communities
      const communitiesResults = await searchCommunities(isLoadMore);
      searchResults.push(...communitiesResults);

      // Search users
      const usersResults = await searchUsers(isLoadMore);
      searchResults.push(...usersResults);

      // Search discussions
      const discussionsResults = await searchDiscussions(isLoadMore);
      searchResults.push(...discussionsResults);

      // Sort and rank results
      const rankedResults = rankSearchResults(searchResults);
      
      if (isLoadMore) {
        setResults(prev => [...prev, ...rankedResults]);
      } else {
        setResults(rankedResults);
      }

      setHasMore(rankedResults.length >= 20);
    } catch (error) {
      console.error('Error performing search:', error);
      toast({
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchEvents = async (isLoadMore = false): Promise<SearchResult[]> => {
    let eventsQuery = query(collection(db, 'events'));

    // Apply filters
    if (filters.category) {
      eventsQuery = query(eventsQuery, where('category', '==', filters.category));
    }
    
    if (filters.location) {
      eventsQuery = query(eventsQuery, where('location', '>=', filters.location));
    }

    if (filters.dateRange) {
      const now = new Date();
      let startDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
      }
      
      eventsQuery = query(eventsQuery, where('startTime', '>=', startDate));
    }

    // Add sorting
    switch (filters.sortBy) {
      case 'date':
        eventsQuery = query(eventsQuery, orderBy('startTime', 'asc'));
        break;
      case 'popularity':
        eventsQuery = query(eventsQuery, orderBy('attendeeCount', 'desc'));
        break;
      default:
        eventsQuery = query(eventsQuery, orderBy('createdAt', 'desc'));
    }

    // Add pagination
    eventsQuery = query(eventsQuery, limit(20));
    if (isLoadMore && lastDoc) {
      eventsQuery = query(eventsQuery, startAfter(lastDoc));
    }

    const snapshot = await getDocs(eventsQuery);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'event' as const,
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        startTime: data.startTime.toDate(),
        price: data.price || 0,
        tags: data.tags || [],
        imageUrl: data.imageUrl,
        attendeeCount: data.attendeeCount || 0,
        relevanceScore: calculateRelevanceScore(data, searchQuery)
      };
    });
  };

  const searchCommunities = async (isLoadMore = false): Promise<SearchResult[]> => {
    let communitiesQuery = query(
      collection(db, 'communities'),
      orderBy('memberCount', 'desc'),
      limit(20)
    );

    if (isLoadMore && lastDoc) {
      communitiesQuery = query(communitiesQuery, startAfter(lastDoc));
    }

    const snapshot = await getDocs(communitiesQuery);

    return snapshot.docs
      .filter(doc => {
        const data = doc.data();
        return searchQuery ? 
          data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          data.description.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      })
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'community' as const,
          title: data.name,
          description: data.description,
          category: data.category,
          tags: data.tags || [],
          imageUrl: data.imageUrl,
          memberCount: data.memberCount || 0,
          relevanceScore: calculateRelevanceScore(data, searchQuery)
        };
      });
  };

  const searchUsers = async (isLoadMore = false): Promise<SearchResult[]> => {
    let usersQuery = query(
      collection(db, 'users'),
      limit(20)
    );

    if (isLoadMore && lastDoc) {
      usersQuery = query(usersQuery, startAfter(lastDoc));
    }

    const snapshot = await getDocs(usersQuery);

    return snapshot.docs
      .filter(doc => {
        const data = doc.data();
        if (!searchQuery) return true;
        
        return data.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               data.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               data.skills?.some((skill: string) => 
                 skill.toLowerCase().includes(searchQuery.toLowerCase())
               );
      })
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'user' as const,
          title: data.displayName || 'Unknown User',
          description: data.title || 'Professional',
          tags: data.skills || [],
          imageUrl: data.photoURL,
          relevanceScore: calculateRelevanceScore(data, searchQuery)
        };
      });
  };

  const searchDiscussions = async (isLoadMore = false): Promise<SearchResult[]> => {
    let discussionsQuery = query(
      collection(db, 'discussions'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    if (isLoadMore && lastDoc) {
      discussionsQuery = query(discussionsQuery, startAfter(lastDoc));
    }

    const snapshot = await getDocs(discussionsQuery);

    return snapshot.docs
      .filter(doc => {
        const data = doc.data();
        return searchQuery ? 
          data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          data.content.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      })
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'discussion' as const,
          title: data.title,
          description: data.content.substring(0, 200) + '...',
          category: data.category,
          tags: data.tags || [],
          relevanceScore: calculateRelevanceScore(data, searchQuery)
        };
      });
  };

  const calculateRelevanceScore = (data: any, query: string): number => {
    if (!query) return 0.5;
    
    let score = 0;
    const lowerQuery = query.toLowerCase();
    
    // Title match (highest weight)
    if (data.title?.toLowerCase().includes(lowerQuery)) score += 1.0;
    if (data.name?.toLowerCase().includes(lowerQuery)) score += 1.0;
    
    // Description match (medium weight)
    if (data.description?.toLowerCase().includes(lowerQuery)) score += 0.5;
    if (data.content?.toLowerCase().includes(lowerQuery)) score += 0.5;
    
    // Tags/skills match (medium weight)
    if (data.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))) score += 0.7;
    if (data.skills?.some((skill: string) => skill.toLowerCase().includes(lowerQuery))) score += 0.7;
    
    // Category match (low weight)
    if (data.category?.toLowerCase().includes(lowerQuery)) score += 0.3;
    
    return Math.min(score, 1.0);
  };

  const rankSearchResults = (results: SearchResult[]): SearchResult[] => {
    return results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date':
          if (a.startTime && b.startTime) {
            return a.startTime.getTime() - b.startTime.getTime();
          }
          return 0;
        case 'popularity':
          return (b.attendeeCount || b.memberCount || 0) - (a.attendeeCount || a.memberCount || 0);
        default:
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      }
    });
  };

  const saveSearch = async () => {
    if (!user || !searchQuery.trim()) return;

    try {
      const searchName = prompt('Enter a name for this saved search:');
      if (!searchName) return;

      const savedSearch = {
        userId: user.uid,
        name: searchName,
        query: searchQuery,
        filters: filters,
        createdAt: new Date()
      };

      // In a real app, you would save this to Firestore
      // await addDoc(collection(db, 'savedSearches'), savedSearch);
      
      toast({
        title: "Search Saved",
        description: `Search "${searchName}" has been saved`,
      });

      loadSavedSearches();
    } catch (error) {
      console.error('Error saving search:', error);
      toast({
        title: "Error",
        description: "Failed to save search",
        variant: "destructive",
      });
    }
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setSearchQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    performSearch();
  };

  const toggleBookmark = async (resultId: string) => {
    if (!user) return;

    try {
      const newBookmarks = bookmarkedResults.includes(resultId)
        ? bookmarkedResults.filter(id => id !== resultId)
        : [...bookmarkedResults, resultId];

      setBookmarkedResults(newBookmarks);

      // In a real app, you would update this in Firestore
      // await updateDoc(doc(db, 'users', user.uid), {
      //   bookmarkedSearchResults: newBookmarks
      // });

      toast({
        title: bookmarkedResults.includes(resultId) ? "Bookmark Removed" : "Bookmark Added",
        description: "Search result bookmark updated",
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      location: '',
      dateRange: '',
      priceRange: '',
      eventType: '',
      skill: '',
      sortBy: 'relevance'
    });
    setResults([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Search</h2>
          <p className="text-muted-foreground">
            Search events, communities, users, and discussions with powerful filters
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for events, communities, people, or discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                />
              </div>
              <Button onClick={() => performSearch()} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Location"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  />

                  <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="popularity">Popularity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                  <Button variant="outline" size="sm" onClick={saveSearch}>
                    Save Search
                  </Button>
                </div>
              </div>
            )}

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Saved Searches:</p>
                <div className="flex flex-wrap gap-2">
                  {savedSearches.map((search) => (
                    <Button
                      key={search.id}
                      variant="outline"
                      size="sm"
                      onClick={() => loadSavedSearch(search)}
                    >
                      {search.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Search Results ({results.length} found)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result) => (
              <div key={`${result.type}-${result.id}`} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{result.type}</Badge>
                      <h3 className="font-medium">{result.title}</h3>
                      {result.relevanceScore && result.relevanceScore > 0.7 && (
                        <Badge variant="default" className="text-xs">High Match</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {result.category && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {result.category}
                        </div>
                      )}
                      {result.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {result.location}
                        </div>
                      )}
                      {result.startTime && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {result.startTime.toLocaleDateString()}
                        </div>
                      )}
                      {result.attendeeCount && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {result.attendeeCount} attendees
                        </div>
                      )}
                      {result.memberCount && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {result.memberCount} members
                        </div>
                      )}
                    </div>
                    
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {result.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{result.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookmark(result.id)}
                    >
                      {bookmarkedResults.includes(result.id) ? (
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => performSearch(true)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Results'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {results.length === 0 && searchQuery && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No results found</p>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}