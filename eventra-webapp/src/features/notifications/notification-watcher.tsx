'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase/client';
import { markNotificationRead } from '@/app/actions/notifications';

/**
 * Global component that watches for new notifications and shows a toast
 * and handles push notifications/emails triggers
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
          
          // Prevent double processing if already handled by other components
          if (newest.id === lastNotifIdRef.current) return;
          lastNotifIdRef.current = newest.id;

          // Special case: Email triggers
          // These are "hidden" notifications that trigger background actions
          if (newest.type === 'email' || newest.message.startsWith('EMAIL_TRIGGER:')) {
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
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const handleEmailTrigger = async (notif: any) => {
    if (!user?.email) return;
    
    // Mark as read immediately to prevent multiple triggers if subscription re-fires
    await markNotificationRead(notif.id);

    try {
      // Logic for different email types based on message content
      let subject = '';
      let html = '';
      
      const message = notif.message.replace('EMAIL_TRIGGER:', '');
      const parts = message.split('|');
      const type = parts[0]; // confirmation, certificate, reminder

      if (type === 'confirmation') {
        const ticketNumber = parts[1] || 'N/A';
        const eventTitle = parts[2] || 'the event';
        subject = `Registration Confirmed: ${eventTitle}`;
        html = `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #06b6d4; text-align: center;">Registration Confirmed!</h1>
            <p>Hello ${user.name || 'Attendee'},</p>
            <p>Your registration for <strong>${eventTitle}</strong> has been successfully confirmed.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #06b6d4;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">Ticket Number</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #0f172a; letter-spacing: 2px;">${ticketNumber}</p>
            </div>
            <p>You can view and download your QR code ticket in the Eventra app under "My Tickets".</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://eventra.com'}/tickets" style="background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View My Tickets</a>
            </div>
            <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">The Eventra Team</p>
          </div>
        `;
      } else if (type === 'certificate') {
        const eventTitle = parts[1] || 'the event';
        subject = `Congratulations! Your certificate for ${eventTitle} is ready`;
        html = `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #06b6d4; text-align: center;">Certificate Ready!</h1>
            <p>Hello ${user.name || 'Attendee'},</p>
            <p>Congratulations on completing <strong>${eventTitle}</strong>! Your official certificate of participation is now available for download.</p>
            <p>You can access it from your profile under the "Certificates" tab.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://eventra.com'}/profile" style="background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Download Certificate</a>
            </div>
            <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">Well done from the Eventra Team!</p>
          </div>
        `;
      } else {
        // Generic email fallback
        subject = notif.title;
        html = `<p>${notif.message}</p>`;
      }
      
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: subject,
          html: html
        })
      });
    } catch (e) {
      console.error("Failed to send email trigger:", e);
    }
  };

  return null;
}


