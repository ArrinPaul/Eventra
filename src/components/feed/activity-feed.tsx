'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
  Activity 
} from 'lucide-react';
import Link from 'next/link';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  registration: { icon: Ticket, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  badge_earned: { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  post_created: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  event_created: { icon: Calendar, color: 'text-green-400', bg: 'bg-green-500/10' },
  check_in: { icon: QrCode, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  connection: { icon: UserPlus, color: 'text-pink-400', bg: 'bg-pink-500/10' },
};

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function ActivityFeed({ userId, global }: { userId?: string; global?: boolean }) {
  const myFeed = useQuery(
    global ? api.activity.getGlobalFeed : userId ? api.activity.getUserFeed : api.activity.getMyFeed,
    userId ? { userId: userId as any } : {}
  );

  if (myFeed === undefined) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (myFeed.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10 text-white">
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">No activity yet</p>
          <p className="text-sm text-gray-600 mt-1">Activities will appear here as you use the platform</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-cyan-400" />
          {global ? 'Global Activity' : 'Recent Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {myFeed.map((item: any, i: number) => {
          const config = typeConfig[item.type] || typeConfig.registration;
          const Icon = config.icon;
          return (
            <div key={item._id} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
              {/* Timeline dot */}
              <div className={`p-2 rounded-lg shrink-0 ${config.bg}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {global && item.userName && (
                      <span className="text-xs text-gray-500 block">{item.userName}</span>
                    )}
                    <p className="text-sm font-medium">
                      {item.link ? (
                        <Link href={item.link} className="hover:text-cyan-400 transition-colors">
                          {item.title}
                        </Link>
                      ) : (
                        item.title
                      )}
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-600 whitespace-nowrap shrink-0">
                    {timeAgo(item.createdAt)}
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
