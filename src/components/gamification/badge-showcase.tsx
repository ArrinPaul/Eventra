'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Star, Shield, Zap } from 'lucide-react';
import { cn } from '@/core/utils/utils';

const rarityColors: Record<string, string> = {
  common: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  uncommon: 'bg-green-500/20 text-green-400 border-green-500/30',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const rarityIcons: Record<string, React.ReactNode> = {
  common: <Shield className="h-4 w-4" />,
  uncommon: <Star className="h-4 w-4" />,
  rare: <Award className="h-4 w-4" />,
  epic: <Zap className="h-4 w-4" />,
  legendary: <Trophy className="h-4 w-4" />,
};

export function BadgeShowcase({ userId, compact }: { userId: string; stats?: any; compact?: boolean }) {
  const badges = useQuery(api.gamification.getUserBadges, { userId: userId as any }) || [];

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {badges.length === 0 && <p className="text-sm text-gray-500">No badges yet</p>}
        {badges.map((b: any) => (
          <div key={b.badgeId} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium', rarityColors[b.rarity] || rarityColors.common)} title={b.description}>
            {rarityIcons[b.rarity] || rarityIcons.common}
            {b.name}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Badge Collection
          {badges.length > 0 && (
            <Badge variant="secondary" className="ml-auto bg-white/10 text-gray-300">{badges.length} earned</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No badges earned yet</p>
            <p className="text-sm mt-1">Attend events and participate to earn badges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((b: any) => (
              <div key={b.badgeId} className={cn('flex items-start gap-3 p-3 rounded-xl border', rarityColors[b.rarity] || rarityColors.common)}>
                <div className="text-2xl shrink-0">{b.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{b.name}</p>
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border-0 shrink-0', rarityColors[b.rarity] || rarityColors.common)}>
                      {b.rarity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{b.description}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                    <span>+{b.xpReward} XP</span>
                    <span>&middot;</span>
                    <span>{new Date(b.awardedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}