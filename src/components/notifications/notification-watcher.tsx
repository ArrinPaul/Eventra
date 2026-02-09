'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
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
  const markRead = useMutation(api.notifications.markRead);
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
        // Special case: Email confirmation trigger
        if (newest.type === 'email' && newest.message.startsWith('CONFIRMATION_EMAIL:')) {
          handleEmailTrigger(newest);
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
      
      lastNotifIdRef.current = newest._id;
    }
  }, [latestNotification, toast]);

  const handleEmailTrigger = async (notif: any) => {
    if (!user?.email) return;
    
    // Mark as read immediately to prevent multiple triggers
    await markRead({ id: notif._id });

    try {
      const parts = notif.message.split(':');
      const ticketNumber = parts[2];
      
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: `Registration Confirmed! - ${ticketNumber}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h1 style="color: #06b6d4;">Registration Confirmed! 🎉</h1>
              <p>Hello ${user.name || 'Attendee'},</p>
              <p>Your registration for the event has been successfully confirmed.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 10px; margin: 20px 0;">
                <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
                <p><strong>Status:</strong> Confirmed</p>
              </div>
              <p>You can view and download your full ticket in the Eventra app.</p>
              <br/>
              <p>See you there!</p>
              <p>The Eventra Team</p>
            </div>
          `
        })
      });
    } catch (e) {
      console.error("Failed to send confirmation email:", e);
    }
  };

  return null;
}