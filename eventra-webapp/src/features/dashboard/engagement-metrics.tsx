'use client';
import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  MessageSquare, 
  Award, 
  Star,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { Badge } from '@/components/ui/badge';

interface EngagementMetricsProps {
  userId: string;
}

export function EngagementMetrics({ userId }: EngagementMetricsProps) {
  const data = {
    score: 84,
    percentile: 92,
    stats: {
      eventCount: 12,
      messageCount: 156,
      reviewCount: 8,
      badgeCount: 5,
    },
  };

  return (
    <div className="space-y-6">
      <Card className="bg-notion-surface border-notion-hairline overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Activity size={120} className="text-notion-ink" />
        </div>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-notion-accent-sky/10 text-notion-accent-sky">
              <Zap className="w-4 h-4" />
            </div>
            <CardTitle className="text-h3">Engagement Score</CardTitle>
          </div>
          <CardDescription className="text-body-sm text-notion-ink-muted">Based on your platform participation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 relative z-10">
          <div className="flex items-end gap-3">
            <p className="text-display-2 font-bold leading-none text-notion-primary">{data.score}</p>
            <div className="pb-1.5">
              <Badge variant="sticker">Top {100 - data.percentile}%</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-eyebrow uppercase text-notion-ink-muted">
              <span>Community Rank</span>
              <span className="text-notion-ink font-bold">Professional Node</span>
            </div>
            <Progress value={data.percentile} className="h-2 bg-notion-canvas-soft" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
            {[
              { label: 'Events', value: data.stats.eventCount, icon: Users, color: 'text-notion-accent-purple' },
              { label: 'Chats', value: data.stats.messageCount, icon: MessageSquare, color: 'text-notion-accent-teal' },
              { label: 'Reviews', value: data.stats.reviewCount, icon: Star, color: 'text-notion-accent-orange' },
              { label: 'Badges', value: data.stats.badgeCount, icon: Award, color: 'text-notion-accent-pink' },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2 text-notion-ink-faint">
                  <stat.icon size={14} className={stat.color} /> 
                  <span className="text-eyebrow uppercase font-bold">{stat.label}</span>
                </div>
                <p className="text-title font-bold text-notion-ink">{stat.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
