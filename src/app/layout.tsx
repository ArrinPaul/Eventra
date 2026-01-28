import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import FloatingAiChat from '@/components/chat/floating-ai-chat';
import { Playfair_Display, PT_Sans } from 'next/font/google';

export const metadata: Metadata = {
  title: 'EventOS',
  description: 'Intelligent Event Management Platform',
};

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
  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${ptSans.variable}`}>
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
