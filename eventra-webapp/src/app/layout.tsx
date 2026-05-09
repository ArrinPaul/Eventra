import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { NotificationWatcher } from '@/features/notifications/notification-watcher';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { baseMetadata, viewport as seoViewport, generateOrganizationSchema } from '@/core/services/seo';
import { NextIntlClientProvider } from 'next-intl';
import { getUserLocale } from '@/core/services/locale-service';
import enMessages from '../../messages/en.json';
import esMessages from '../../messages/es.json';

// Export SEO metadata
export const metadata: Metadata = {
  ...baseMetadata,
  title: {
    default: 'Eventra — Modern Event Management Platform',
    template: '%s | Eventra',
  },
  description: 'Intelligent Event Management Platform for universities and organizations. Create, manage, and discover events with powerful tools.',
};

export const viewport: Viewport = seoViewport;

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fontSpaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const fontJetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const messagesByLocale: Record<string, Record<string, unknown>> = {
  en: enMessages as Record<string, unknown>,
  es: esMessages as Record<string, unknown>,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getUserLocale();
  const safeLocale = locale in messagesByLocale ? locale : 'en';
  const messages = messagesByLocale[safeLocale];
  const organizationSchema = generateOrganizationSchema();
  
  return (
    <html lang={safeLocale} suppressHydrationWarning className={`${fontInter.variable} ${fontSpaceGrotesk.variable} ${fontJetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
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
