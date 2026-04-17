import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { NotificationWatcher } from '@/features/notifications/notification-watcher';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { baseMetadata, viewport as seoViewport, generateOrganizationSchema } from '@/core/services/seo';
import { NextIntlClientProvider } from 'next-intl';
import { getUserLocale } from '@/core/services/locale-service';
import enMessages from '../../messages/en.json';
import esMessages from '../../messages/es.json';

export const metadata: Metadata = {
  ...baseMetadata,
  title: {
    default: 'Eventra — Modern Event Management Platform',
    template: '%s · Eventra',
  },
  description:
    'A production-grade event management platform for organizers, attendees, and admins. Create, discover, and run events with a premium, unified workflow.',
};

export const viewport: Viewport = seoViewport;

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const interDisplay = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const messagesByLocale: Record<string, Record<string, unknown>> = {
  en: enMessages as Record<string, unknown>,
  es: esMessages as Record<string, unknown>,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getUserLocale();
  const safeLocale = locale in messagesByLocale ? locale : 'en';
  const messages = messagesByLocale[safeLocale];
  const organizationSchema = generateOrganizationSchema();

  return (
    <html
      lang={safeLocale}
      suppressHydrationWarning
      className={`${inter.variable} ${interDisplay.variable} ${jetbrains.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <NextIntlClientProvider locale={safeLocale} messages={messages}>
          <Providers>
            {children}
            <NotificationWatcher />
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
