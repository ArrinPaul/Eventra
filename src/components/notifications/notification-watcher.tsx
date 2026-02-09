'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

/**
 * Global component that watches for new notifications and shows a toast
 */
export function NotificationWatcher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const latestNotification = useQuery(api.notifications.get);
  const lastNotifIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Request notification permission on mount
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!latestNotification || latestNotification.length === 0) return;

    const newest = latestNotification[0];
    
    // If it's a new notification ID we haven't seen this session, and it's unread
    if (newest._id !== lastNotifIdRef.current && !newest.read) {
      // Don't toast if it's older than 1 minute
      const isRecent = Date.now() - newest.createdAt < 60000;
      
      if (isRecent) {
        // 1. Show Toast
        toast({
          title: newest.title,
          description: newest.message,
        });

        // 2. Show Browser Notification if permitted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(newest.title, {
            body: newest.message,
            icon: '/favicon.ico', // Update path if needed
          });
        }
      }
      
      lastNotifIdRef.current = newest._id;
    }
  }, [latestNotification, toast]);

  return null;
}
