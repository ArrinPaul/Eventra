'use client';
// 
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp, Users, Target, Calendar, BookOpen, Network, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { 
  getAIRecommendations, 
  getAIContentRecommendations, 
  getAIConnectionRecommendations
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
  const [contentRecommendations, setContentRecommendations] = useState<any[]>([]);
  const [connectionRecommendations, setConnectionRecommendations] = useState<any[]>([]);
  const [insights, setInsights] = useState<InsightCard[]>([]);

  const events: any[] = []; // Placeholder for events

  const loadRecommendations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [eventsRes, contentRes, connectionsRes] = await Promise.all([
        getAIRecommendations(user._id || user.id),
        getAIContentRecommendations(user._id || user.id),
        getAIConnectionRecommendations(user._id || user.id)
      ]);

      const enrichedEvents = (eventsRes as any[]).map((rec: any) => {
        const fullEvent = events.find((e: any) => e._id === rec.eventId);
        return {
          eventId: rec.eventId || rec.id,
          title: fullEvent?.title || 'Unknown Event',
          type: fullEvent?.category || 'General',
          relevanceScore: rec.relevanceScore || rec.score || 0,
          recommendationReason: rec.reason || 'Recommended for your profile',
          personalizedPitch: rec.pitch || 'Good match based on your interests',
          expectedValue: ['Skill development', 'Networking', 'Industry insights'],
          networkingOpportunities: ['Meet peers', 'Connect with speakers'],
          preparationSuggestions: ['Review agenda', 'Prepare questions'],
          confidenceLevel: rec.confidenceLevel || 'medium',
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
    if (score >= 75) return 'text-primary';
    if (score >= 60) return 'text-blue-400';
    return 'text-muted-foreground';
  };

  const getConfidenceBadgeColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500/20 text-green-400 border-green-500/20';
      case 'medium': return 'bg-primary/20 text-primary border-primary/20';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      default: return 'bg-muted/40 text-muted-foreground border-border';
    }
  };

  if (loading && eventRecommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Genie is analyzing your profile to find the best matches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, index) => (
          <Card key={index} className="bg-muted/40 border-border overflow-hidden group hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{insight.title}</p>
                <div className="p-2 bg-muted/40 rounded-lg text-primary group-hover:scale-110 transition-transform">
                  {insight.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{insight.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/80 border-border backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-xl">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Your Personalized Picks</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Refined by AI based on your interests and activity</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadRecommendations} disabled={loading} className="border-border">
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted/40 border border-border p-1 mb-8">
              <TabsTrigger value="events" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                <Calendar className="w-4 h-4 mr-2" />
                Events
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                <BookOpen className="w-4 h-4 mr-2" />
                Learning
              </TabsTrigger>
              <TabsTrigger value="connections" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                <Network className="w-4 h-4 mr-2" />
                Connections
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-6">
              {eventRecommendations.map((event) => (
                <Card key={event.eventId} className="bg-muted/40 border-border hover:border-primary/50 transition-all group overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-xl text-white group-hover:text-primary transition-colors">{event.title}</h3>
                          <Badge variant="outline" className="border-border text-muted-foreground">{event.type}</Badge>
                          <Badge variant="outline" className={getConfidenceBadgeColor(event.confidenceLevel)}>
                            {event.confidenceLevel} match
                          </Badge>
                        </div>
                        <p className="text-muted-foreground italic">"{event.personalizedPitch}"</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{event.recommendationReason}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Benefits:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {event.expectedValue.map((v, i) => <li key={i} className="flex items-center gap-2"><div className="w-1 h-1 bg-primary rounded-full" /> {v}</li>)}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preparation:</p>
                            <div className="flex flex-wrap gap-2">
                              {event.preparationSuggestions.map((s, i) => <Badge key={i} variant="secondary" className="bg-muted/40 text-[10px]">{s}</Badge>)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start w-full md:w-auto gap-4">
                        <div className="text-right">
                          <div className={`text-3xl font-black ${getScoreColor(event.relevanceScore)}`}>
                            {event.relevanceScore}%
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">AI Score</p>
                        </div>
                        <Button className="bg-primary hover:bg-primary text-white shadow-lg shadow-primary/20">
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
                <Card key={content.contentId} className="bg-muted/40 border-border hover:border-primary/50 transition-all overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-white">{content.title}</h3>
                          <Badge variant="outline" className="border-border text-muted-foreground">{content.type}</Badge>
                          <Badge variant="outline" className="bg-muted/40 text-muted-foreground border-border/60">{content.difficulty}</Badge>
                        </div>
                        <p className="text-sm text-primary/70 mb-2">Curated by {content.author}</p>
                        <p className="text-muted-foreground text-sm leading-relaxed">{content.personalizedRationale}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-2xl font-bold ${getScoreColor(content.relevanceScore)}`}>
                          {content.relevanceScore}%
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase">Match</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/60">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {content.estimatedTime} min</span>
                      </div>
                      <Button size="sm" className="bg-muted hover:bg-muted text-white border-0">
                        Start Learning
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="connections" className="space-y-6">
              {connectionRecommendations.map((connection) => (
                <Card key={connection.userId} className="bg-muted/40 border-border hover:border-primary/50 transition-all overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{connection.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-white">{connection.name}</h3>
                            <Badge variant="outline" className={getConfidenceBadgeColor(connection.successLikelihood)}>
                              {connection.successLikelihood} success
                            </Badge>
                          </div>
                          <p className="text-sm text-primary/70">{connection.role} at {connection.company}</p>
                          <p className="text-muted-foreground text-sm italic">"{connection.connectionRationale}"</p>
                        </div>
                      </div>
                      <div className="text-right w-full md:w-auto">
                        <div className={`text-3xl font-black ${getScoreColor(connection.connectionValue)}`}>
                          {connection.connectionValue}%
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase">Match</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4 bg-muted/40 rounded-xl p-4 border border-border/60">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Conversation Starters:</p>
                      <div className="space-y-2">
                        {connection.conversationStarters.map((starter: string, idx: number) => (
                          <div key={idx} className="bg-muted/40 p-2 rounded-lg text-xs text-muted-foreground border border-border/60">
                            "{starter}"
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <p className="text-xs text-muted-foreground max-w-[60%]">{connection.approachStrategy}</p>
                      <Button size="sm" className="bg-primary hover:bg-primary text-white">
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


