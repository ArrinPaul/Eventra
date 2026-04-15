import { Metadata, Viewport } from 'next';

export const baseMetadata: Metadata = {
  title: 'Eventra',
  description: 'Event Management Platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Eventra',
    url: 'https://eventra.app',
  };
}
