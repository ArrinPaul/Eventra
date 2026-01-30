'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  subscribeToNotifications,
  setupPushNotificationListener,
  requestNotificationPermission,
  isNotificationsSupported,
  getNotificationPermission
} from '@/features/notifications/services/notification-service';

interface PushNotificationContextType {
  isSupported: boolean;
  permission: 'granted' | 'denied' | 'default';
  isSubscribed: boolean;
  requestPermission: () => Promise<void>;
  subscribe: () => Promise<void>;
}

const PushNotificationContext = createContext<PushNotificationContextType>({
  isSupported: false,
  permission: 'default',
  isSubscribed: false,
  requestPermission: async () => {},
  subscribe: async () => {}
});

export function usePushNotifications() {
  return useContext(PushNotificationContext);
}

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check if notifications are supported
  useEffect(() => {
    setIsSupported(isNotificationsSupported());
    setPermission(getNotificationPermission());
  }, []);

  // Setup push notification listener when user is logged in
  useEffect(() => {
    if (!user || !isSupported || permission !== 'granted') return;

    const unsubscribe = setupPushNotificationListener((notification) => {
      // Show toast for foreground notifications
      toast({
        title: notification.title,
        description: notification.body
      });

      // Play notification sound if enabled
      playNotificationSound();
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user, isSupported, permission, toast]);

  // Auto-subscribe when permission is granted and user is logged in
  useEffect(() => {
    if (user && isSupported && permission === 'granted' && !isSubscribed) {
      subscribeToNotifications('web')
        .then((result) => {
          if (result.success) {
            setIsSubscribed(true);
            console.log('Subscribed to push notifications');
          }
        })
        .catch(console.error);
    }
  }, [user, isSupported, permission, isSubscribed]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in your browser.',
        variant: 'destructive'
      });
      return;
    }

    const result = await requestNotificationPermission();
    setPermission(result);

    if (result === 'granted') {
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive push notifications.'
      });
    } else if (result === 'denied') {
      toast({
        title: 'Notifications Blocked',
        description: 'You can enable notifications in your browser settings.',
        variant: 'destructive'
      });
    }
  }, [isSupported, toast]);

  const subscribe = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to enable notifications.',
        variant: 'destructive'
      });
      return;
    }

    if (permission !== 'granted') {
      await requestPermission();
      return;
    }

    try {
      const result = await subscribeToNotifications('web');
      if (result.success) {
        setIsSubscribed(true);
        toast({
          title: 'Subscribed',
          description: 'You are now subscribed to push notifications.'
        });
      } else {
        toast({
          title: 'Subscription Failed',
          description: 'Could not subscribe to notifications. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive'
      });
    }
  }, [user, permission, requestPermission, toast]);

  return (
    <PushNotificationContext.Provider
      value={{
        isSupported,
        permission,
        isSubscribed,
        requestPermission,
        subscribe
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
}

// Helper function to play notification sound
function playNotificationSound() {
  try {
    // Check if user has sound enabled (from localStorage preferences)
    const preferences = localStorage.getItem('notificationPreferences');
    if (preferences) {
      const parsed = JSON.parse(preferences);
      if (parsed.inApp?.sound === false) return;
    }

    // Create and play a simple notification sound
    // webkitAudioContext is needed for Safari compatibility
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    // Silently fail if audio can't be played
    console.debug('Could not play notification sound:', error);
  }
}
