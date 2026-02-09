'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp, Users, Target, Calendar, BookOpen, Network, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  getAIRecommendations, 
  getAIContentRecommendations, 
  getAIConnectionRecommendations,
  ContentRecommendation,
  ConnectionRecommendation
} from '@/app/actions/ai-recommendations';
import { cn } from '@/core/utils/utils';

interface EventRecommendationEnriched {
  eventId: string;
  title: string;
  type: string;
  relevanceScore: number;
  recommendationReason: string;
  personalizedPitch: string;
  expectedValue: string[];
  networkingOpportunities: string[];
  preparationSuggestions: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
  startTime: Date;
  duration: number;
}

interface InsightCard {
  title: string;
  value: string | number;
  description: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

export default function AiRecommendationDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(false);
  const [eventRecommendations, setEventRecommendations] = useState<EventRecommendationEnriched[]>([]);
  const [contentRecommendations, setContentRecommendations] = useState<ContentRecommendation[]>([]);
  const [connectionRecommendations, setConnectionRecommendations] = useState<ConnectionRecommendation[]>([]);
  const [insights, setInsights] = useState<InsightCard[]>([]);

  const events = useQuery(api.events.get) || [];

  const loadRecommendations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [eventsRes, contentRes, connectionsRes] = await Promise.all([
        getAIRecommendations(user._id || user.id),
        getAIContentRecommendations(user._id || user.id),
        getAIConnectionRecommendations(user._id || user.id)
      ]);

      // Enrich event recommendations with full event data from Convex
      const enrichedEvents = eventsRes.recommendations.map(rec => {
        const fullEvent = events.find((e: any) => e._id === rec.eventId);
        return {
          eventId: rec.eventId,
          title: fullEvent?.title || 'Unknown Event',
          type: fullEvent?.category || 'General',
          relevanceScore: rec.relevanceScore,
          recommendationReason: rec.reason,
          personalizedPitch: rec.pitch,
          expectedValue: ['Skill development', 'Networking', 'Industry insights'],
          networkingOpportunities: ['Meet peers', 'Connect with speakers'],
          preparationSuggestions: ['Review agenda', 'Prepare questions'],
          confidenceLevel: rec.confidenceLevel,
          startTime: new Date(fullEvent?.startDate || Date.now()),
          duration: 120
        };
      });

      setEventRecommendations(enrichedEvents);
      setContentRecommendations(contentRes);
      setConnectionRecommendations(connectionsRes);

      // Dynamic insights based on counts
      setInsights([
        { title: 'Matches Found', value: enrichedEvents.length + connectionsRes.length, description: 'AI-personalized for you', trend: 'up', icon: <Target className="w-4 h-4" /> },
        { title: 'Connections', value: connectionsRes.length, description: 'Potential peers', trend: 'up', icon: <Users className="w-4 h-4" /> },
        { title: 'Content Picks', value: contentRes.length, description: 'Learning resources', trend: 'stable', icon: <BookOpen className="w-4 h-4" /> },
        { title: 'Events', value: enrichedEvents.length, description: 'Recommended for you', trend: 'up', icon: <Calendar className="w-4 h-4" /> }
      ]);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [user, events]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-cyan-400';
    if (score >= 60) return 'text-blue-400';
    return 'text-gray-400';
  };

  const getConfidenceBadgeColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500/20 text-green-400 border-green-500/20';
      case 'medium': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      default: return 'bg-white/5 text-gray-400 border-white/10';
    }
  };

  if (loading && eventRecommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-cyan-500" />
        <p className="text-gray-400">Genie is analyzing your profile to find the best matches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, index) => (
          <Card key={index} className="bg-white/5 border-white/10 overflow-hidden group hover:border-cyan-500/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">{insight.title}</p>
                <div className="p-2 bg-white/5 rounded-lg text-cyan-400 group-hover:scale-110 transition-transform">
                  {insight.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{insight.value}</p>
              <p className="text-xs text-gray-500 mt-1">{insight.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#0f172a]/60 border-white/10 backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b border-white/5 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-cyan-500/20 p-2 rounded-xl">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Your Personalized Picks</CardTitle>
                <p className="text-sm text-gray-400 mt-1">Refined by AI based on your interests and activity</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadRecommendations} disabled={loading} className="border-white/10">
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/5 border border-white/10 p-1 mb-8">
              <TabsTrigger value="events" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                <Calendar className="w-4 h-4 mr-2" />
                Events
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                <BookOpen className="w-4 h-4 mr-2" />
                Learning
              </TabsTrigger>
              <TabsTrigger value="connections" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                <Network className="w-4 h-4 mr-2" />
                Connections
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-6">
              {eventRecommendations.map((event) => (
                <Card key={event.eventId} className="bg-white/5 border-white/10 hover:border-cyan-500/50 transition-all group overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-xl text-white group-hover:text-cyan-400 transition-colors">{event.title}</h3>
                          <Badge variant="outline" className="border-white/10 text-gray-400">{event.type}</Badge>
                          <Badge variant="outline" className={getConfidenceBadgeColor(event.confidenceLevel)}>
                            {event.confidenceLevel} match
                          </Badge>
                        </div>
                        <p className="text-gray-300 italic">"{event.personalizedPitch}"</p>
                        <p className="text-sm text-gray-400 leading-relaxed">{event.recommendationReason}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Key Benefits:</p>
                            <ul className="text-sm text-gray-400 space-y-1">
                              {event.expectedValue.map((v, i) => <li key={i} className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-500 rounded-full" /> {v}</li>)}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preparation:</p>
                            <div className="flex flex-wrap gap-2">
                              {event.preparationSuggestions.map((s, i) => <Badge key={i} variant="secondary" className="bg-white/5 text-[10px]">{s}</Badge>)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start w-full md:w-auto gap-4">
                        <div className="text-right">
                          <div className={`text-3xl font-black ${getScoreColor(event.relevanceScore)}`}>
                            {event.relevanceScore}%
                          </div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-tighter">AI Score</p>
                        </div>
                        <Button className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20">
                          Register Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              {contentRecommendations.map((content) => (
                <Card key={content.contentId} className="bg-white/5 border-white/10 hover:border-cyan-500/50 transition-all overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-white">{content.title}</h3>
                          <Badge variant="outline" className="border-white/10 text-gray-400">{content.type}</Badge>
                          <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/5">{content.difficulty}</Badge>
                        </div>
                        <p className="text-sm text-cyan-400/70 mb-2">Curated by {content.author}</p>
                        <p className="text-gray-400 text-sm leading-relaxed">{content.personalizedRationale}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-2xl font-bold ${getScoreColor(content.relevanceScore)}`}>
                          {content.relevanceScore}%
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase">Match</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {content.estimatedTime} min</span>
                      </div>
                      <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border-0">
                        Start Learning
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="connections" className="space-y-6">
              {connectionRecommendations.map((connection) => (
                <Card key={connection.userId} className="bg-white/5 border-white/10 hover:border-cyan-500/50 transition-all overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-14 w-14 border-2 border-cyan-500/20">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${connection.name}`} />
                          <AvatarFallback className="bg-cyan-500/10 text-cyan-500 font-bold">{connection.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-white">{connection.name}</h3>
                            <Badge variant="outline" className={getConfidenceBadgeColor(connection.successLikelihood)}>
                              {connection.successLikelihood} success
                            </Badge>
                          </div>
                          <p className="text-sm text-cyan-400/70">{connection.role} at {connection.company}</p>
                          <p className="text-gray-400 text-sm italic">"{connection.connectionRationale}"</p>
                        </div>
                      </div>
                      <div className="text-right w-full md:w-auto">
                        <div className={`text-3xl font-black ${getScoreColor(connection.connectionValue)}`}>
                          {connection.connectionValue}%
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase">Match</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4 bg-white/5 rounded-xl p-4 border border-white/5">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Conversation Starters:</p>
                      <div className="space-y-2">
                        {connection.conversationStarters.map((starter, idx) => (
                          <div key={idx} className="bg-white/5 p-2 rounded-lg text-xs text-gray-300 border border-white/5">
                            "{starter}"
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <p className="text-xs text-gray-500 max-w-[60%]">{connection.approachStrategy}</p>
                      <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white">
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
