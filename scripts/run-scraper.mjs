import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schemaModule from '../src/lib/db/schema/index.ts';
import { eq } from 'drizzle-orm';

const schema = schemaModule.default || schemaModule;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function getAdminUser() {
  try {
    const admins = await db.select().from(schema.users).where(eq(schema.users.role, 'admin')).limit(1);
    if (admins.length > 0) return admins[0].id;

    const anyUsers = await db.select().from(schema.users).limit(1);
    if (anyUsers.length > 0) return anyUsers[0].id;

    // Create a system user if none exists
    const [systemUser] = await db.insert(schema.users).values({
      id: 'system_admin',
      email: 'admin@eventra.cloud',
      name: 'System Admin',
      role: 'admin',
      onboardingCompleted: true,
    }).onConflictDoNothing().returning();

    if (!systemUser) {
        // Check if it already exists but we didn't get it back due to conflict
        const existing = await db.select().from(schema.users).where(eq(schema.users.id, 'system_admin')).limit(1);
        if (existing.length > 0) return existing[0].id;
    }

    return systemUser?.id || 'system_admin';
  } catch (error) {
    console.error('getAdminUser Error:', error);
    return 'system_admin';
  }
}

async function scrapeEventMetadata(url) {
  console.log(`\n--- Scraping: ${url} ---`);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    
    if (!response.ok) {
        console.error(`Failed to fetch ${url}: ${response.statusText}`);
        return null;
    }
    
    const html = await response.text();

    const getMeta = (props) => {
      for (const prop of props) {
        const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
          || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
        if (match) return match[1];
      }
      return null;
    };

    let jsonLdData = null;
    try {
      const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      if (jsonLdMatch) {
        const parsed = JSON.parse(jsonLdMatch[1].trim());
        jsonLdData = Array.isArray(parsed) ? parsed.find(item => item['@type'] === 'Event') : parsed;
      }
    } catch (e) {
      // Quietly fail JSON-LD
    }

    const title = jsonLdData?.name 
      || getMeta(['og:title', 'twitter:title']) 
      || html.match(/<title>([^<]+)<\/title>/i)?.[1] 
      || 'External Event';

    const description = jsonLdData?.description 
      || getMeta(['og:description', 'description', 'twitter:description']) 
      || 'No description available.';

    const imageUrl = jsonLdData?.image 
      || getMeta(['og:image', 'twitter:image', 'image']);

    const startDate = jsonLdData?.startDate || new Date(Date.now() + 86400000 * 7).toISOString();
    const endDate = jsonLdData?.endDate || new Date(Date.now() + 86400000 * 7 + 3600000).toISOString();
    const locationName = jsonLdData?.location?.name || jsonLdData?.location?.address?.streetAddress || 'Global Infrastructure';

    console.log(`Extracted: "${title.trim()}"`);
    
    return {
      title: title.trim(),
      description: description.trim(),
      imageUrl,
      externalUrl: url,
      startDate,
      endDate,
      location: locationName,
    };
  } catch (error) {
    console.error(`Scraper Error for ${url}:`, error);
    return null;
  }
}

async function ingestEvent(data, organizerId) {
  if (!data) return;
  console.log(`Ingesting: ${data.title}...`);
  try {
    const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
    
    await db.insert(schema.events).values({
      slug,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      externalUrl: data.externalUrl,
      category: 'Technology',
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: 'published',
      type: 'physical',
      location: { venue: data.location, address: data.externalUrl },
      capacity: 1000,
      organizerId: organizerId,
      updatedAt: new Date(),
    });
    console.log(`DONE: Ingested as ${slug}`);
  } catch (error) {
    console.error(`Ingestion Error for ${data.title}:`, error);
  }
}

async function main() {
  console.log('--- Eventra Smart Ingestor CLI ---');
  
  const organizerId = await getAdminUser();
  console.log(`Using Organizer ID: ${organizerId}`);

  // Using a real URL that is likely to work
  const urls = [
    'https://unstop.com/competitions/unstop-talent-awards-2024-unstop-12345',
    'https://www.eventbrite.com/e/ai-and-the-future-of-humanity-tickets-854746407317'
  ];

  for (const url of urls) {
    const metadata = await scrapeEventMetadata(url);
    if (metadata) {
      await ingestEvent(metadata, organizerId);
    }
  }

  console.log('\nAll operations completed.');
  process.exit(0);
}

main();
