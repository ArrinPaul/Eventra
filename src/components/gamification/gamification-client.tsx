'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Zap, Target, History, Award, Loader2, ListChecks } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/core/utils/utils';
import { ChallengesHub } from './challenges-hub';

export function GamificationClient() {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  
  const badgeDefinitions = useQuery(api.gamification.getBadgeDefinitions) || [];
  const userBadges = useQuery(api.gamification.getUserBadges, userId ? { userId: userId as any } : "skip") || [];
  const pointsHistory = useQuery(api.gamification.getPointsHistory) || [];
  
  const [activeTab, setActiveTab] = useState('overview');

  const earnedBadgeIds = new Set(userBadges.map((ub: any) => ub._id));

  return (
    <div className="container mx-auto px-4 py-6 text-white space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Gamification Hub
          </h1>
          <p className="text-gray-400 mt-2">Track your progress and earn rewards</p>
        </div>
        <div className="flex gap-4">
          <Card className="bg-white/5 border-white/10 text-white min-w-[150px]">
            <CardContent className="p-4 flex items-center gap-3">
              <Zap className="text-cyan-400" size={24} />
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Current XP</p>
                <p className="text-xl font-bold">{user?.xp || user?.points || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border-white/10 text-white">
          <TabsTrigger value="overview" className="gap-2"><Target size={16} /> Overview</TabsTrigger>
          <TabsTrigger value="challenges" className="gap-2"><ListChecks size={16} /> Challenges</TabsTrigger>
          <TabsTrigger value="badges" className="gap-2"><Award size={16} /> Badges</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><History size={16} /> History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/5 border-white/10 text-white md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">Your latest achievements and points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pointsHistory.slice(0, 5).map((entry: any) => (
                    <div key={entry._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-full"><Zap size={16} className="text-cyan-400" /></div>
                        <div>
                          <p className="text-sm font-medium">{entry.reason}</p>
                          <p className="text-[10px] text-gray-500">{formatDistanceToNow(entry.createdAt, { addSuffix: true })}</p>
                        </div>
                      </div>
                      <p className="text-cyan-400 font-bold">+{entry.points}</p>
                    </div>
                  ))}
                  {pointsHistory.length === 0 && <p className="text-center py-10 text-gray-500 italic">No activity yet. Start attending events to earn points!</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <CardTitle>Level Progress</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-6">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                  <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin-slow" />
                  <div className="text-center">
                    <p className="text-4xl font-bold">{user?.level || 1}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Level</p>
                  </div>
                </div>
                <p className="mt-6 text-sm text-gray-400">Next level at {((user?.level || 1) * 1000)} XP</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="challenges">
          <ChallengesHub />
        </TabsContent>

        <TabsContent value="badges">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {badgeDefinitions.map((badge: any) => {
              const isEarned = userBadges.some((ub: any) => ub._id === badge._id);
              return (
                <Card key={badge._id} className={cn("bg-white/5 border-white/10 text-white transition-all hover:scale-105", !isEarned && "opacity-40 grayscale")}>
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className="text-4xl">{badge.icon}</div>
                    <div>
                      <p className="text-sm font-bold">{badge.name}</p>
                      <p className="text-[10px] text-gray-400 line-clamp-2">{badge.description}</p>
                    </div>
                    {isEarned && <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20 text-[8px] uppercase">Earned</Badge>}
                  </CardContent>
                </Card>
              );
            })}
            {badgeDefinitions.length === 0 && <div className="col-span-full py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-lg">No badges defined yet.</div>}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardContent className="p-0">
              <div className="divide-y divide-white/10">
                {pointsHistory.map((entry: any) => (
                  <div key={entry._id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{entry.reason}</p>
                      <p className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="text-lg font-bold text-cyan-400">+{entry.points} XP</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}