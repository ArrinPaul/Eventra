import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import FloatingAiChat from '@/components/chat/floating-ai-chat';
import { NotificationWatcher } from '@/components/notifications/notification-watcher';
import { Outfit, Inter } from 'next/font/google';
import { baseMetadata, viewport as seoViewport, generateOrganizationSchema } from '@/core/services/seo';

// Export SEO metadata
export const metadata: Metadata = {
  ...baseMetadata,
  title: {
    default: 'Eventra - Modern Event Management Platform',
    template: '%s | Eventra',
  },
  description: 'Intelligent Event Management Platform for universities and organizations. Create, manage, and discover events with powerful tools.',
};

export const viewport: Viewport = seoViewport;

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();
  const locale = await getLocale();
  const messages = await getMessages();
  
  return (
    <html lang={locale} suppressHydrationWarning className={`${outfit.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
            <Toaster />
            <NotificationWatcher />
            <FloatingAiChat />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
