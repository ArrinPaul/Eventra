import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { Fraunces, Manrope } from 'next/font/google';
import { baseMetadata, viewport as seoViewport, generateOrganizationSchema } from '@/core/services/seo';
import { NextIntlClientProvider } from 'next-intl';
import { getUserLocale } from '@/core/services/locale-service';
import enMessages from '../../messages/en.json';
import esMessages from '../../messages/es.json';

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

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
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
    <html lang={safeLocale} suppressHydrationWarning className={`${fraunces.variable} ${manrope.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <NextIntlClientProvider locale={safeLocale} messages={messages}>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

