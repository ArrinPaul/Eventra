'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  TrendingUp, 
  Target,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '@/core/utils/utils';

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

export function AIInsightsWidget({ eventData, title = 'AI Insights' }: { eventData: EventData, title?: string }) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const generateInsights = (data: EventData): AIInsight[] => {
    const generated: AIInsight[] = [];
    if (data.totalRegistrations > data.previousPeriodRegistrations) {
      generated.push({ type: 'trend', title: 'Growing Fast', description: 'Your registrations are up!', priority: 'high' });
    }
    generated.push({ type: 'recommendation', title: 'Boost Engagement', description: 'Try adding more interactive sessions.', priority: 'medium' });
    return generated;
  };

  useEffect(() => {
    setInsights(generateInsights(eventData));
  }, [eventData]);

  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <div><h4 className="font-medium text-sm">{insight.title}</h4><p className="text-xs text-gray-400">{insight.description}</p></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default AIInsightsWidget;