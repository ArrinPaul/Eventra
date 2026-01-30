'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Target,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

interface EventData {
  totalRegistrations: number;
  previousPeriodRegistrations: number;
  checkInRate: number;
  topCategory: string;
  peakRegistrationDay: string;
  averageAttendance: number;
  upcomingEvents: number;
  engagementScore: number;
}

interface AIInsight {
  type: 'trend' | 'recommendation' | 'alert' | 'achievement';
  title: string;
  description: string;
  metric?: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

interface AIInsightsWidgetProps {
  eventData: EventData;
  eventId?: string;
  title?: string;
  onActionClick?: (action: string) => void;
}

export function AIInsightsWidget({
  eventData,
  eventId,
  title = 'AI Insights',
  onActionClick,
}: AIInsightsWidgetProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Generate insights based on event data
  const generateInsights = (data: EventData): AIInsight[] => {
    const generatedInsights: AIInsight[] = [];

    // Calculate growth percentage
    const growthRate = data.previousPeriodRegistrations > 0
      ? ((data.totalRegistrations - data.previousPeriodRegistrations) / data.previousPeriodRegistrations) * 100
      : 0;

    // Trend insight
    if (growthRate > 20) {
      generatedInsights.push({
        type: 'trend',
        title: 'Registrations Surging! 🚀',
        description: `Your event is trending ${Math.round(growthRate)}% higher than the previous period. Keep the momentum going!`,
        metric: `+${Math.round(growthRate)}%`,
        priority: 'high',
      });
    } else if (growthRate > 0) {
      generatedInsights.push({
        type: 'trend',
        title: 'Steady Growth',
        description: `Registrations are up ${Math.round(growthRate)}% compared to last period. Consider boosting promotion.`,
        metric: `+${Math.round(growthRate)}%`,
        action: 'Boost Promotion',
        priority: 'medium',
      });
    } else if (growthRate < -10) {
      generatedInsights.push({
        type: 'alert',
        title: 'Registrations Declining',
        description: `Registrations are down ${Math.abs(Math.round(growthRate))}%. Consider running a promotional campaign or early bird discount.`,
        metric: `${Math.round(growthRate)}%`,
        action: 'Create Campaign',
        priority: 'high',
      });
    }

    // Check-in rate insight
    if (data.checkInRate >= 80) {
      generatedInsights.push({
        type: 'achievement',
        title: 'Excellent Attendance! 🎉',
        description: `${data.checkInRate}% check-in rate is outstanding. Your attendees are highly engaged.`,
        metric: `${data.checkInRate}%`,
        priority: 'low',
      });
    } else if (data.checkInRate < 50) {
      generatedInsights.push({
        type: 'recommendation',
        title: 'Improve Check-in Rate',
        description: `Only ${data.checkInRate}% checked in. Send reminder notifications before the event starts.`,
        metric: `${data.checkInRate}%`,
        action: 'Send Reminders',
        priority: 'high',
      });
    }

    // Category insight
    if (data.topCategory) {
      generatedInsights.push({
        type: 'recommendation',
        title: `${data.topCategory} is Trending`,
        description: `Your ${data.topCategory.toLowerCase()} events are performing best. Consider hosting more in this category.`,
        action: 'Create Similar Event',
        priority: 'medium',
      });
    }

    // Peak day insight
    if (data.peakRegistrationDay) {
      generatedInsights.push({
        type: 'recommendation',
        title: 'Optimal Posting Time',
        description: `${data.peakRegistrationDay} shows the highest registration activity. Schedule announcements for this day.`,
        priority: 'low',
      });
    }

    // Engagement insight
    if (data.engagementScore >= 75) {
      generatedInsights.push({
        type: 'achievement',
        title: 'High Engagement Score',
        description: `Your engagement score of ${data.engagementScore}/100 puts you in the top 20% of organizers!`,
        metric: `${data.engagementScore}/100`,
        priority: 'low',
      });
    } else if (data.engagementScore < 40) {
      generatedInsights.push({
        type: 'recommendation',
        title: 'Boost Engagement',
        description: 'Try adding interactive elements like Q&A sessions, polls, or networking breaks.',
        action: 'View Tips',
        priority: 'medium',
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return generatedInsights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  // Load cached insights from Firestore or generate new ones
  const loadOrGenerateInsights = useCallback(async () => {
    setLoading(true);
    try {
      // Check for cached insights if eventId is provided
      if (eventId) {
        const cachedDoc = await getDoc(doc(db, 'ai_insights_cache', eventId));
        if (cachedDoc.exists()) {
          const cached = cachedDoc.data();
          const cacheTime = cached.generatedAt instanceof Timestamp 
            ? cached.generatedAt.toDate() 
            : new Date(cached.generatedAt);
          
          // Use cache if it's less than 1 hour old
          if (Date.now() - cacheTime.getTime() < 3600000) {
            setInsights(cached.insights);
            setLoading(false);
            return;
          }
        }
      }
      
      // Generate new insights
      const newInsights = generateInsights(eventData);
      setInsights(newInsights);
      
      // Cache insights if eventId is provided
      if (eventId) {
        await setDoc(doc(db, 'ai_insights_cache', eventId), {
          insights: newInsights,
          eventData,
          generatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error loading insights:', error);
      // Fall back to local generation
      setInsights(generateInsights(eventData));
    } finally {
      setLoading(false);
    }
  }, [eventData, eventId]);

  useEffect(() => {
    loadOrGenerateInsights();
  }, [loadOrGenerateInsights]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const newInsights = generateInsights(eventData);
      setInsights(newInsights);
      
      // Update cache
      if (eventId) {
        await setDoc(doc(db, 'ai_insights_cache', eventId), {
          insights: newInsights,
          eventData,
          generatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error refreshing insights:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'trend':
        return TrendingUp;
      case 'recommendation':
        return Lightbulb;
      case 'alert':
        return Zap;
      case 'achievement':
        return Target;
      default:
        return Sparkles;
    }
  };

  const getInsightColor = (type: AIInsight['type'], priority: AIInsight['priority']) => {
    if (type === 'alert' || priority === 'high') return 'text-orange-500 bg-orange-500/10';
    if (type === 'achievement') return 'text-green-500 bg-green-500/10';
    if (type === 'trend') return 'text-blue-500 bg-blue-500/10';
    return 'text-purple-500 bg-purple-500/10';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <CardDescription>Analyzing your event data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>Powered by AI analysis</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 px-2"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No insights available yet. Add more event data to get personalized recommendations.</p>
          </div>
        ) : (
          insights.slice(0, 4).map((insight, index) => {
            const Icon = getInsightIcon(insight.type);
            const colorClass = getInsightColor(insight.type, insight.priority);
            
            return (
              <div
                key={index}
                className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className={cn('p-2 rounded-lg flex-shrink-0', colorClass.split(' ')[1])}>
                  <Icon className={cn('h-4 w-4', colorClass.split(' ')[0])} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{insight.title}</h4>
                    {insight.metric && (
                      <Badge variant="secondary" className="text-xs">
                        {insight.metric}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {insight.description}
                  </p>
                  {insight.action && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 mt-1 text-xs"
                      onClick={() => onActionClick?.(insight.action!)}
                    >
                      {insight.action}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default AIInsightsWidget;
