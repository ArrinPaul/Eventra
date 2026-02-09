'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Zap, 
  Sparkles, 
  Loader2, 
  RefreshCw,
  Search,
  UserPlus,
  MessageSquare,
  Trophy,
  Target,
  ArrowRight,
  Brain
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { getMatchmakingRecommendations, MatchmakingResult } from '@/app/actions/matchmaking';
import { MatchmakingCard } from '../networking/matchmaking-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/core/utils/utils';
import Link from 'next/link';

export default function MatchmakingView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<MatchmakingResult | null>(null);

  const sendConnectionRequest = useMutation(api.connections.sendRequest);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl text-white space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1 mb-2">
            <Brain className="w-3 h-3 mr-2" />
            Advanced AI Matchmaking
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight">Personalized Matchmaking</h1>
          <p className="text-gray-400 text-lg">Our AI analyzes your profile and goals to find your perfect professional matches.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10" onClick={fetchMatches} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Recalculate Matches
          </Button>
          <Link href="/networking">
            <Button className="bg-white/10 hover:bg-white/20 text-white">
              <Users className="w-4 h-4 mr-2" />
              View Connections
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 4, 5].map(i => (
                <Card key={i} className="bg-white/5 border-white/10 h-[320px] animate-pulse">
                  <CardContent className="h-full" />
                </Card>
              ))}
            </div>
          ) : result?.error ? (
            <div className="py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/5">
              <Target size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-xl font-medium text-white mb-2">{result.error}</p>
              <p>Try completing your profile bio and interests to help our AI understand you better.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result?.recommendations.map((match) => (
                <MatchmakingCard 
                  key={match.userId} 
                  match={match} 
                  onConnect={(id) => handleConnect(id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10 border-l-4 border-l-cyan-500 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                AI Networking Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
                  <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse" />
                  <div className="h-4 bg-white/10 rounded w-4/6 animate-pulse" />
                </div>
              ) : (
                <p className="text-sm text-gray-400 leading-relaxed italic">
                  {result?.strategy?.weeklyPlan || "Complete your profile to generate a personalized networking strategy."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Networking Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: "Personalize Invites", desc: "Always include a note about why you want to connect based on AI rationale." },
                { title: "Follow Up", desc: "Don't just connect. Send a message within 24 hours of acceptance." },
                { title: "Shared Interests", desc: "Mention specific interests the AI highlighted in the rationale." }
              ].map((tip, i) => (
                <div key={i} className="space-y-1">
                  <h4 className="text-sm font-medium text-white">{tip.title}</h4>
                  <p className="text-xs text-gray-500">{tip.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-cyan-600/20 border-cyan-500/30 overflow-hidden">
            <CardContent className="p-6 text-center space-y-4">
              <div className="bg-cyan-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Networking Challenge</h3>
                <p className="text-xs text-cyan-200/70 mt-1">Connect with 3 AI-recommended peers this week to earn 50 XP!</p>
              </div>
              <Link href="/gamification">
                <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white border-0">
                  View Challenges
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
