'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Trophy, 
  MessageSquare, 
  UserPlus, 
  Ticket, 
  QrCode, 
  Loader2,
  Activity,
  User as UserIcon
} from 'lucide-react';
import Link from 'next/link';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  registration: { icon: Ticket, color: 'text-primary', bg: 'bg-primary/10' },
  badge_awarded: { icon: Trophy, color: 'text-warning', bg: 'bg-yellow-500/10' },
  post: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  event_created: { icon: Calendar, color: 'text-success', bg: 'bg-green-500/10' },
  event_checkin: { icon: QrCode, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  connection: { icon: UserPlus, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  community_joined: { icon: UserIcon, color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

interface ActivityFeedProps {
  initialActivities?: any[];
  userId?: string;
  global?: boolean;
}

export function ActivityFeed({ initialActivities = [], userId, global }: ActivityFeedProps) {
  if (initialActivities.length === 0) {
    return (
      <Card className="border-none shadow-2xl">
        <CardContent className="py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto shadow-inner">
             <Activity className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <div className="space-y-1">
             <p className="font-display font-bold text-xl">System Quiet.</p>
             <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Waiting for synchronization...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-2xl overflow-hidden">
      <CardHeader className="p-8 pb-4 border-b border-border/40 bg-muted/5">
        <CardTitle className="flex items-center gap-3 text-lg font-display font-bold tracking-tight">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
             <Activity className="h-4 w-4 text-primary" />
          </div>
          {global ? 'Mesh Activity' : 'Recent Syncs'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/40">
          {initialActivities.map((item: any) => {
            const activity = item.activity;
            const user = item.user;
            const config = typeConfig[activity.type] || typeConfig.registration;
            const Icon = config.icon;

            return (
              <div key={activity.id} className="flex items-start gap-5 p-8 hover:bg-muted/10 transition-colors group">
                <div className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${config.bg}`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      {global && user?.name && (
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-1 block">{user.name}</span>
                      )}
                      <p className="text-sm font-bold text-foreground leading-snug">
                          {activity.content}
                      </p>
                      {activity.metadata?.description && (
                        <p className="text-xs font-medium text-muted-foreground line-clamp-1 opacity-70 italic">{activity.metadata.description}</p>
                      )}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 shrink-0">
                      {timeAgo(new Date(activity.createdAt))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
