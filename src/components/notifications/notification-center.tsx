'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, usePaginatedQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Calendar,
  Clock,
  MoreHorizontal,
  X,
  Info,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/core/utils/utils';

export function NotificationBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  
  const notificationsRaw = useQuery(api.notifications.get, { limit: 20 }) || [];
  const unreadCount = useQuery(api.notifications.getUnreadCount) || 0;
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const deleteMutation = useMutation(api.notifications.deleteNotification);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white">
          {unreadCount > 0 ? <BellRing className="w-5 h-5 text-cyan-400" /> : <Bell className="w-5 h-5" />}
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">{unreadCount}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 bg-gray-900 border-white/10 text-white" align="end">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={() => markAllRead()}><CheckCheck className="w-4 h-4 mr-1" /> Mark all read</Button>}
        </div>
        <ScrollArea className="h-[400px]">
          {notificationsRaw.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500"><Bell className="w-12 h-12 mb-4 opacity-20" /><p>No notifications yet</p></div>
          ) : (
            <div className="divide-y divide-white/10">
              {notificationsRaw.slice(0, 10).map((n: any) => (
                <div key={n._id} className={cn("p-4 hover:bg-white/5 cursor-pointer", !n.read && "bg-cyan-500/5")} onClick={() => { markRead({ id: n._id }); if (n.link) { setOpen(false); router.push(n.link); } }}>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <p className={cn("text-sm", !n.read && "font-bold")}>{n.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.message}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{formatDistanceToNow(n.createdAt, { addSuffix: true })}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteMutation({ id: n._id }); }}><X className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function NotificationCenter() {
  const router = useRouter();
  const { results, status, loadMore } = usePaginatedQuery(
    api.notifications.list,
    {},
    { initialNumItems: 10 }
  );
  
  const notifications = results || [];
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const deleteMutation = useMutation(api.notifications.deleteNotification);

  const unreadCount = useQuery(api.notifications.getUnreadCount) || 0;

  return (
    <div className="container py-8 space-y-6 text-white">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Notifications</h1><p className="text-gray-400">{unreadCount} unread</p></div>
        <Button onClick={() => markAllRead()} variant="outline" className="border-white/10">Mark all as read</Button>
      </div>
      <Card className="bg-white/5 border-white/10">
        <div className="divide-y divide-white/10">
          {notifications.map((n: any) => (
            <div key={n._id} className={cn("p-6 flex justify-between items-start cursor-pointer hover:bg-white/5 transition-colors", !n.read && "bg-cyan-500/5")} onClick={() => { if (!n.read) markRead({ id: n._id }); if (n.link) router.push(n.link); }}>
              <div>
                <h3 className="font-bold">{n.title}</h3>
                <p className="text-gray-300 mt-1">{n.message}</p>
                <p className="text-xs text-gray-500 mt-2">{formatDistanceToNow(n.createdAt, { addSuffix: true })}</p>
              </div>
              <div className="flex gap-2">
                {!n.read && <Button size="sm" variant="ghost" onClick={() => markRead({ id: n._id })}><Check className="w-4 h-4" /></Button>}
                <Button size="sm" variant="ghost" className="text-red-400" onClick={(e) => { e.stopPropagation(); deleteMutation({ id: n._id }); }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
          {notifications.length === 0 && status === "CanLoadMore" && <div className="p-20 text-center text-gray-500">No notifications found</div>}
          {status === "LoadingFirstPage" && <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-500" /></div>}
        </div>
        
        {status === "CanLoadMore" && (
          <div className="p-4 border-t border-white/10 flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => loadMore(10)}>Load More</Button>
          </div>
        )}
      </Card>
    </div>
  );
}