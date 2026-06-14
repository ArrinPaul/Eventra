'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase/client';

/**
 * Global component that watches for new notifications and shows a toast
 * and handles browser push notifications.
 * Email logic has been moved to server-side actions for better reliability.
 */
export function NotificationWatcher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const lastNotifIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Request browser notification permission on mount
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // 2. Real-time Subscription for notifications
    const channel = supabase
      .channel(`watcher:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newest = payload.new as any;
          
          // Prevent double processing
          if (newest.id === lastNotifIdRef.current) return;
          lastNotifIdRef.current = newest.id;

          // Skip background/hidden notifications (like email triggers)
          if (newest.type === 'email' || newest.message.startsWith('EMAIL_TRIGGER:')) {
            return;
          }

          // 1. Show Toast
          toast({
            title: newest.title,
            description: newest.message,
          });

          // 2. Show Browser Notification if permitted
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(newest.title, {
              body: newest.message,
              icon: '/favicon.ico',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, user]);

  return null;
}
