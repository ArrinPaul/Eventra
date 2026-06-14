import { db } from './index';
import { badges } from './schema';
import { sql } from 'drizzle-orm';

export async function seedStandardBadges() {
  console.log('Seeding standard badges...');
  
  const standardBadges = [
    {
      name: 'Network Pioneer',
      description: 'Awarded for joining the Eventra mesh.',
      icon: 'zap',
      category: 'onboarding',
      criteria: { type: 'account_created' }
    },
    {
      name: 'First Sync',
      description: 'Awarded for your first event registration.',
      icon: 'ticket',
      category: 'event',
      criteria: { type: 'registration_count', count: 1 }
    },
    {
      name: 'Event Veteran',
      description: 'Awarded for attending 5 events.',
      icon: 'trophy',
      category: 'event',
      criteria: { type: 'attendance_count', count: 5 }
    },
    {
      name: 'Community Voice',
      description: 'Awarded for making your first community post.',
      icon: 'message-square',
      category: 'community',
      criteria: { type: 'post_count', count: 1 }
    },
    {
      name: 'Elite Organizer',
      description: 'Awarded for successfully hosting an event with 50+ attendees.',
      icon: 'shield-check',
      category: 'organizer',
      criteria: { type: 'host_attendance', count: 50 }
    }
  ];

  try {
    for (const badge of standardBadges) {
      await db.insert(badges).values(badge).onConflictDoNothing();
    }
    console.log('Standard badges seeded successfully.');
  } catch (error) {
    console.error('Error seeding badges:', error);
  }
}
