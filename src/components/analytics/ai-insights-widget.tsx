'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  TrendingUp, 
  Lightbulb,
  RefreshCw,
  Zap,
  Brain
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { getAIAnalyticsInsights } from '@/app/actions/analytics';

interface AIInsightsWidgetProps {
  sessionPopularityData?: string; // e.g. "Workshop A: 50, Talk B: 30"
  title?: string;
  className?: string;
}

export function AIInsightsWidget({ 
  sessionPopularityData, 
  title = 'AI Insights',
  className
}: AIInsightsWidgetProps) {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (!sessionPopularityData) return;
    setLoading(true);
    try {
      const result = await getAIAnalyticsInsights(sessionPopularityData);
      setInsight(result);
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
      setInsight('Unable to generate insights at this time.');
    } finally {
      setLoading(false);
    }
  }, [sessionPopularityData]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <Card className={cn("bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border-cyan-500/30 overflow-hidden", className)}>
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500/20 p-2 rounded-lg">
              <Brain className="h-4 w-4 text-cyan-400" />
            </div>
            <CardTitle className="text-lg font-bold text-white">{title}</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchInsights} 
            disabled={loading || !sessionPopularityData}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
            <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="mt-1">
                <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
              </div>
              <p className="text-gray-200 text-sm leading-relaxed italic">
                {insight || "No data available yet to generate insights."}
              </p>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400 bg-cyan-500/5">
                <Zap className="w-3 h-3 mr-1" />
                Live Analysis
              </Badge>
              <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400 bg-purple-500/5">
                <TrendingUp className="w-3 h-3 mr-1" />
                Audience Trends
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AIInsightsWidget;
