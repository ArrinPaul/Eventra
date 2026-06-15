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

async function seedSources() {
  console.log('--- Seeding Ingestion Sources ---');
  const sources = [
    { name: 'Unstop', url: 'https://unstop.com/find-events', category: 'Hackathons & Competitions' },
    { name: 'Eventbrite', url: 'https://www.eventbrite.com/d/online/all-events/', category: 'Global Events' },
    { name: 'Meetup', url: 'https://www.meetup.com/find/events/', category: 'Networking & Community' },
    { name: 'Devfolio', url: 'https://devfolio.co/hackathons', category: 'Tech Hackathons' },
    { name: 'Luma', url: 'https://lu.ma/explore', category: 'Curated Meetups' },
  ];

  try {
    for (const source of sources) {
      await db.insert(schema.ingestionSources)
        .values(source)
        .onConflictDoUpdate({
            target: schema.ingestionSources.url,
            set: { name: source.name, category: source.category }
        });
      console.log(`Seeded: ${source.name}`);
    }
  } catch (error) {
    console.error('seedIngestionSources Error:', error);
  }
}

async function main() {
  await seedSources();
  console.log('\nSeed complete.');
  process.exit(0);
}

main();
