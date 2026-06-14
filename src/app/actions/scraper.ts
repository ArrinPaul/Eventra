'use server';

import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import { validateRole } from '@/lib/auth-utils';
import { generateEmbedding } from '@/lib/ai';
import { revalidatePath } from 'next/cache';

/**
 * Basic Slug Generator
 */
export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-');   // Replace multiple - with single -
}

/**
 * Extract Metadata from a URL (Proof of Concept Scraper)
 */
export async function scrapeEventMetadata(url: string) {
  await validateRole(['admin']);

  try {
    const response = await fetch(url);
    const html = await response.text();

    // Basic regex-based extraction for metadata tags
    const getMeta = (prop: string) => {
      const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
      return match ? match[1] : null;
    };

    const title = getMeta('og:title') || html.match(/<title>([^<]+)<\/title>/i)?.[1] || 'External Event';
    const description = getMeta('og:description') || getMeta('description') || 'No description available.';
    const imageUrl = getMeta('og:image');

    return {
      title,
      description,
      imageUrl,
      externalUrl: url,
    };
  } catch (error) {
    console.error('Scraper Error:', error);
    throw new Error('Failed to scrape URL');
  }
}

/**
 * Ingest an external event into the database
 */
export async function ingestExternalEvent(data: {
  title: string;
  description: string;
  imageUrl?: string;
  externalUrl: string;
  category: string;
  startDate: string;
  endDate: string;
}) {
  const user = await validateRole(['admin']);
  
  try {
    const slug = `${slugify(data.title)}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Generate embedding for recommendation support
    const embeddingContent = `${data.title} ${data.category} ${data.description}`;
    const embeddingResult = await generateEmbedding(embeddingContent);
    const embedding = (embeddingResult as any)?.embedding?.values;

    const [newEvent] = await db.insert(events).values({
      slug,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      externalUrl: data.externalUrl,
      category: data.category,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: 'published',
      type: 'physical',
      location: { venue: 'External Source', address: data.externalUrl },
      capacity: 1000,
      organizerId: user.id,
      embedding: embedding,
    }).returning();

    revalidatePath('/explore');
    return { success: true, event: newEvent };
  } catch (error) {
    console.error('Ingestion Error:', error);
    return { success: false, error: 'Failed to ingest event' };
  }
}
