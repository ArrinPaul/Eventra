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
        // Special case: Email triggers
        if (newest.type === 'email') {
          if (newest.message.startsWith('CONFIRMATION_EMAIL:')) {
            handleEmailTrigger(newest, 'confirmation');
            return;
          }
          if (newest.message.startsWith('CERTIFICATE_EMAIL:')) {
            handleEmailTrigger(newest, 'certificate');
            return;
          }
          if (newest.message.startsWith('REMINDER_EMAIL:')) {
            handleEmailTrigger(newest, 'reminder');
            return;
          }
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

  const handleEmailTrigger = async (notif: any, type: 'confirmation' | 'certificate' | 'reminder') => {
    if (!user?.email) return;
    
    // Mark as read immediately to prevent multiple triggers
    await markRead({ id: notif._id });

    try {
      const parts = notif.message.split(':');
      let subject = '';
      let html = '';

      if (type === 'confirmation') {
        const ticketNumber = parts[2];
        subject = `Registration Confirmed! - ${ticketNumber}`;
        html = `
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
        `;
      } else if (type === 'certificate') {
        const certNumber = parts[2];
        subject = `Your Certificate is Ready! 🏆`;
        html = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h1 style="color: #06b6d4;">Congratulations! 🏆</h1>
            <p>Hello ${user.name || 'Attendee'},</p>
            <p>You have successfully completed the event, and your certificate of participation is now available.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <p><strong>Certificate ID:</strong> ${certNumber}</p>
            </div>
            <p>You can download it from your profile under "Certificates".</p>
            <br/>
            <p>Best regards,</p>
            <p>The Eventra Team</p>
          </div>
        `;
      } else if (type === 'reminder') {
        const eventTitle = parts[2];
        subject = `Reminder: ${eventTitle} is starting soon! ⏰`;
        html = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h1 style="color: #06b6d4;">Event Reminder ⏰</h1>
            <p>Hello ${user.name || 'Attendee'},</p>
            <p>This is a friendly reminder that <strong>"${eventTitle}"</strong> is starting soon.</p>
            <p>Make sure you have your ticket ready for check-in!</p>
            <br/>
            <p>See you soon,</p>
            <p>The Eventra Team</p>
          </div>
        `;
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
      console.error("Failed to send email:", e);
    }
  };

  return null;
}