'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Target
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getMatchmakingRecommendations, MatchmakingResult } from '@/app/actions/matchmaking';
import { MatchmakingCard } from './matchmaking-card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function NetworkingClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<MatchmakingResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1">
            <Sparkles className="w-3 h-3 mr-2" />
            AI-Powered Matchmaking
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight">Networking Hub</h1>
          <p className="text-gray-400 text-lg">Connect with the right people to accelerate your growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search people..." 
              className="pl-9 bg-white/5 border-white/10 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-white/10" onClick={fetchMatches} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ai-matches" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 mb-8">
          <TabsTrigger value="ai-matches" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Matchmaking
          </TabsTrigger>
          <TabsTrigger value="discover" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Discover All
          </TabsTrigger>
          <TabsTrigger value="connections" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <MessageSquare className="w-4 h-4 mr-2" />
            My Connections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-matches" className="space-y-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="bg-white/5 border-white/10 h-[320px] animate-pulse">
                  <CardContent className="h-full" />
                </Card>
              ))}
            </div>
          ) : result?.error ? (
            <div className="py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/5">
              <Target size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-xl font-medium text-white mb-2">{result.error}</p>
              <p>Complete your profile to get personalized recommendations.</p>
            </div>
          ) : (
            <>
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
                    onConnect={(id) => toast({ title: "Request Sent", description: "Connection request has been sent successfully." })}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="discover">
           <div className="py-20 text-center text-gray-500 border border-white/10 rounded-lg">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p>Discover feature is coming soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="connections">
          <div className="py-20 text-center text-gray-500 border border-white/10 rounded-lg">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
            <p>Manage your professional connections here soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

