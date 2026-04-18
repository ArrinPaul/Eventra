'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '@/app/actions/notifications';
import { supabase } from '@/lib/supabase/client';

export function NotificationBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notificationsRaw, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const data = await getNotifications(10);
    setNotifications(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // Real-time subscription
    const channel = supabase
      .channel(`notifs:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          toast({
            title: payload.new.title,
            description: payload.new.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, toast, user]);

  const unreadCount = notificationsRaw.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

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
          {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={handleMarkAllRead}><CheckCheck className="w-4 h-4 mr-1" /> Mark all read</Button>}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-cyan-400" /></div>
          ) : notificationsRaw.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500"><Bell className="w-12 h-12 mb-4 opacity-20" /><p>No notifications yet</p></div>
          ) : (
            <div className="divide-y divide-white/10">
              {notificationsRaw.map((n: any) => (
                <div key={n.id} className={cn("p-4 hover:bg-white/5 cursor-pointer transition-colors", !n.read && "bg-cyan-500/5")} onClick={() => { handleMarkRead(n.id); if (n.link) { setOpen(false); router.push(n.link); } }}>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <p className={cn("text-sm", !n.read && "font-bold text-white")}>{n.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.message}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}><X className="w-3 h-3" /></Button>
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
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user) return;
      const data = await getNotifications(50);
      setNotifications(data);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="container py-8 space-y-6 text-white max-w-4xl">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Notifications</h1><p className="text-gray-400">{unreadCount} unread</p></div>
        <Button onClick={handleMarkAllRead} variant="outline" className="border-white/10 hover:bg-white/5">Mark all as read</Button>
      </div>
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-500" /></div>
        ) : (
          <div className="divide-y divide-white/10">
            {notifications.map((n: any) => (
              <div key={n.id} className={cn("p-6 flex justify-between items-start cursor-pointer hover:bg-white/5 transition-colors", !n.read && "bg-cyan-500/5")} onClick={() => { if (!n.read) handleMarkRead(n.id); if (n.link) router.push(n.link); }}>
                <div>
                  <h3 className={cn("font-bold", !n.read ? "text-white" : "text-gray-200")}>{n.title}</h3>
                  <p className="text-gray-400 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                </div>
                <div className="flex gap-2">
                  {!n.read && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}><Check className="w-4 h-4" /></Button>}
                  <Button size="sm" variant="ghost" className="text-gray-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {notifications.length === 0 && <div className="p-20 text-center text-gray-500">No notifications found</div>}
          </div>
        )}
      </Card>
    </div>
  );
}
