'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Award, 
  Star,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/core/utils/utils';

interface EngagementMetricsProps {
  userId: Id<"users">;
}

export function EngagementMetrics({ userId }: EngagementMetricsProps) {
  const data = useQuery(api.users.getEngagementScore, { userId });

  if (data === undefined) return <div className="h-40 animate-pulse bg-white/5 rounded-2xl" />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#0f172a] to-black border-white/10 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Activity size={120} />
        </div>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <CardTitle>Engagement Score</CardTitle>
          </div>
          <CardDescription className="text-gray-500">Based on your platform participation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          <div className="flex items-end gap-4">
            <p className="text-6xl font-black tracking-tighter text-cyan-400">{data.score}</p>
            <div className="pb-2">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Top {100 - data.percentile}%</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs uppercase font-bold tracking-widest text-gray-500">
              <span>Community Rank</span>
              <span className="text-white">Professional</span>
            </div>
            <Progress value={data.percentile} className="h-2 bg-white/5" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-500"><Users size={12} /> <span className="text-[10px] uppercase font-bold">Events</span></div>
              <p className="text-lg font-bold">{data.stats.eventCount}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-500"><MessageSquare size={12} /> <span className="text-[10px] uppercase font-bold">Chats</span></div>
              <p className="text-lg font-bold">{data.stats.messageCount}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-500"><Star size={12} /> <span className="text-[10px] uppercase font-bold">Reviews</span></div>
              <p className="text-lg font-bold">{data.stats.reviewCount}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-500"><Award size={12} /> <span className="text-[10px] uppercase font-bold">Badges</span></div>
              <p className="text-lg font-bold">{data.stats.badgeCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider", className)}>
      {children}
    </span>
  );
}
