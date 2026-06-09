import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { NotificationWatcher } from '@/features/notifications/notification-watcher';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { baseMetadata, viewport as seoViewport, generateOrganizationSchema } from '@/core/services/seo';
import { NextIntlClientProvider } from 'next-intl';
import { getUserLocale } from '@/core/services/locale-service';
import { getMessages } from 'next-intl/server';
import { ClerkProvider } from '@clerk/nextjs';

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getUserLocale();
  const messages = await getMessages();
  const organizationSchema = generateOrganizationSchema();
  
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang={locale} suppressHydrationWarning className={`${fontInter.variable} ${fontSpaceGrotesk.variable} ${fontJetbrainsMono.variable}`}>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          />
        </head>
        <body className="font-sans antialiased bg-background text-foreground">
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Providers>
              {children}
              <NotificationWatcher />
              <Toaster />
            </Providers>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
