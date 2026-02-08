'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Check,
  X,
  UserMinus
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { getMatchmakingRecommendations, MatchmakingResult } from '@/app/actions/matchmaking';
import { MatchmakingCard } from './matchmaking-card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/core/utils/utils';

export default function NetworkingClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<MatchmakingResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const connections = useQuery(api.connections.getMyConnections) || [];
  const sendConnectionRequest = useMutation(api.connections.sendRequest);
  const respondToRequest = useMutation(api.connections.respondToRequest);
  const removeConnection = useMutation(api.connections.removeConnection);

  const acceptedConnections = connections.filter((c: any) => c.status === 'accepted');
  const pendingReceived = connections.filter((c: any) => c.status === 'pending' && c.direction === 'received');
  const pendingSent = connections.filter((c: any) => c.status === 'pending' && c.direction === 'sent');

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
                    onConnect={(id) => handleConnect(id)}
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

        <TabsContent value="connections" className="space-y-6">
          {pendingReceived.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Pending Requests</h3>
              {pendingReceived.map((c: any) => (
                <Card key={c._id} className="bg-white/5 border-white/10">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={c.otherUser?.image} />
                        <AvatarFallback className="bg-cyan-500/10 text-cyan-500">{c.otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{c.otherUser?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{c.otherUser?.role || 'Member'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500" onClick={async () => { await respondToRequest({ connectionId: c._id, accept: true }); toast({ title: 'Accepted!' }); }}>
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="border-white/10 text-red-400 hover:bg-red-500/10" onClick={async () => { await respondToRequest({ connectionId: c._id, accept: false }); toast({ title: 'Declined' }); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {acceptedConnections.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">My Connections ({acceptedConnections.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {acceptedConnections.map((c: any) => (
                  <Card key={c._id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={c.otherUser?.image} />
                          <AvatarFallback className="bg-cyan-500/10 text-cyan-500">{c.otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{c.otherUser?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{c.otherUser?.role || 'Member'}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={async () => { await removeConnection({ connectionId: c._id }); toast({ title: 'Connection removed' }); }}>
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : pendingReceived.length === 0 ? (
            <div className="py-20 text-center text-gray-500 border border-white/10 rounded-lg">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium text-white mb-1">No connections yet</p>
              <p className="text-sm">Use AI Matchmaking to find people and connect!</p>
            </div>
          ) : null}

          {pendingSent.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-400">Sent Requests ({pendingSent.length})</h3>
              {pendingSent.map((c: any) => (
                <Card key={c._id} className="bg-white/5 border-white/10">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={c.otherUser?.image} />
                        <AvatarFallback className="bg-cyan-500/10 text-cyan-500">{c.otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{c.otherUser?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">Pending...</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:bg-white/5" onClick={async () => { await removeConnection({ connectionId: c._id }); toast({ title: 'Request cancelled' }); }}>
                      Cancel
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

