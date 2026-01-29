import { Metadata, Viewport } from 'next';

/**
 * SEO Configuration & Metadata Utilities
 * Provides consistent SEO metadata across all pages
 */

// ============================================================
// BASE CONFIGURATION
// ============================================================

export const siteConfig = {
  name: 'Eventra',
  description: 'Modern event management platform for universities and organizations. Create, manage, and discover events with powerful tools for registration, check-in, analytics, and engagement.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://eventra.app',
  ogImage: '/og-image.png',
  twitterHandle: '@eventra',
  keywords: [
    'event management',
    'university events',
    'conference management',
    'event registration',
    'ticketing',
    'check-in system',
    'event analytics',
    'campus events',
    'student events',
    'event platform',
  ],
  creator: 'Eventra Team',
  publisher: 'Eventra',
};

// ============================================================
// VIEWPORT CONFIGURATION
// ============================================================

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

// ============================================================
// BASE METADATA
// ============================================================

export const baseMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.creator }],
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    creator: siteConfig.twitterHandle,
    images: [siteConfig.ogImage],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: siteConfig.url,
  },
};

// ============================================================
// PAGE-SPECIFIC METADATA GENERATORS
// ============================================================

export function generatePageMetadata(
  title: string,
  description?: string,
  options?: {
    keywords?: string[];
    image?: string;
    noIndex?: boolean;
    canonical?: string;
  }
): Metadata {
  return {
    title,
    description: description || siteConfig.description,
    keywords: [...siteConfig.keywords, ...(options?.keywords || [])],
    robots: options?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description: description || siteConfig.description,
      images: options?.image ? [{ url: options.image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      title,
      description: description || siteConfig.description,
      images: options?.image ? [options.image] : undefined,
    },
    alternates: options?.canonical ? { canonical: options.canonical } : undefined,
  };
}

export function generateEventMetadata(event: {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  date: string;
  location: string;
  organizer: string;
}): Metadata {
  const eventUrl = `${siteConfig.url}/events/${event.id}`;
  
  return {
    title: event.title,
    description: event.description,
    keywords: [...siteConfig.keywords, event.title, event.organizer, event.location],
    openGraph: {
      type: 'article',
      title: event.title,
      description: event.description,
      url: eventUrl,
      images: event.imageUrl
        ? [{ url: event.imageUrl, width: 1200, height: 630, alt: event.title }]
        : undefined,
      publishedTime: event.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.description,
      images: event.imageUrl ? [event.imageUrl] : undefined,
    },
    alternates: {
      canonical: eventUrl,
    },
  };
}

export function generateProfileMetadata(user: {
  name: string;
  bio?: string;
  imageUrl?: string;
  username: string;
}): Metadata {
  const profileUrl = `${siteConfig.url}/profile/${user.username}`;
  const description = user.bio || `${user.name} on ${siteConfig.name}`;
  
  return {
    title: user.name,
    description,
    openGraph: {
      type: 'profile',
      title: user.name,
      description,
      url: profileUrl,
      images: user.imageUrl
        ? [{ url: user.imageUrl, width: 400, height: 400, alt: user.name }]
        : undefined,
    },
    twitter: {
      card: 'summary',
      title: user.name,
      description,
      images: user.imageUrl ? [user.imageUrl] : undefined,
    },
    alternates: {
      canonical: profileUrl,
    },
  };
}

// ============================================================
// STRUCTURED DATA (JSON-LD)
// ============================================================

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: [
      'https://twitter.com/eventra',
      'https://linkedin.com/company/eventra',
      'https://github.com/eventra',
    ],
  };
}

export function generateEventSchema(event: {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  location: string;
  locationAddress?: string;
  organizer: string;
  price?: number;
  currency?: string;
  availability?: 'InStock' | 'SoldOut' | 'PreOrder';
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    image: event.imageUrl,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.location,
      address: event.locationAddress || event.location,
    },
    organizer: {
      '@type': 'Organization',
      name: event.organizer,
    },
    offers: event.price !== undefined ? {
      '@type': 'Offer',
      price: event.price,
      priceCurrency: event.currency || 'USD',
      availability: `https://schema.org/${event.availability || 'InStock'}`,
      url: `${siteConfig.url}/events/${event.id}`,
    } : undefined,
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// ============================================================
// PAGE METADATA PRESETS
// ============================================================

export const pageMetadata = {
  home: generatePageMetadata(
    'Eventra - Modern Event Management Platform',
    'Create, manage, and discover events with powerful tools for registration, check-in, analytics, and engagement.',
    { keywords: ['home', 'landing', 'event platform'] }
  ),
  
  explore: generatePageMetadata(
    'Explore Events',
    'Discover upcoming events near you. Browse conferences, workshops, meetups, and more.',
    { keywords: ['explore', 'discover', 'browse events', 'upcoming events'] }
  ),
  
  dashboard: generatePageMetadata(
    'Dashboard',
    'Manage your events, registrations, and analytics in one place.',
    { keywords: ['dashboard', 'manage', 'admin'], noIndex: true }
  ),
  
  myEvents: generatePageMetadata(
    'My Events',
    'View your registered events, tickets, and attendance history.',
    { keywords: ['my events', 'registrations', 'tickets'], noIndex: true }
  ),
  
  createEvent: generatePageMetadata(
    'Create Event',
    'Create a new event with our easy-to-use event creation wizard.',
    { keywords: ['create event', 'new event', 'host event'], noIndex: true }
  ),
  
  analytics: generatePageMetadata(
    'Analytics',
    'Get insights into your event performance with detailed analytics.',
    { keywords: ['analytics', 'insights', 'metrics', 'reports'], noIndex: true }
  ),
  
  organizer: generatePageMetadata(
    'Organizer Dashboard',
    'Powerful tools for event organizers to manage events, attendees, and communications.',
    { keywords: ['organizer', 'event management', 'admin tools'], noIndex: true }
  ),
  
  login: generatePageMetadata(
    'Log In',
    'Sign in to your Eventra account to manage events and registrations.',
    { keywords: ['login', 'sign in', 'account'], noIndex: true }
  ),
  
  signup: generatePageMetadata(
    'Sign Up',
    'Create your Eventra account and start discovering events.',
    { keywords: ['signup', 'register', 'create account'], noIndex: true }
  ),
  
  certificates: generatePageMetadata(
    'Certificates',
    'View and download your event participation certificates.',
    { keywords: ['certificates', 'credentials', 'achievements'], noIndex: true }
  ),
  
  leaderboard: generatePageMetadata(
    'Leaderboard',
    'See top participants and earn points by attending events.',
    { keywords: ['leaderboard', 'points', 'gamification', 'rankings'] }
  ),
  
  community: generatePageMetadata(
    'Community',
    'Join communities, connect with others, and discover group events.',
    { keywords: ['community', 'groups', 'networking', 'social'] }
  ),
  
  privacy: generatePageMetadata(
    'Privacy Policy',
    'Learn how we collect, use, and protect your personal information.',
    { keywords: ['privacy', 'data protection', 'policy'] }
  ),
  
  terms: generatePageMetadata(
    'Terms of Service',
    'Read our terms and conditions for using the Eventra platform.',
    { keywords: ['terms', 'conditions', 'legal', 'agreement'] }
  ),
};

// ============================================================
// EXPORT
// ============================================================

export default {
  siteConfig,
  viewport,
  baseMetadata,
  generatePageMetadata,
  generateEventMetadata,
  generateProfileMetadata,
  generateOrganizationSchema,
  generateEventSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  pageMetadata,
};
