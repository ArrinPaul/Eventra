import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import FloatingAiChat from '@/components/chat/floating-ai-chat';
import { Playfair_Display, PT_Sans } from 'next/font/google';
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

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();
  
  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${ptSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="font-body antialiased">
        <Providers>
          {children}
          <Toaster />
          <FloatingAiChat />
        </Providers>
      </body>
    </html>
  );
}
