import { MetadataRoute } from 'next';

/**
 * Robots.txt Generator
 * Dynamic robots.txt configuration
 */

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eventra.app';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/explore',
          '/events/*',
          '/community',
          '/leaderboard',
          '/about',
          '/contact',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
          '/auth/*',
          '/dashboard',
          '/dashboard/*',
          '/organizer',
          '/organizer/*',
          '/check-in-scanner',
          '/check-in-scanner/*',
          '/my-events',
          '/my-events/*',
          '/tickets',
          '/tickets/*',
          '/settings',
          '/settings/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
