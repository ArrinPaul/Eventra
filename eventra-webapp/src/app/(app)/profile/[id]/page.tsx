'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BadgeShowcase } from '@/features/gamification/badge-showcase';
import { Loader2, Calendar, User, Mail, Shield, Zap, TrendingUp, Trophy } from 'lucide-react';
import { FollowButton } from '@/components/shared/follow-button';
import { getUserById } from '@/app/actions/users';
import { getUserStats } from '@/app/actions/gamification';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser } = useAuth();
  
  const [profileUser, setProfileUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      setLoading(true);
      try {
        const [userData, statData] = await Promise.all([
          getUserById(userId),
          getUserStats(userId)
        ]);
        setProfileUser(userData);
        setStats(statData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 uppercase italic tracking-tighter">SIGNAL LOST</h2>
          <p className="text-gray-400">This profile doesn't exist in our neural network.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && (currentUser.id === profileUser.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl text-white space-y-8 animate-in fade-in duration-700">
      {/* Profile Header */}
      <Card className="bg-[#050505] border-white/10 text-white overflow-hidden rounded-[2rem] shadow-2xl relative">
        <div className="h-48 bg-gradient-to-br from-cyan-900/40 via-purple-900/40 to-black relative">
           <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        </div>
        <CardContent className="p-8 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="relative group">
               <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full" />
               <Avatar className="h-32 w-32 border-4 border-[#050505] shadow-2xl relative z-10">
                <AvatarImage src={profileUser.image} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 text-4xl font-black">
                  {profileUser.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                 <h1 className="text-4xl font-black italic tracking-tighter">{profileUser.name || 'ANONYMOUS'}</h1>
                 {profileUser.role === 'admin' && <Shield size={20} className="text-cyan-400 fill-cyan-400/10" />}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                <span className="flex items-center gap-1.5"><Mail size={12} className="text-cyan-500" /> {profileUser.email}</span>
                <span className="flex items-center gap-1.5"><Calendar size={12} className="text-purple-500" /> Joined {new Date(profileUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            {!isOwnProfile && (
              <div className="pb-2">
                <FollowButton userId={profileUser.id} />
              </div>
            )}
          </div>

          {profileUser.bio && (
            <p className="mt-8 text-gray-400 text-sm leading-relaxed max-w-2xl border-l-2 border-cyan-500/20 pl-4 italic">
              {profileUser.bio}
            </p>
          )}

          {/* Gamification Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all group">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 group-hover:text-cyan-400">Current Level</p>
                <div className="flex items-baseline gap-2">
                   <p className="text-3xl font-black text-white">{stats.level}</p>
                   <p className="text-[10px] text-gray-500">Tier {Math.ceil(stats.level / 10)}</p>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                   <div className="h-full bg-cyan-500" style={{ width: `${(stats.xp % 100)}%` }} />
                </div>
              </div>
              
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 group-hover:text-purple-400">Total XP</p>
                <div className="flex items-center gap-2">
                   <TrendingUp size={16} className="text-purple-500" />
                   <p className="text-3xl font-black text-white">{stats.xp.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all group">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 group-hover:text-amber-400">Badges</p>
                <div className="flex items-center gap-2">
                   <Trophy size={16} className="text-amber-500" />
                   <p className="text-3xl font-black text-white">{stats.badgeCount}</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 group-hover:text-emerald-400">Events</p>
                <div className="flex items-center gap-2">
                   <Zap size={16} className="text-emerald-500" />
                   <p className="text-3xl font-black text-white">{stats.attended}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <BadgeShowcase userId={profileUser.id} />
         </div>
         
         <Card className="bg-white/5 border-white/10 text-white h-fit">
            <CardHeader>
               <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tighter">
                  <TrendingUp size={16} className="text-cyan-400" /> Community Activity
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Posts Shared</span>
                  <span className="font-bold">{stats?.posts || 0}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Helpful Votes</span>
                  <span className="font-bold">124</span>
               </div>
               <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500">Platform Points</span>
                  <span className="font-black text-cyan-400">{stats?.points?.toLocaleString() || 0}</span>
               </div>
               <Button variant="outline" className="w-full border-white/10 text-xs font-bold uppercase tracking-widest h-10 hover:bg-white/5" asChild>
                  <a href="/leaderboard">View Leaderboard</a>
               </Button>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
