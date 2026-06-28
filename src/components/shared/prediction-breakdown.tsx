'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Wifi, Brain, TrendingUp } from 'lucide-react';
import { HybridPredictionResult } from '@/lib/hybrid-prediction';

interface PredictionBreakdownProps {
  result: HybridPredictionResult;
  className?: string;
}

export function PredictionBreakdown({ result, className }: PredictionBreakdownProps) {
  const methodLabels = {
    'gps-only': { label: 'GPS Only', color: 'bg-blue-500/10 text-blue-500' },
    'ai-only': { label: 'AI Only', color: 'bg-purple-500/10 text-purple-500' },
    'hybrid': { label: 'Hybrid', color: 'bg-emerald-500/10 text-emerald-500' },
  };

  const methodConfig = methodLabels[result.method];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Prediction Breakdown
          </CardTitle>
          <Badge variant="outline" className={methodConfig.color}>{methodConfig.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.finalLocation && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">{result.finalLocation.name}</p>
              <p className="text-xs text-muted-foreground">{result.finalLocation.description}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {Math.round(result.finalConfidence * 100)}%
            </Badge>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-blue-500">
                <Wifi className="h-3 w-3" /> GPS Contribution
              </span>
              <span className="font-medium">{result.gpsContribution}%</span>
            </div>
            <Progress value={result.gpsContribution} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-purple-500">
                <Brain className="h-3 w-3" /> AI Contribution
              </span>
              <span className="font-medium">{result.aiContribution}%</span>
            </div>
            <Progress value={result.aiContribution} className="h-2" />
          </div>
        </div>

        {result.suggestions.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Top Suggestions</p>
            {result.suggestions.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">#{i + 1}</span>
                <span className="flex-1">{s.location.name}</span>
                <Badge variant="outline" className="text-[9px]">
                  {s.source === 'both' ? 'GPS + AI' : s.source === 'gps' ? 'GPS' : 'AI'}
                </Badge>
                <span className="font-medium">{Math.round(s.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
