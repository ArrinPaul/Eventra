'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Sparkles, Target, Trophy, RefreshCw } from 'lucide-react';
// import { useAuth } from '@/hooks/use-auth';
// import { useToast } from '@/hooks/use-toast';
import { getMatchmakingRecommendations, MatchmakingResult } from '@/app/actions/matchmaking';
import { MatchmakingCard } from './matchmaking-card';
import { cn } from '@/core/utils/utils';

export function MatchmakingSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<MatchmakingResult | null>(null);
// 

  const handleConnect = async (userId: string) => {
    try {
      await sendConnectionRequest({ receiverId: userId as any });
      toast({ title: "Request Sent", description: "Connection request has been sent." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to send request", variant: "destructive" });
    }
  };

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getMatchmakingRecommendations(user._id || user.id);
      setResult(data);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      toast({ title: 'Error', description: 'Failed to load matchmaking recommendations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-white/5 border-white/10 h-[320px] animate-pulse">
            <CardContent className="h-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (result?.error) {
    return (
      <div className="py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/5">
        <Target size={48} className="mx-auto mb-4 opacity-20" />
        <p className="text-xl font-medium text-white mb-2">{result.error}</p>
        <p>Complete your profile to get personalized recommendations.</p>
        <Button variant="outline" className="mt-4 border-white/10" onClick={fetchMatches}>
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {result?.strategy && (
        <Card className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border-cyan-500/30 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-cyan-500/20 p-3 rounded-2xl">
                <Trophy className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Your Networking Strategy</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{result.strategy.weeklyPlan}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {result?.recommendations.map((match) => (
          <MatchmakingCard 
            key={match.userId} 
            match={match} 
            onConnect={(id) => handleConnect(id)}
          />
        ))}
      </div>
      
      <div className="flex justify-center">
        <Button variant="ghost" className="text-gray-500 hover:text-cyan-400" onClick={fetchMatches}>
          <RefreshCw className="w-4 h-4 mr-2" /> Recalculate Matches
        </Button>
      </div>
    </div>
  );
}


