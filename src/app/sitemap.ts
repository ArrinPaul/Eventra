import { MetadataRoute } from 'next';

/**
 * Dynamic Sitemap Generator
 * Generates sitemap for SEO
 */

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eventra.app';

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticPages = [
    '',
    '/explore',
    '/community',
    '/leaderboard',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/auth/login',
    '/auth/signup',
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route === '/explore' ? 0.9 : 0.8,
  }));

  // In production, you would fetch dynamic routes from your database:
  // const events = await getPublicEvents();
  // const eventRoutes = events.map(event => ({
  //   url: `${baseUrl}/events/${event.id}`,
  //   lastModified: event.updatedAt,
  //   changeFrequency: 'daily',
  //   priority: 0.7,
  // }));

  // For now, return static routes
  return staticRoutes;
}
