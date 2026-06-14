import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is missing');
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  ssl: 'require',
  prepare: false,
});

async function seedStandardBadges() {
  console.log('Seeding standard badges...');
  
  const standardBadges = [
    {
      name: 'Network Pioneer',
      description: 'Awarded for joining the Eventra mesh.',
      icon: 'zap',
      category: 'onboarding',
      criteria: JSON.stringify({ type: 'account_created' })
    },
    {
      name: 'First Sync',
      description: 'Awarded for your first event registration.',
      icon: 'ticket',
      category: 'event',
      criteria: JSON.stringify({ type: 'registration_count', count: 1 })
    },
    {
      name: 'Event Veteran',
      description: 'Awarded for attending 5 events.',
      icon: 'trophy',
      category: 'event',
      criteria: JSON.stringify({ type: 'attendance_count', count: 5 })
    },
    {
      name: 'Community Voice',
      description: 'Awarded for making your first community post.',
      icon: 'message-square',
      category: 'community',
      criteria: JSON.stringify({ type: 'post_count', count: 1 })
    },
    {
      name: 'Elite Organizer',
      description: 'Awarded for successfully hosting an event with 50+ attendees.',
      icon: 'shield-check',
      category: 'organizer',
      criteria: JSON.stringify({ type: 'host_attendance', count: 50 })
    }
  ];

  try {
    for (const badge of standardBadges) {
      const existing = await sql`select id from badges where name = ${badge.name}`;
      if (existing.length === 0) {
        await sql`
          insert into badges (name, description, icon, category, criteria)
          values (${badge.name}, ${badge.description}, ${badge.icon}, ${badge.category}, ${badge.criteria}::jsonb)
        `;
        console.log(`Badge "${badge.name}" created.`);
      } else {
        console.log(`Badge "${badge.name}" already exists.`);
      }
    }
    console.log('Standard badges seeded successfully.');
  } catch (error) {
    console.error('Error seeding badges:', error);
  } finally {
    await sql.end();
  }
}

seedStandardBadges();
