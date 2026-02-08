'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BadgeShowcase } from '@/components/gamification/badge-showcase';
import { Loader2, Mail, MapPin, Briefcase, GraduationCap, Calendar } from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser } = useAuth();

  const profileUser = useQuery(api.users.getById, userId ? { id: userId as any } : 'skip');
  const stats = useQuery(api.gamification.getProfile, profileUser ? { userId: profileUser._id } : 'skip');

  if (profileUser === undefined) {
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
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-gray-400">This profile doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && (currentUser._id === profileUser._id || currentUser.id === profileUser._id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl text-white space-y-6">
      {/* Profile Header */}
      <Card className="bg-white/5 border-white/10 text-white overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-cyan-900/50 to-purple-900/50" />
        <CardContent className="p-6 -mt-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-[#0a0b14] shadow-lg">
              <AvatarImage src={profileUser.image} />
              <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-2xl font-bold">
                {profileUser.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profileUser.name || 'Anonymous'}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-400">
                {profileUser.role && (
                  <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 capitalize">
                    {profileUser.role}
                  </Badge>
                )}
                {(profileUser as any).company && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {(profileUser as any).company}
                  </span>
                )}
                {(profileUser as any).college && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {(profileUser as any).college}
                  </span>
                )}
                {(profileUser as any).country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {(profileUser as any).country}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(profileUser as any).bio && (
            <p className="mt-4 text-gray-300 text-sm leading-relaxed">{(profileUser as any).bio}</p>
          )}

          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-2xl font-bold text-cyan-400">{stats.level || 1}</p>
                <p className="text-xs text-gray-500">Level</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-2xl font-bold text-purple-400">{stats.xp || 0}</p>
                <p className="text-xs text-gray-500">XP</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-2xl font-bold text-amber-400">{stats.badgeCount || 0}</p>
                <p className="text-xs text-gray-500">Badges</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badges */}
      <BadgeShowcase userId={profileUser._id} />

      {/* Member since */}
      <Card className="bg-white/5 border-white/10 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>Member since {new Date(profileUser._creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
