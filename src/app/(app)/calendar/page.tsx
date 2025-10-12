'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import GoogleCalendarIntegration from '@/components/calendar/google-calendar-integration';
import { useToast } from '@/hooks/use-toast';

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'connected') {
      toast({
        title: "Connected Successfully",
        description: "Google Calendar has been connected to your account",
      });
      
      // Clean up URL
      window.history.replaceState(null, '', '/app/calendar');
    }

    if (error) {
      let errorMessage = "Failed to connect Google Calendar";
      
      switch (error) {
        case 'access_denied':
          errorMessage = "Access was denied. Please try again and grant the necessary permissions.";
          break;
        case 'callback_failed':
          errorMessage = "Connection failed during the authentication process.";
          break;
        case 'invalid_callback':
          errorMessage = "Invalid authentication callback.";
          break;
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Clean up URL
      window.history.replaceState(null, '', '/app/calendar');
    }
  }, [searchParams, toast]);

  return (
    <div className="container mx-auto px-4 py-8">
      <GoogleCalendarIntegration />
    </div>
  );
}