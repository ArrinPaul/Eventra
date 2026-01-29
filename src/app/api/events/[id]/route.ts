import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, FIRESTORE_COLLECTIONS } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/events/[id] - Get single event details
 */
async function handleGet(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const eventRef = doc(db, FIRESTORE_COLLECTIONS.EVENTS, id);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await updateDoc(eventRef, {
      viewCount: increment(1),
    }).catch(() => {
      // Ignore view count errors
    });

    const eventData = eventDoc.data();
    
    // Convert Timestamps to ISO strings
    const event = {
      id: eventDoc.id,
      ...eventData,
      date: eventData.date?.toDate?.()?.toISOString() || eventData.date,
      endDate: eventData.endDate?.toDate?.()?.toISOString() || eventData.endDate,
      createdAt: eventData.createdAt?.toDate?.()?.toISOString() || eventData.createdAt,
      updatedAt: eventData.updatedAt?.toDate?.()?.toISOString() || eventData.updatedAt,
    };

    // Fetch organizer info if organizerId exists
    let organizer = null;
    if (eventData.organizerId) {
      const organizerDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, eventData.organizerId));
      if (organizerDoc.exists()) {
        const organizerData = organizerDoc.data();
        organizer = {
          id: organizerDoc.id,
          name: organizerData.displayName || organizerData.name,
          avatar: organizerData.photoURL || organizerData.avatar,
          organization: organizerData.organization,
        };
      }
    }

    return NextResponse.json({
      event: {
        ...event,
        organizer,
      },
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// For dynamic routes, we need to handle rate limiting differently
// since withRateLimit doesn't support the params argument
export async function GET(req: NextRequest, context: Params) {
  return handleGet(req, context);
}
