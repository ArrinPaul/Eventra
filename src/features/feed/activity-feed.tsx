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
  Ticket,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/core/utils/utils';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string, label: string }> = {
  registration: { icon: Ticket, color: 'text-notion-primary', bg: 'bg-notion-primary/10', label: 'Ticket Confirmed' },
  badge_awarded: { icon: Trophy, color: 'text-notion-accent-orange', bg: 'bg-notion-accent-orange/10', label: 'Achievement' },
  post: { icon: MessageSquare, color: 'text-notion-accent-sky', bg: 'bg-notion-accent-sky/10', label: 'Community Post' },
  event_created: { icon: Calendar, color: 'text-notion-accent-teal', bg: 'bg-notion-accent-teal/10', label: 'Event Deployed' },
  event_checkin: { icon: QrCode, color: 'text-notion-accent-purple', bg: 'bg-notion-accent-purple/10', label: 'Node Entry' },
  connection: { icon: UserPlus, color: 'text-notion-accent-pink', bg: 'bg-notion-accent-pink/10', label: 'New Connection' },
  community_joined: { icon: UserIcon, color: 'text-notion-accent-brown', bg: 'bg-notion-accent-brown/10', label: 'Network Joined' },
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
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
      <Card className="border-notion-hairline bg-white dark:bg-zinc-950 shadow-sm">
        <CardContent className="py-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-notion-canvas-soft flex items-center justify-center mx-auto border border-notion-hairline">
             <Activity className="h-5 w-5 text-notion-ink-faint/30" />
          </div>
          <div className="space-y-1">
             <p className="text-sm font-bold text-notion-ink">System Quiet.</p>
             <p className="text-[10px] text-notion-ink-faint uppercase font-black tracking-widest leading-relaxed">No recent telemetry found.<br />Syncing network...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {initialActivities.map((item: any) => {
        const activity = item.activity;
        const user = item.user;
        const config = typeConfig[activity.type] || typeConfig.registration;
        const Icon = config.icon;

        return (
          <div key={activity.id} className="group relative bg-white dark:bg-zinc-950 border border-notion-hairline rounded-2xl p-4 hover:shadow-notion-soft transition-all duration-300 cursor-default">
            <div className="flex items-start gap-4">
              <div className={cn("w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border border-notion-hairline shadow-sm transition-transform group-hover:scale-105", config.bg)}>
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-notion-ink-faint">{config.label}</span>
                  <span className="text-[9px] font-bold text-notion-ink-faint uppercase">{timeAgo(new Date(activity.createdAt))}</span>
                </div>
                <div className="space-y-1">
                  {global && user?.name && (
                    <span className="text-xs font-bold text-notion-primary block">{user.name}</span>
                  )}
                  <p className="text-sm font-semibold text-notion-ink leading-tight line-clamp-2">
                      {activity.content}
                  </p>
                  {activity.metadata?.eventTitle && (
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-notion-ink-muted">
                       <Calendar className="w-3 h-3" />
                       <span className="truncate">{activity.metadata.eventTitle}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <ChevronRight className="w-3.5 h-3.5 text-notion-ink-faint" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
