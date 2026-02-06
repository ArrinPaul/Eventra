'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Zap, Target } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function GamificationClient() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-6 text-white space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gamification Hub</h1>
        <p className="text-gray-400 mt-2">Track your progress and earn rewards</p>
      </div>

      <Card className="bg-white/5 border-white/10 text-white">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="p-4 bg-yellow-500/10 rounded-full"><Trophy className="text-yellow-500" size={32} /></div>
          <div><p className="text-sm text-gray-400">Total Points</p><p className="text-4xl font-bold text-cyan-400">{user?.points || 0} XP</p></div>
        </CardContent>
      </Card>

      <div className="py-20 text-center text-gray-500 border border-white/10 rounded-lg">
        <Star size={48} className="mx-auto mb-4 opacity-20" />
        <p>Achievements and Challenges are being migrated. Earn more points soon!</p>
      </div>
    </div>
  );
}
