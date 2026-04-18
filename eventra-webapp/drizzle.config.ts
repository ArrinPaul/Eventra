import { defineConfig } from 'drizzle-kit';

// Load environment variables from .env.local if available
if (process.env.NODE_ENV !== 'production') {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach((line: string) => {
        const [key, ...valueParts] = line.split('=');
        const trimmedKey = key?.trim();
        const trimmedValue = valueParts.join('=').trim();
        if (trimmedKey && trimmedValue && !process.env[trimmedKey]) {
          process.env[trimmedKey] = trimmedValue.replace(/^["']|["']$/g, '');
        }
      });
    }
  } catch (e) {
    // Silently fail if env loading fails
  }
}

export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  entities: {
    roles: {
      provider: 'supabase',
    },
  },
  tablesFilter: [
    'users',
    'events',
    'ticket_tiers',
    'tickets',
    'waitlist',
    'communities',
    'community_members',
    'posts',
    'comments',
    'badges',
    'user_badges',
    'notifications',
    'follows',
    'chat_rooms',
    'chat_participants',
    'chat_messages',
    'ai_chat_sessions',
    'ai_chat_messages',
    'feedback_templates',
    'certificate_templates',
    'event_feedback',
    'event_staff',
    'sponsors',
    'activity_feed',
    'event_media',
  ],
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://invalid:invalid@localhost:5432/eventra',
  },
});
