'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp, Users, Target, Calendar, BookOpen, Network } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { generateEventRecommendations, generateContentRecommendations, generateConnectionRecommendations } from '@/ai/flows/recommendation-engine';

interface RecommendationDashboardProps {
  className?: string;
}

interface EventRecommendation {
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

interface ContentRecommendation {
  contentId: string;
  title: string;
  type: 'article' | 'video' | 'course' | 'podcast' | 'tutorial' | 'case-study';
  relevanceScore: number;
  learningObjectives: string[];
  personalizedRationale: string;
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  author: string;
}

interface ConnectionRecommendation {
  userId: string;
  name: string;
  role: string;
  company: string;
  connectionValue: number;
  connectionRationale: string;
  mutualBenefit: {
    userGains: string[];
    contactGains: string[];
  };
  approachStrategy: string;
  conversationStarters: string[];
  successLikelihood: 'high' | 'medium' | 'low';
}

interface InsightCard {
  title: string;
  value: string | number;
  description: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

export default function AiRecommendationDashboard({ className }: RecommendationDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(false);
  const [eventRecommendations, setEventRecommendations] = useState<EventRecommendation[]>([]);
  const [contentRecommendations, setContentRecommendations] = useState<ContentRecommendation[]>([]);
  const [connectionRecommendations, setConnectionRecommendations] = useState<ConnectionRecommendation[]>([]);
  const [insights, setInsights] = useState<InsightCard[]>([]);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // This would typically fetch from your backend APIs
      // For now, we'll simulate the data structure
      
      // Simulate insights
      setInsights([
        {
          title: 'Skill Growth',
          value: '23%',
          description: 'Increase this month',
          trend: 'up',
          icon: <TrendingUp className="w-4 h-4" />
        },
        {
          title: 'Network Size',
          value: '127',
          description: 'Active connections',
          trend: 'up',
          icon: <Users className="w-4 h-4" />
        },
        {
          title: 'Learning Hours',
          value: '15.5h',
          description: 'This week',
          trend: 'stable',
          icon: <BookOpen className="w-4 h-4" />
        },
        {
          title: 'Goal Progress',
          value: '68%',
          description: 'Quarterly goals',
          trend: 'up',
          icon: <Target className="w-4 h-4" />
        }
      ]);

      // Simulate event recommendations
      setEventRecommendations([
        {
          eventId: '1',
          title: 'Advanced React Patterns Workshop',
          type: 'workshop',
          relevanceScore: 95,
          recommendationReason: 'Matches your React expertise and learning goals',
          personalizedPitch: 'Perfect for advancing your frontend architecture skills',
          expectedValue: ['Advanced patterns', 'Performance optimization', 'Code quality'],
          networkingOpportunities: ['Senior developers', 'React core team members'],
          preparationSuggestions: ['Review current React patterns', 'Prepare specific questions'],
          confidenceLevel: 'high',
          startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          duration: 180
        },
        {
          eventId: '2',
          title: 'AI in Product Development Panel',
          type: 'panel',
          relevanceScore: 88,
          recommendationReason: 'Aligns with your interest in AI integration',
          personalizedPitch: 'Learn how to integrate AI into your product development workflow',
          expectedValue: ['AI strategy', 'Implementation insights', 'Future trends'],
          networkingOpportunities: ['Product managers', 'AI researchers', 'Tech leaders'],
          preparationSuggestions: ['Research AI tools', 'Prepare use case questions'],
          confidenceLevel: 'high',
          startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          duration: 90
        }
      ]);

      // Simulate content recommendations
      setContentRecommendations([
        {
          contentId: '1',
          title: 'Advanced TypeScript Techniques',
          type: 'course',
          relevanceScore: 92,
          learningObjectives: ['Advanced type patterns', 'Performance optimization'],
          personalizedRationale: 'Build on your current TypeScript knowledge',
          estimatedTime: 240,
          difficulty: 'advanced',
          author: 'TypeScript Expert'
        },
        {
          contentId: '2',
          title: 'System Design Interview Preparation',
          type: 'video',
          relevanceScore: 85,
          learningObjectives: ['Scalability patterns', 'System architecture'],
          personalizedRationale: 'Prepare for senior-level technical interviews',
          estimatedTime: 120,
          difficulty: 'advanced',
          author: 'System Design Pro'
        }
      ]);

      // Simulate connection recommendations
      setConnectionRecommendations([
        {
          userId: '1',
          name: 'Sarah Chen',
          role: 'Senior Product Manager',
          company: 'TechCorp',
          connectionValue: 94,
          connectionRationale: 'Strong alignment in product strategy and AI integration',
          mutualBenefit: {
            userGains: ['Product strategy insights', 'AI implementation guidance'],
            contactGains: ['Technical expertise', 'Development perspectives']
          },
          approachStrategy: 'Mention shared interest in AI-driven product development',
          conversationStarters: [
            'I noticed your work on AI product integration',
            'Would love to learn about your approach to product-tech collaboration',
            'Interested in discussing AI strategy in product development'
          ],
          successLikelihood: 'high'
        },
        {
          userId: '2',
          name: 'Michael Rodriguez',
          role: 'Tech Lead',
          company: 'Innovation Labs',
          connectionValue: 87,
          connectionRationale: 'Complementary technical skills and leadership experience',
          mutualBenefit: {
            userGains: ['Technical leadership insights', 'Architecture guidance'],
            contactGains: ['Fresh perspectives', 'Collaboration opportunities']
          },
          approachStrategy: 'Connect over shared technical challenges and solutions',
          conversationStarters: [
            'I see we both work on complex technical architectures',
            'Would be great to exchange insights on tech leadership',
            'Interested in discussing scaling challenges'
          ],
          successLikelihood: 'high'
        }
      ]);

    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConfidenceBadgeColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Sparkles className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Generating personalized recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI Insights Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{insight.title}</p>
                  <p className="text-2xl font-bold">{insight.value}</p>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </div>
                <div className="flex-shrink-0">
                  {insight.icon}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-blue-500 to-purple-500" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI-Powered Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <CardTitle>AI-Powered Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Learning
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center gap-2">
                <Network className="w-4 h-4" />
                Connections
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-6">
              <div className="space-y-4">
                {eventRecommendations.map((event) => (
                  <Card key={event.eventId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <Badge variant="outline">{event.type}</Badge>
                            <Badge className={getConfidenceBadgeColor(event.confidenceLevel)}>
                              {event.confidenceLevel} confidence
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">{event.personalizedPitch}</p>
                          <p className="text-sm text-gray-600 mb-3">{event.recommendationReason}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(event.relevanceScore)}`}>
                            {event.relevanceScore}%
                          </div>
                          <p className="text-xs text-muted-foreground">Relevance</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium mb-2">What You'll Gain:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {event.expectedValue.map((value, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                                {value}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Networking Opportunities:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {event.networkingOpportunities.map((opportunity, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-green-500 rounded-full" />
                                {opportunity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Preparation Suggestions:</p>
                        <div className="flex flex-wrap gap-2">
                          {event.preparationSuggestions.map((suggestion, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {suggestion}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{event.startTime.toLocaleDateString()}</span>
                          <span>{event.duration} minutes</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Learn More
                          </Button>
                          <Button size="sm">
                            Register
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="content" className="mt-6">
              <div className="space-y-4">
                {contentRecommendations.map((content) => (
                  <Card key={content.contentId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{content.title}</h3>
                            <Badge variant="outline">{content.type}</Badge>
                            <Badge variant="secondary">{content.difficulty}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">By {content.author}</p>
                          <p className="text-muted-foreground mb-3">{content.personalizedRationale}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(content.relevanceScore)}`}>
                            {content.relevanceScore}%
                          </div>
                          <p className="text-xs text-muted-foreground">Relevance</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Learning Objectives:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {content.learningObjectives.map((objective, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-blue-500 rounded-full" />
                              {objective}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{content.estimatedTime} minutes</span>
                          <Progress value={0} className="w-20 h-2" />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Preview
                          </Button>
                          <Button size="sm">
                            Start Learning
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="connections" className="mt-6">
              <div className="space-y-4">
                {connectionRecommendations.map((connection) => (
                  <Card key={connection.userId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar>
                            <AvatarImage src={`/api/placeholder/40/40`} />
                            <AvatarFallback>{connection.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{connection.name}</h3>
                              <Badge className={getConfidenceBadgeColor(connection.successLikelihood)}>
                                {connection.successLikelihood} success
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {connection.role} at {connection.company}
                            </p>
                            <p className="text-muted-foreground mb-3">{connection.connectionRationale}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(connection.connectionValue)}`}>
                            {connection.connectionValue}%
                          </div>
                          <p className="text-xs text-muted-foreground">Match</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium mb-2">You Gain:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {connection.mutualBenefit.userGains.map((gain, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-green-500 rounded-full" />
                                {gain}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">They Gain:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {connection.mutualBenefit.contactGains.map((gain, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                                {gain}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Conversation Starters:</p>
                        <div className="space-y-2">
                          {connection.conversationStarters.map((starter, idx) => (
                            <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                              "{starter}"
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          <p>{connection.approachStrategy}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                          <Button size="sm">
                            Connect
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}