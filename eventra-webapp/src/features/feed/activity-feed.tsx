'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  Trophy, 
  MessageSquare, 
  UserPlus, 
  QrCode, 
  Activity,
  User as UserIcon,
  Ticket
} from 'lucide-react';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  registration: { icon: Ticket, color: 'text-notion-primary', bg: 'bg-notion-primary/10' },
  badge_awarded: { icon: Trophy, color: 'text-notion-accent-orange', bg: 'bg-notion-accent-orange/10' },
  post: { icon: MessageSquare, color: 'text-notion-accent-sky', bg: 'bg-notion-accent-sky/10' },
  event_created: { icon: Calendar, color: 'text-notion-accent-teal', bg: 'bg-notion-accent-teal/10' },
  event_checkin: { icon: QrCode, color: 'text-notion-accent-purple', bg: 'bg-notion-accent-purple/10' },
  connection: { icon: UserPlus, color: 'text-notion-accent-pink', bg: 'bg-notion-accent-pink/10' },
  community_joined: { icon: UserIcon, color: 'text-notion-accent-brown', bg: 'bg-notion-accent-brown/10' },
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

export function ActivityFeed({ initialActivities = [], global }: ActivityFeedProps) {
  if (initialActivities.length === 0) {
    return (
      <Card className="border-notion-hairline bg-notion-surface">
        <CardContent className="py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-notion-canvas-soft flex items-center justify-center mx-auto border border-notion-hairline">
             <Activity className="h-6 w-6 text-notion-ink-faint/30" />
          </div>
          <div className="space-y-1">
             <p className="text-title font-bold">System Quiet.</p>
             <p className="text-eyebrow text-notion-ink-muted uppercase font-bold">Waiting for synchronization...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-notion-hairline bg-notion-surface overflow-hidden">
      <CardHeader className="p-6 pb-4 border-b border-notion-hairline bg-notion-canvas-soft/30">
        <CardTitle className="flex items-center gap-2.5 text-h3">
          <div className="w-8 h-8 rounded-md bg-notion-primary/10 flex items-center justify-center">
             <Activity className="h-4 w-4 text-notion-primary" />
          </div>
          {global ? 'Mesh Activity' : 'Recent Syncs'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-notion-hairline">
          {initialActivities.map((item: any) => {
            const activity = item.activity;
            const user = item.user;
            const config = typeConfig[activity.type] || typeConfig.registration;
            const Icon = config.icon;

            return (
              <div key={activity.id} className="flex items-start gap-4 p-6 hover:bg-notion-canvas-soft/30 transition-colors group">
                <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center border border-notion-hairline shadow-notion-soft ${config.bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      {global && user?.name && (
                        <span className="text-eyebrow font-bold text-notion-primary block">{user.name}</span>
                      )}
                      <p className="text-body-sm font-semibold text-notion-ink leading-snug">
                          {activity.content}
                      </p>
                      {activity.metadata?.description && (
                        <p className="text-caption text-notion-ink-muted line-clamp-1 italic">{activity.metadata.description}</p>
                      )}
                    </div>
                    <span className="text-eyebrow font-bold text-notion-ink-faint shrink-0 uppercase">
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
