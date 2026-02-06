'use client';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { PushNotificationProvider } from '@/components/notifications/push-notification-provider';
import { ConvexClientProvider } from '@/components/providers/convex-client-provider';
import { AuthProvider } from '@/context/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance with useState to ensure it's stable across re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache data for 30 minutes
            gcTime: 30 * 60 * 1000,
            // Don't refetch on window focus in development
            refetchOnWindowFocus: process.env.NODE_ENV === 'production',
            // Retry failed requests 2 times
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ConvexClientProvider>
          <AuthProvider>
            <PushNotificationProvider>
              {children}
            </PushNotificationProvider>
          </AuthProvider>
        </ConvexClientProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
