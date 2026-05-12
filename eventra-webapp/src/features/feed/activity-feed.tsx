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
      <Card className="bg-card border-border text-foreground">
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 mx-auto mb-3 text-gray-600" />
          <p className="text-muted-foreground">No activity yet</p>
          <p className="text-sm text-gray-600 mt-1">Activities will appear here as you use the platform</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border text-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-headline">
          <Activity className="h-5 w-5 text-primary" />
          {global ? 'Global Activity' : 'Recent Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {initialActivities.map((item: any) => {
          const activity = item.activity;
          const user = item.user;
          const config = typeConfig[activity.type] || typeConfig.registration;
          const Icon = config.icon;

          return (
            <div key={activity.id} className="flex items-start gap-3 py-4 border-b border-border/50 last:border-0">
              <div className={`p-2 rounded-lg shrink-0 ${config.bg}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {global && user?.name && (
                      <span className="text-xs text-muted-foreground block mb-1">{user.name}</span>
                    )}
                    <p className="text-sm font-medium">
                        {activity.content}
                    </p>
                    {activity.metadata?.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{activity.metadata.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                    {timeAgo(new Date(activity.createdAt))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
