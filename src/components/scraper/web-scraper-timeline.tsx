'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  TrendingUp,
  Search,
  Globe,
  Filter,
  Download,
  PlayCircle,
  PauseCircle,
  Settings,
  AlertCircle,
  ExternalLink,
  Eye,
  BarChart3,
  Activity,
  Zap,
} from 'lucide-react';
import { db } from '@/core/config/firebase';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, where, serverTimestamp, limit as firestoreLimit } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface ScrapedEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  source: string;
  sourceUrl: string;
  description: string;
  category: string;
  price?: string;
  attendees?: number;
  organizer: string;
  tags: string[];
  scrapedAt: string;
  sentiment?: number;
  relevanceScore: number;
}

interface ScrapingTarget {
  id: string;
  name: string;
  url: string;
  selector: string;
  frequency: number; // hours
  active: boolean;
  lastScraped?: string;
  eventsFound: number;
  status: 'active' | 'paused' | 'error';
}

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  type: 'scraped' | 'internal' | 'competitor';
  source: string;
  impact: 'high' | 'medium' | 'low';
  attendees?: number;
  category: string;
}

interface CompetitorAnalysis {
  competitor: string;
  eventsCount: number;
  averageAttendance: number;
  categories: string[];
  priceRange: { min: number; max: number };
  trend: 'up' | 'down' | 'stable';
  marketShare: number;
}

export default function WebScraperTimeline() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'scraper' | 'timeline' | 'analytics' | 'targets'>('scraper');
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [scrapedEvents, setScrapedEvents] = useState<ScrapedEvent[]>([]);
  const [scrapingTargets, setScrapingTargets] = useState<ScrapingTarget[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    source: '',
    dateRange: '30d',
    priceRange: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Load scraped events from Firestore
  const loadScrapedEvents = useCallback(async () => {
    try {
      const eventsQuery = query(
        collection(db, 'scraped_events'),
        orderBy('scrapedAt', 'desc'),
        firestoreLimit(50)
      );
      const snapshot = await getDocs(eventsQuery);
      const events: ScrapedEvent[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScrapedEvent[];
      setScrapedEvents(events);
    } catch (error) {
      console.error('Error loading scraped events:', error);
    }
  }, []);

  // Load scraping targets from Firestore
  const loadScrapingTargets = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const targetsQuery = query(
        collection(db, 'scraping_targets'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(targetsQuery);
      const targets: ScrapingTarget[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScrapingTarget[];
      setScrapingTargets(targets);
    } catch (error) {
      console.error('Error loading scraping targets:', error);
    }
  }, [user?.uid]);

  // Load timeline events from Firestore
  const loadTimelineEvents = useCallback(async () => {
    try {
      const timelineQuery = query(
        collection(db, 'timeline_events'),
        orderBy('date', 'desc'),
        firestoreLimit(50)
      );
      const snapshot = await getDocs(timelineQuery);
      const events: TimelineEvent[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimelineEvent[];
      setTimelineEvents(events);
    } catch (error) {
      console.error('Error loading timeline events:', error);
    }
  }, []);

  // Load competitor analysis from Firestore
  const loadCompetitorAnalysis = useCallback(async () => {
    try {
      const analysisQuery = query(collection(db, 'competitor_analysis'));
      const snapshot = await getDocs(analysisQuery);
      const analysis: CompetitorAnalysis[] = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as CompetitorAnalysis[];
      setCompetitorAnalysis(analysis);
    } catch (error) {
      console.error('Error loading competitor analysis:', error);
    }
  }, []);

  useEffect(() => {
    loadScrapingData();
    const interval = setInterval(refreshScrapingData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadScrapingData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadScrapedEvents(),
        loadScrapingTargets(),
        loadTimelineEvents(),
        loadCompetitorAnalysis()
      ]);
    } catch (error) {
      console.error('Error loading scraping data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scraping data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshScrapingData = async () => {
    if (!isScrapingActive) return;
    
    try {
      // Refresh from Firestore
      await loadScrapedEvents();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const toggleScraping = async () => {
    setIsScrapingActive(!isScrapingActive);
    if (!isScrapingActive) {
      toast({
        title: 'Scraping Started',
        description: 'Web scraping has been activated.',
      });
    } else {
      toast({
        title: 'Scraping Stopped',
        description: 'Web scraping has been paused.',
      });
    }
  };

  const addScrapingTarget = async (target: Omit<ScrapingTarget, 'id' | 'eventsFound' | 'status'>) => {
    if (!user?.uid) return;
    
    try {
      const newTargetData = {
        ...target,
        userId: user.uid,
        eventsFound: 0,
        status: 'active',
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'scraping_targets'), newTargetData);
      
      const newTarget: ScrapingTarget = {
        ...target,
        id: docRef.id,
        eventsFound: 0,
        status: 'active',
      };
      
      setScrapingTargets(prev => [...prev, newTarget]);
      
      toast({
        title: 'Target Added',
        description: 'Scraping target has been added successfully.',
      });
    } catch (error) {
      console.error('Error adding scraping target:', error);
      toast({
        title: 'Error',
        description: 'Failed to add scraping target.',
        variant: 'destructive',
      });
    }
  };

  const removeScrapingTarget = async (targetId: string) => {
    try {
      await deleteDoc(doc(db, 'scraping_targets', targetId));
      setScrapingTargets(prev => prev.filter(t => t.id !== targetId));
      
      toast({
        title: 'Target Removed',
        description: 'Scraping target has been removed.',
      });
    } catch (error) {
      console.error('Error removing scraping target:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove scraping target.',
        variant: 'destructive',
      });
    }
  };

  const exportData = async (format: 'csv' | 'json' | 'xlsx') => {
    const exportData = {
      events: scrapedEvents,
      timeline: timelineEvents,
      competitors: competitorAnalysis,
      exportedAt: new Date().toISOString(),
    };
    
    console.log(`Exporting data as ${format.toUpperCase()}:`, exportData);
    // Implement actual export logic
  };

  const filteredEvents = scrapedEvents.filter(event => {
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !event.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (filters.category && event.category !== filters.category) {
      return false;
    }
    
    if (filters.source && event.source !== filters.source) {
      return false;
    }
    
    return true;
  });

  const ScrapingOverview = () => (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Web Scraping Control</h2>
          <button
            onClick={toggleScraping}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isScrapingActive
                ? 'bg-destructive hover:bg-destructive/90 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isScrapingActive ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
            <span>{isScrapingActive ? 'Stop Scraping' : 'Start Scraping'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-secondary/10 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Activity className="text-secondary" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Active Targets</p>
                <p className="text-2xl font-bold text-secondary">
                  {scrapingTargets.filter(t => t.active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-500/10 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Globe className="text-green-500" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Events Found</p>
                <p className="text-2xl font-bold text-green-600">{scrapedEvents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <TrendingUp className="text-purple-500" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">94%</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/10 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Zap className="text-orange-500" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Last Update</p>
                <p className="text-sm font-medium text-orange-600">2 mins ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="technology">Technology</option>
            <option value="business">Business</option>
            <option value="networking">Networking</option>
            <option value="education">Education</option>
          </select>

          <select
            value={filters.source}
            onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sources</option>
            <option value="eventbrite">Eventbrite</option>
            <option value="meetup">Meetup</option>
            <option value="facebook">Facebook Events</option>
            <option value="linkedin">LinkedIn</option>
          </select>

          <button
            onClick={() => exportData('csv')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <Download size={20} />
            <span>Export</span>
          </button>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.relevanceScore > 80 ? 'bg-green-100 text-green-800' :
                      event.relevanceScore > 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {event.relevanceScore}% match
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={16} />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Globe size={16} />
                      <span>{event.source}</span>
                    </div>
                    {event.attendees && (
                      <div className="flex items-center space-x-1">
                        <Eye size={16} />
                        <span>{event.attendees} attendees</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <a
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const TimelineView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Event Timeline</h2>
        
        <div className="relative">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="relative flex items-center mb-8">
              <div className="flex-shrink-0">
                <div className={`w-4 h-4 rounded-full ${
                  event.impact === 'high' ? 'bg-red-500' :
                  event.impact === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
              </div>
              
              <div className="ml-4 flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.type === 'scraped' ? 'bg-blue-100 text-blue-800' :
                    event.type === 'internal' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {event.type}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                  <span>{event.source}</span>
                  <span>{event.category}</span>
                  {event.attendees && <span>{event.attendees} attendees</span>}
                </div>
              </div>
              
              {index < timelineEvents.length - 1 && (
                <div className="absolute left-2 top-8 w-0.5 h-8 bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AnalyticsView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competitorAnalysis.map((competitor) => (
          <div key={competitor.competitor} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{competitor.competitor}</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Events</span>
                <span className="font-medium">{competitor.eventsCount}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Attendance</span>
                <span className="font-medium">{competitor.averageAttendance}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Market Share</span>
                <span className="font-medium">{competitor.marketShare}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Trend</span>
                <div className={`flex items-center space-x-1 ${
                  competitor.trend === 'up' ? 'text-green-500' :
                  competitor.trend === 'down' ? 'text-red-500' :
                  'text-gray-500'
                }`}>
                  <TrendingUp size={16} className={
                    competitor.trend === 'down' ? 'rotate-180' : ''
                  } />
                  <span className="text-sm font-medium capitalize">{competitor.trend}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TargetsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Scraping Targets</h2>
          <button
            onClick={() => {
              // Open add target modal
              console.log('Opening add target modal');
            }}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            Add Target
          </button>
        </div>

        <div className="space-y-4">
          {scrapingTargets.map((target) => (
            <div key={target.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{target.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    target.status === 'active' ? 'bg-green-100 text-green-800' :
                    target.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {target.status}
                  </span>
                  <button
                    onClick={() => removeScrapingTarget(target.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">URL:</span>
                  <p className="font-medium truncate">{target.url}</p>
                </div>
                <div>
                  <span className="text-gray-600">Frequency:</span>
                  <p className="font-medium">{target.frequency}h</p>
                </div>
                <div>
                  <span className="text-gray-600">Events Found:</span>
                  <p className="font-medium">{target.eventsFound}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center space-x-3 mb-8">
        <BarChart3 className="text-secondary" size={32} />
        <h1 className="text-3xl font-bold">Web Scraper & Timeline Analytics</h1>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'scraper', label: 'Event Scraper', icon: Globe },
            { id: 'timeline', label: 'Timeline View', icon: Calendar },
            { id: 'analytics', label: 'Competitor Analysis', icon: BarChart3 },
            { id: 'targets', label: 'Scraping Targets', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'scraper' | 'timeline' | 'analytics' | 'targets')}
              className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <tab.icon size={20} />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="bg-card rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading scraping data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'scraper' && <ScrapingOverview />}
          {activeTab === 'timeline' && <TimelineView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'targets' && <TargetsView />}
        </>
      )}
    </div>
  );
}