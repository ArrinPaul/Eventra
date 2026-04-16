'use server';

import { db } from '@/lib/db';
import { sponsors } from '@/lib/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { validateEventOwnership } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

/**
 * Add or update a sponsor
 */
export async function upsertSponsor(data: {
  id?: string;
  eventId: string;
  name: string;
  logoUrl?: string;
  websiteUrl?: string;
  tier: string;
  order?: number;
}) {
  await validateEventOwnership(data.eventId);

  try {
    if (data.id) {
      const [updated] = await db
        .update(sponsors)
        .set({
          name: data.name,
          logoUrl: data.logoUrl,
          websiteUrl: data.websiteUrl,
          tier: data.tier,
          order: data.order ?? 0,
        })
        .where(eq(sponsors.id, data.id))
        .returning();
      
      revalidatePath(`/events/${data.eventId}`);
      return updated;
    } else {
      const [created] = await db
        .insert(sponsors)
        .values({
          eventId: data.eventId,
          name: data.name,
          logoUrl: data.logoUrl,
          websiteUrl: data.websiteUrl,
          tier: data.tier,
          order: data.order ?? 0,
        })
        .returning();
      
      revalidatePath(`/events/${data.eventId}`);
      return created;
    }
  } catch (error: any) {
    console.error('upsertSponsor Error:', error);
    throw new Error('Failed to save sponsor');
  }
}

/**
 * Delete a sponsor
 */
export async function deleteSponsor(sponsorId: string) {
  try {
    const sponsor = await db.query.sponsors.findFirst({
      where: eq(sponsors.id, sponsorId)
    });

    if (!sponsor) throw new Error('Sponsor not found');
    await validateEventOwnership(sponsor.eventId);

    await db.delete(sponsors).where(eq(sponsors.id, sponsorId));
    revalidatePath(`/events/${sponsor.eventId}`);
    return { success: true };
  } catch (error: any) {
    console.error('deleteSponsor Error:', error);
    throw new Error('Failed to delete sponsor');
  }
}

/**
 * Get all sponsors for an event
 */
export async function getSponsorsForEvent(eventId: string) {
  try {
    return await db
      .select()
      .from(sponsors)
      .where(eq(sponsors.eventId, eventId))
      .orderBy(asc(sponsors.order), desc(sponsors.createdAt));
  } catch (error) {
    console.error('getSponsorsForEvent Error:', error);
    return [];
  }
}
