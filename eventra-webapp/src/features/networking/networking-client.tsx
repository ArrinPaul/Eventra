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
import { getMatchmakingRecommendations, MatchmakingResult } from '@/app/actions/matchmaking';
import { MatchmakingCard } from './matchmaking-card';
import { MatchmakingSection } from './matchmaking-section';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/core/utils/utils';

export default function NetworkingClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // TODO: wire to backend queries/mutations
  const connections: any[] = [];
  const publicUsers: any[] = [];
  const sendConnectionRequest = async (_args: any) => Promise.resolve();
  const respondToRequest = async (_args: any) => Promise.resolve();
  const removeConnection = async (_args: any) => Promise.resolve();

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl text-white space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
            <Sparkles className="w-3 h-3 mr-2" />
            AI-Powered Matchmaking
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight">Networking Hub</h1>
          <p className="text-muted-foreground text-lg">Connect with the right people to accelerate your growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search people..." 
              className="pl-9 bg-muted/40 border-border text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="ai-matches" className="w-full">
        <TabsList className="bg-muted/40 border border-border p-1 mb-8">
          <TabsTrigger value="ai-matches" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Matchmaking
          </TabsTrigger>
          <TabsTrigger value="discover" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Discover All
          </TabsTrigger>
          <TabsTrigger value="connections" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <MessageSquare className="w-4 h-4 mr-2" />
            My Connections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-matches" className="space-y-8">
          <MatchmakingSection />
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicUsers
              .filter(u => u._id !== user?._id && 
                (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 u.interests?.toLowerCase().includes(searchTerm.toLowerCase())))
              .map((u: any) => (
                <Card key={u._id} className="bg-muted/40 border-border hover:border-primary/30 transition-all group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarImage src={u.image} />
                        <AvatarFallback className="bg-primary/10 text-primary">{u.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">{u.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{u.role || 'Member'}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8 italic">
                      {u.bio || u.interests || 'No bio provided yet.'}
                    </p>
                    <Button 
                      className="w-full bg-muted/40 hover:bg-primary hover:text-white border-border text-muted-foreground" 
                      onClick={() => handleConnect(u._id)}
                      disabled={connections.some((c: any) => c.otherUser?.id === u._id)}
                    >
                      {connections.some((c: any) => c.otherUser?.id === u._id) ? (
                        <><Check className="w-4 h-4 mr-2" /> Connected</>
                      ) : (
                        <><UserPlus className="w-4 h-4 mr-2" /> Connect</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
          {publicUsers.length === 0 && (
            <div className="py-20 text-center text-muted-foreground border border-border rounded-lg">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p>No other members found to connect with yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          {pendingReceived.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Pending Requests</h3>
              {pendingReceived.map((c: any) => (
                <Card key={c._id} className="bg-muted/40 border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={c.otherUser?.image} />
                        <AvatarFallback className="bg-primary/10 text-primary">{c.otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{c.otherUser?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{c.otherUser?.role || 'Member'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-primary hover:bg-primary" onClick={async () => { await respondToRequest({ connectionId: c._id, accept: true }); toast({ title: 'Accepted!' }); }}>
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="border-border text-red-400 hover:bg-red-500/10" onClick={async () => { await respondToRequest({ connectionId: c._id, accept: false }); toast({ title: 'Declined' }); }}>
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
                  <Card key={c._id} className="bg-muted/40 border-border">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={c.otherUser?.image} />
                          <AvatarFallback className="bg-primary/10 text-primary">{c.otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{c.otherUser?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{c.otherUser?.role || 'Member'}</p>
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
            <div className="py-20 text-center text-muted-foreground border border-border rounded-lg">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium text-white mb-1">No connections yet</p>
              <p className="text-sm">Use AI Matchmaking to find people and connect!</p>
            </div>
          ) : null}

          {pendingSent.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-muted-foreground">Sent Requests ({pendingSent.length})</h3>
              {pendingSent.map((c: any) => (
                <Card key={c._id} className="bg-muted/40 border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={c.otherUser?.image} />
                        <AvatarFallback className="bg-primary/10 text-primary">{c.otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{c.otherUser?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">Pending...</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:bg-muted/40" onClick={async () => { await removeConnection({ connectionId: c._id }); toast({ title: 'Request cancelled' }); }}>
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



