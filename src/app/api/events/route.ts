import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  doc,
  getDoc,
  Timestamp,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';
import { db, FIRESTORE_COLLECTIONS } from '@/lib/firebase';
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

interface EventFilters {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  free?: boolean;
  organizerId?: string;
}

interface EventResponse {
  id: string;
  title?: string;
  description?: string;
  location?: string | { address?: string };
  date?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/**
 * GET /api/events - List events with filters and pagination
 */
async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const filters: EventFilters = {
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || 'published',
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      free: searchParams.get('free') === 'true',
      organizerId: searchParams.get('organizerId') || undefined,
    };
    
    const pageSize = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor') || null;

    // Build query constraints
    const constraints: QueryConstraint[] = [];
    
    // Filter by status (default: published)
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    // Filter by category
    if (filters.category && filters.category !== 'all') {
      constraints.push(where('category', '==', filters.category));
    }
    
    // Filter by organizer
    if (filters.organizerId) {
      constraints.push(where('organizerId', '==', filters.organizerId));
    }
    
    // Filter by date range
    if (filters.startDate) {
      constraints.push(where('date', '>=', Timestamp.fromDate(new Date(filters.startDate))));
    }
    
    if (filters.endDate) {
      constraints.push(where('date', '<=', Timestamp.fromDate(new Date(filters.endDate))));
    }
    
    // Filter free events
    if (filters.free) {
      constraints.push(where('isFree', '==', true));
    }
    
    // Order by date
    constraints.push(orderBy('date', 'asc'));
    
    // Pagination
    constraints.push(limit(pageSize + 1)); // Fetch one extra to check if there's more
    
    // Apply cursor for pagination
    if (cursor) {
      const cursorDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.EVENTS, cursor));
      if (cursorDoc.exists()) {
        constraints.push(startAfter(cursorDoc));
      }
    }
    
    // Execute query
    const eventsRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS);
    const q = query(eventsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    // Process results
    const events: EventResponse[] = snapshot.docs.slice(0, pageSize).map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        // Convert Timestamps to ISO strings for JSON serialization
        date: data.date?.toDate?.()?.toISOString() || data.date,
        endDate: data.endDate?.toDate?.()?.toISOString() || data.endDate,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });
    
    // Check if there are more results
    const hasMore = snapshot.docs.length > pageSize;
    const nextCursor = hasMore ? snapshot.docs[pageSize - 1].id : null;
    
    // Apply text search filter (client-side for now)
    let filteredEvents = events;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredEvents = events.filter(event => {
        const titleMatch = typeof event.title === 'string' && event.title.toLowerCase().includes(searchLower);
        const descMatch = typeof event.description === 'string' && event.description.toLowerCase().includes(searchLower);
        const locationMatch = typeof event.location === 'string' 
          ? event.location.toLowerCase().includes(searchLower)
          : typeof event.location === 'object' && event.location?.address?.toLowerCase().includes(searchLower);
        return titleMatch || descMatch || locationMatch;
      });
    }

    return NextResponse.json({
      events: filteredEvents,
      pagination: {
        hasMore,
        nextCursor,
        total: filteredEvents.length,
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GET = withRateLimit(handleGet as any, rateLimitConfigs.standard);
