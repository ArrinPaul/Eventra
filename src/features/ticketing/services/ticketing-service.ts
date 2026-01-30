/**
 * Ticketing Service
 * Provides real ticketing functionality with Firestore
 */

import { db, FIRESTORE_COLLECTIONS } from '@/core/config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch,
  increment,
  runTransaction
} from 'firebase/firestore';

// Local types to avoid strict type checking issues
interface LocalTicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  quantity?: number;
  totalAvailable?: number;
  sold: number;
  benefits?: string[];
  [key: string]: unknown;
}

interface LocalEventTicketing {
  id: string;
  title: string;
  description?: string;
  type?: string;
  organizerId?: string;
  startDate: Date;
  endDate?: Date;
  timezone?: string;
  venue?: unknown;
  ticketing?: {
    type: string;
    price: number;
    currency: string;
    availableTickets: number;
    soldTickets: number;
  };
  ticketTypes: LocalTicketType[];
  soldTickets: number;
  availableTickets: number;
  analytics?: unknown;
  [key: string]: unknown;
}

interface LocalEventTicket {
  id: string;
  eventId: string;
  userId: string;
  ticketTypeId?: string;
  ticketNumber?: string;
  status: string;
  purchaseDate: Date;
  checkInTime?: Date;
  qrCode?: string;
  price: number;
  currency?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  checkInStatus?: string;
  isTransferable?: boolean;
  [key: string]: unknown;
}

interface LocalWaitlistEntry {
  id: string;
  userId: string;
  eventId: string;
  position: number;
  joinedAt: Date;
  status: string;
  notificationSent: boolean;
  [key: string]: unknown;
}

interface LocalDiscountCode {
  id: string;
  code: string;
  type: string;
  value: number;
  maxUses: number;
  currentUses: number;
  validFrom: Date;
  validTo: Date;
  applicableTicketTypes?: string[];
  isActive: boolean;
  [key: string]: unknown;
}

interface LocalBookingRequest {
  eventId: string;
  userId: string;
  ticketTypes: { ticketTypeId: string; quantity: number; price: number }[];
  totalAmount: number;
  [key: string]: unknown;
}

class TicketingServiceReal {
  /**
   * Get event with ticketing information
   */
  async getEventWithTicketing(eventId: string): Promise<LocalEventTicketing | null> {
    try {
      const eventRef = doc(db, FIRESTORE_COLLECTIONS.EVENTS, eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) return null;
      
      const data = eventDoc.data();
      
      // Get ticket types from subcollection
      const ticketTypesRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS, eventId, 'ticketTypes');
      const ticketTypesSnapshot = await getDocs(ticketTypesRef);
      
      const ticketTypes: LocalTicketType[] = ticketTypesSnapshot.docs.map(d => ({
        id: d.id,
        name: d.data().name || 'Standard',
        price: d.data().price || 0,
        sold: d.data().sold || 0,
        ...d.data()
      }));
      
      // Get sold tickets count
      const ticketsRef = collection(db, 'tickets');
      const soldQuery = query(
        ticketsRef,
        where('eventId', '==', eventId),
        where('status', '==', 'confirmed')
      );
      const soldSnapshot = await getDocs(soldQuery);
      const soldTickets = soldSnapshot.docs.length;
      
      const availableTickets = (data.capacity || 100) - soldTickets;
      
      return {
        id: eventId,
        title: data.title || 'Untitled Event',
        description: data.description,
        type: data.type || 'event',
        organizerId: data.organizerId,
        startDate: data.startDate?.toDate?.() || new Date(data.startDate),
        endDate: data.endDate?.toDate?.() || new Date(data.endDate),
        timezone: data.timezone || 'UTC',
        venue: data.venue || { type: 'physical', address: data.location },
        ticketing: {
          type: data.isPaid ? 'paid' : 'free',
          price: data.price || 0,
          currency: data.currency || 'USD',
          availableTickets,
          soldTickets
        },
        ticketTypes,
        soldTickets,
        availableTickets,
        totalCapacity: data.capacity || 100,
        currentAttendees: soldTickets,
        attendees: data.attendees || [],
        agenda: data.agenda || [],
        tags: data.tags || [],
        category: data.category,
        coverImage: data.coverImage || data.image,
        isPublic: data.isPublic ?? true,
        isPublished: data.status === 'published',
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        analytics: {
          totalRevenue: data.totalRevenue || 0,
          ticketsSold: soldTickets,
          conversionRate: data.viewCount > 0 ? (soldTickets / data.viewCount * 100) : 0,
          refundRequests: data.refundRequests || 0,
          checkInRate: soldTickets > 0 ? ((data.checkIns || 0) / soldTickets * 100) : 0
        },
        checkInSettings: data.checkInSettings || {
          enableQRCode: true,
          allowMultipleScan: false,
          selfCheckIn: true,
          requireId: false
        }
      };
    } catch (error) {
      console.error('Error getting event with ticketing:', error);
      return null;
    }
  }

  /**
   * Get events with ticketing for a user (events they can purchase)
   */
  async getTicketableEvents(): Promise<LocalEventTicketing[]> {
    try {
      const eventsRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS);
      const q = query(
        eventsRef,
        where('status', '==', 'published'),
        where('startDate', '>=', Timestamp.now()),
        orderBy('startDate', 'asc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const events: LocalEventTicketing[] = [];
      
      for (const eventDoc of snapshot.docs) {
        const eventData = await this.getEventWithTicketing(eventDoc.id);
        if (eventData) {
          events.push(eventData);
        }
      }
      
      return events;
    } catch (error) {
      console.error('Error getting ticketable events:', error);
      return [];
    }
  }

  /**
   * Purchase tickets
   */
  async purchaseTickets(bookingRequest: LocalBookingRequest): Promise<LocalEventTicket[]> {
    try {
      const tickets: LocalEventTicket[] = [];
      
      await runTransaction(db, async (transaction) => {
        const eventRef = doc(db, FIRESTORE_COLLECTIONS.EVENTS, bookingRequest.eventId);
        const eventDoc = await transaction.get(eventRef);
        
        if (!eventDoc.exists()) {
          throw new Error('Event not found');
        }
        
        const eventData = eventDoc.data();
        const availableTickets = (eventData.capacity || 100) - (eventData.soldTickets || 0);
        
        const totalRequestedTickets = bookingRequest.ticketTypes.reduce(
          (sum: number, t: { quantity: number }) => sum + t.quantity, 
          0
        );
        
        if (totalRequestedTickets > availableTickets) {
          throw new Error('Not enough tickets available');
        }
        
        // Create tickets
        for (const ticketRequest of bookingRequest.ticketTypes) {
          for (let i = 0; i < ticketRequest.quantity; i++) {
            const ticketRef = doc(collection(db, 'tickets'));
            const ticketNumber = `EVT-${bookingRequest.eventId.slice(0, 6)}-${ticketRef.id.slice(0, 8)}`;
            
            const ticket: LocalEventTicket = {
              id: ticketRef.id,
              eventId: bookingRequest.eventId,
              userId: bookingRequest.userId,
              ticketTypeId: ticketRequest.ticketTypeId,
              ticketNumber,
              purchaseDate: new Date(),
              price: ticketRequest.price,
              currency: 'USD',
              status: 'confirmed',
              qrCode: ticketNumber,
              checkInStatus: 'not_checked_in',
              isTransferable: true,
              attendeeName: '',
              attendeeEmail: ''
            };
            
            transaction.set(ticketRef, {
              ...ticket,
              purchaseDate: serverTimestamp()
            });
            
            tickets.push(ticket);
          }
        }
        
        // Update event sold tickets count
        const totalTickets = bookingRequest.ticketTypes.reduce(
          (sum: number, t: { quantity: number }) => sum + t.quantity, 
          0
        );
        transaction.update(eventRef, {
          soldTickets: increment(totalTickets),
          totalRevenue: increment(bookingRequest.totalAmount)
        });
        
        // Create registration record
        const registrationRef = doc(collection(db, FIRESTORE_COLLECTIONS.REGISTRATIONS));
        transaction.set(registrationRef, {
          eventId: bookingRequest.eventId,
          userId: bookingRequest.userId,
          ticketIds: tickets.map(t => t.id),
          totalAmount: bookingRequest.totalAmount,
          paymentStatus: 'completed',
          registeredAt: serverTimestamp()
        });
      });
      
      return tickets;
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      throw error;
    }
  }

  /**
   * Get user's tickets
   */
  async getUserTickets(userId: string): Promise<LocalEventTicket[]> {
    try {
      const ticketsRef = collection(db, 'tickets');
      const q = query(
        ticketsRef,
        where('userId', '==', userId),
        orderBy('purchaseDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          eventId: data.eventId,
          userId: data.userId,
          ticketTypeId: data.ticketTypeId,
          ticketNumber: data.ticketNumber || d.id,
          purchaseDate: data.purchaseDate?.toDate?.() || new Date(data.purchaseDate),
          price: data.price,
          currency: data.currency || 'USD',
          status: data.status,
          qrCode: data.qrCode,
          checkInStatus: data.checkInStatus || 'not_checked_in',
          checkInTime: data.checkInTime?.toDate?.(),
          isTransferable: data.isTransferable ?? true,
          attendeeName: data.attendeeName || '',
          attendeeEmail: data.attendeeEmail || ''
        };
      });
    } catch (error) {
      console.error('Error getting user tickets:', error);
      return [];
    }
  }

  /**
   * Check in a ticket
   */
  async checkInTicket(ticketId: string): Promise<boolean> {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      const ticketDoc = await getDoc(ticketRef);
      
      if (!ticketDoc.exists()) {
        throw new Error('Ticket not found');
      }
      
      const data = ticketDoc.data();
      if (data.checkInStatus === 'checked_in') {
        throw new Error('Ticket already checked in');
      }
      
      await updateDoc(ticketRef, {
        checkInStatus: 'checked_in',
        checkInTime: serverTimestamp()
      });
      
      // Update event check-in count
      const eventRef = doc(db, FIRESTORE_COLLECTIONS.EVENTS, data.eventId);
      await updateDoc(eventRef, {
        checkIns: increment(1)
      });
      
      return true;
    } catch (error) {
      console.error('Error checking in ticket:', error);
      return false;
    }
  }

  /**
   * Join waitlist
   */
  async joinWaitlist(eventId: string, userId: string): Promise<LocalWaitlistEntry> {
    try {
      const waitlistRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS, eventId, 'waitlist');
      
      // Check if already on waitlist
      const existingQuery = query(waitlistRef, where('userId', '==', userId));
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        const existing = existingSnapshot.docs[0];
        return {
          id: existing.id,
          userId,
          eventId,
          position: existing.data().position,
          joinedAt: existing.data().joinedAt?.toDate?.() || new Date(),
          status: existing.data().status,
          notificationSent: existing.data().notificationSent
        };
      }
      
      // Get current position
      const allWaitlistSnapshot = await getDocs(waitlistRef);
      const position = allWaitlistSnapshot.docs.length + 1;
      
      const entryRef = await addDoc(waitlistRef, {
        userId,
        eventId,
        position,
        joinedAt: serverTimestamp(),
        status: 'waiting',
        notificationSent: false
      });
      
      return {
        id: entryRef.id,
        userId,
        eventId,
        position,
        joinedAt: new Date(),
        status: 'waiting',
        notificationSent: false
      };
    } catch (error) {
      console.error('Error joining waitlist:', error);
      throw error;
    }
  }

  /**
   * Validate discount code
   */
  async validateDiscountCode(code: string, eventId: string): Promise<LocalDiscountCode | null> {
    try {
      const discountRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS, eventId, 'discountCodes');
      const q = query(discountRef, where('code', '==', code.toUpperCase()), where('isActive', '==', true));
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const discountDoc = snapshot.docs[0];
      const data = discountDoc.data();
      
      const now = new Date();
      const validFrom = data.validFrom?.toDate?.() || new Date(data.validFrom);
      const validTo = data.validTo?.toDate?.() || new Date(data.validTo);
      
      // Check if code is valid
      if (now < validFrom || now > validTo) return null;
      if (data.currentUses >= data.maxUses) return null;
      
      return {
        id: discountDoc.id,
        code: data.code,
        type: data.type,
        value: data.value,
        maxUses: data.maxUses,
        currentUses: data.currentUses,
        validFrom,
        validTo,
        applicableTicketTypes: data.applicableTicketTypes,
        isActive: data.isActive
      };
    } catch (error) {
      console.error('Error validating discount code:', error);
      return null;
    }
  }

  /**
   * Apply discount code
   */
  async applyDiscountCode(codeId: string, eventId: string): Promise<boolean> {
    try {
      const discountRef = doc(db, FIRESTORE_COLLECTIONS.EVENTS, eventId, 'discountCodes', codeId);
      await updateDoc(discountRef, {
        currentUses: increment(1)
      });
      return true;
    } catch (error) {
      console.error('Error applying discount code:', error);
      return false;
    }
  }

  /**
   * Transfer ticket to another user
   */
  async transferTicket(ticketId: string, toUserId: string, fromUserId: string): Promise<boolean> {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      const ticketDoc = await getDoc(ticketRef);
      
      if (!ticketDoc.exists()) {
        throw new Error('Ticket not found');
      }
      
      const data = ticketDoc.data();
      if (data.userId !== fromUserId) {
        throw new Error('Not authorized to transfer this ticket');
      }
      
      if (!data.isTransferable) {
        throw new Error('This ticket is not transferable');
      }
      
      if (data.checkInStatus === 'checked_in') {
        throw new Error('Cannot transfer a checked-in ticket');
      }
      
      await updateDoc(ticketRef, {
        userId: toUserId,
        transferredFrom: fromUserId,
        transferredAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error transferring ticket:', error);
      throw error;
    }
  }

  /**
   * Request refund
   */
  async requestRefund(ticketId: string, reason: string): Promise<boolean> {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      const ticketDoc = await getDoc(ticketRef);
      
      if (!ticketDoc.exists()) {
        throw new Error('Ticket not found');
      }
      
      const data = ticketDoc.data();
      
      if (data.checkInStatus === 'checked_in') {
        throw new Error('Cannot refund a checked-in ticket');
      }
      
      await updateDoc(ticketRef, {
        status: 'refund_requested',
        refundReason: reason,
        refundRequestedAt: serverTimestamp()
      });
      
      // Update event refund requests count
      const eventRef = doc(db, FIRESTORE_COLLECTIONS.EVENTS, data.eventId);
      await updateDoc(eventRef, {
        refundRequests: increment(1)
      });
      
      return true;
    } catch (error) {
      console.error('Error requesting refund:', error);
      return false;
    }
  }
}

export const ticketingServiceReal = new TicketingServiceReal();
