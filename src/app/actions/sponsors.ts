'use server';

import { db } from '@/lib/db';
import { sponsors, sponsorLeads, users } from '@/lib/db/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import { validateEventOwnership } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

/**
 * Record a lead (sponsor scanning an attendee)
 */
export async function recordSponsorLead(data: {
  sponsorId: string;
  userId: string;
  notes?: string;
}) {
  try {
    const [lead] = await db
      .insert(sponsorLeads)
      .values({
        sponsorId: data.sponsorId,
        userId: data.userId,
        notes: data.notes,
      })
      .onConflictDoUpdate({
        target: [sponsorLeads.sponsorId, sponsorLeads.userId],
        set: {
          notes: data.notes,
          scannedAt: new Date(),
        }
      })
      .returning();
    
    return { success: true, lead };
  } catch (error) {
    console.error('recordSponsorLead Error:', error);
    return { success: false, error: 'Failed to record lead' };
  }
}

/**
 * Get leads for a sponsor
 */
export async function getSponsorLeads(sponsorId: string) {
  try {
    const results = await db
      .select({
        id: sponsorLeads.id,
        notes: sponsorLeads.notes,
        scannedAt: sponsorLeads.scannedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        }
      })
      .from(sponsorLeads)
      .innerJoin(users, eq(sponsorLeads.userId, users.id))
      .where(eq(sponsorLeads.sponsorId, sponsorId))
      .orderBy(desc(sponsorLeads.scannedAt));

    return results;
  } catch (error) {
    console.error('getSponsorLeads Error:', error);
    return [];
  }
}

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
      return { success: true, sponsor: updated, error: null as string | null };
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
      return { success: true, sponsor: created, error: null as string | null };
    }
  } catch (error) {
    console.error('upsertSponsor Error:', error);
    return { success: false, sponsor: null, error: 'Failed to save sponsor' };
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

    if (!sponsor) return { success: false, error: 'Sponsor not found' };
    await validateEventOwnership(sponsor.eventId);

    await db.delete(sponsors).where(eq(sponsors.id, sponsorId));
    revalidatePath(`/events/${sponsor.eventId}`);
    return { success: true, error: null as string | null };
  } catch (error) {
    console.error('deleteSponsor Error:', error);
    return { success: false, error: 'Failed to delete sponsor' };
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
