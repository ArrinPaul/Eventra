'use server';

import { db } from '@/lib/db';
import { ingestionSources } from '@/lib/db/schema';
import { validateRole } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

/**
 * Seed initial ingestion sources
 */
export async function seedIngestionSources() {
  await validateRole(['admin']);

  const sources = [
    { name: 'Unstop', url: 'https://unstop.com/find-events', category: 'Hackathons & Competitions' },
    { name: 'Eventbrite', url: 'https://www.eventbrite.com/d/online/all-events/', category: 'Global Events' },
    { name: 'Meetup', url: 'https://www.meetup.com/find/events/', category: 'Networking & Community' },
    { name: 'Devfolio', url: 'https://devfolio.co/hackathons', category: 'Tech Hackathons' },
    { name: 'Luma', url: 'https://lu.ma/explore', category: 'Curated Meetups' },
  ];

  try {
    for (const source of sources) {
      await db.insert(ingestionSources)
        .values(source)
        .onConflictDoUpdate({
            target: ingestionSources.url,
            set: { name: source.name, category: source.category }
        });
    }
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('seedIngestionSources Error:', error);
    return { success: false };
  }
}

/**
 * Get all ingestion sources
 */
export async function getIngestionSources() {
  await validateRole(['admin']);
  try {
    return await db.select().from(ingestionSources).orderBy(ingestionSources.createdAt);
  } catch (error) {
    return [];
  }
}
