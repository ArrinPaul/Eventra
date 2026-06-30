'use server';

import { db } from '@/lib/db';
import { eventMaps, eventMapNodes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { validateEventOwnership } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';

export type MapEdge = { from: string; to: string };

export type MapNodeInput = {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  x: number;
  y: number;
  icon?: string;
  color?: string;
};

export async function getEventMap(eventId: string) {
  try {
    const map = await db.query.eventMaps.findFirst({
      where: eq(eventMaps.eventId, eventId),
      with: { nodes: true },
    });
    return map || null;
  } catch (error) {
    logger.error('Failed to fetch event map', error);
    return null;
  }
}

export async function saveEventMap(eventId: string, data: {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  nodes: MapNodeInput[];
  edges: MapEdge[];
}) {
  try {
    const user = await validateEventOwnership(eventId);

    const existing = await db.query.eventMaps.findFirst({
      where: eq(eventMaps.eventId, eventId),
    });

    let mapId: string;

    if (existing) {
      mapId = existing.id;
      await db.update(eventMaps).set({
        imageUrl: data.imageUrl,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
        edges: data.edges,
        updatedAt: new Date(),
      }).where(eq(eventMaps.id, mapId));

      await db.delete(eventMapNodes).where(eq(eventMapNodes.mapId, mapId));
    } else {
      const [created] = await db.insert(eventMaps).values({
        eventId,
        imageUrl: data.imageUrl,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
        edges: data.edges,
        createdBy: user.id,
      }).returning();
      mapId = created.id;
    }

    if (data.nodes.length > 0) {
      await db.insert(eventMapNodes).values(
        data.nodes.map(node => ({
          mapId,
          name: node.name,
          description: node.description || null,
          category: node.category || 'location',
          x: node.x.toString(),
          y: node.y.toString(),
          icon: node.icon || 'map-pin',
          color: node.color || '#6366f1',
        }))
      );
    }

    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/map`);

    return { success: true, data: { mapId } };
  } catch (error) {
    logger.error('Failed to save event map', error);
    return { success: false, error: 'Failed to save map' };
  }
}

export async function deleteEventMap(eventId: string) {
  try {
    await validateEventOwnership(eventId);

    const existing = await db.query.eventMaps.findFirst({
      where: eq(eventMaps.eventId, eventId),
    });

    if (existing) {
      await db.delete(eventMaps).where(eq(eventMaps.id, existing.id));
    }

    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/map`);

    return { success: true };
  } catch (error) {
    logger.error('Failed to delete event map', error);
    return { success: false, error: 'Failed to delete map' };
  }
}

export async function updateMapNode(nodeId: string, data: {
  x?: number;
  y?: number;
  name?: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
}) {
  try {
    const node = await db.query.eventMapNodes.findFirst({
      where: eq(eventMapNodes.id, nodeId),
    });

    if (!node) return { success: false, error: 'Node not found' };

    const map = await db.query.eventMaps.findFirst({
      where: eq(eventMaps.id, node.mapId),
    });

    if (!map) return { success: false, error: 'Map not found' };

    await validateEventOwnership(map.eventId);

    const updates: Record<string, unknown> = { ...data };
    if (data.x !== undefined) updates.x = data.x.toString();
    if (data.y !== undefined) updates.y = data.y.toString();

    await db.update(eventMapNodes).set(updates).where(eq(eventMapNodes.id, nodeId));

    revalidatePath(`/events/${map.eventId}/map`);

    return { success: true };
  } catch (error) {
    logger.error('Failed to update map node', error);
    return { success: false, error: 'Failed to update node' };
  }
}
