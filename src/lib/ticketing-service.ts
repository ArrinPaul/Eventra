/**
 * Ticketing Service
 * Provides real ticketing functionality with Firestore
 */

import { db, FIRESTORE_COLLECTIONS } from './firebase';
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
import { EventTicketing, TicketType, EventTicket, BookingRequest, DiscountCode, WaitlistEntry } from '@/types';

class TicketingServiceReal {
  /**
   * Get event with ticketing information
   */
  async getEventWithTicketing(eventId: string): Promise<EventTicketing | null> {
    try {
      const eventRef = doc(db, FIRESTORE_COLLECTIONS.EVENTS, eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) return null;
      
      const data = eventDoc.data();
      
      // Get ticket types from subcollection
      const ticketTypesRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS, eventId, 'ticketTypes');
      const ticketTypesSnapshot = await getDocs(ticketTypesRef);
      
      const ticketTypes: TicketType[] = ticketTypesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TicketType));
      
      // Get sold tickets count
      const ticketsRef = collection(db, 'tickets');
      const soldQuery = query(
        ticketsRef,
        where('eventId', '==', eventId),
        where('status', '==', 'confirmed')
      );
      const soldSnapshot = await getDocs(soldQuery);
      const soldTickets = soldSnapshot.docs.length;
      
      // Get waitlist entries
      const waitlistRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS, eventId, 'waitlist');
      const waitlistSnapshot = await getDocs(waitlistRef);
      const waitlistEntries: WaitlistEntry[] = waitlistSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WaitlistEntry));
      
      // Get discount codes
      const discountCodesRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS, eventId, 'discountCodes');
      const discountSnapshot = await getDocs(discountCodesRef);
      const discountCodes: DiscountCode[] = discountSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validFrom: doc.data().validFrom?.toDate?.() || new Date(doc.data().validFrom),
        validTo: doc.data().validTo?.toDate?.() || new Date(doc.data().validTo)
      } as DiscountCode));
      
      return {
        id: eventId,
        title: data.title,
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
          availableTickets: data.capacity - soldTickets,
          soldTickets
        },
        ticketTypes,
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
        waitlistEntries,
        discountCodes,
        ticketingAnalytics: {
          totalRevenue: data.totalRevenue || 0,
          ticketsSold: soldTickets,
          conversionRate: data.viewCount > 0 ? (soldTickets / data.viewCount * 100) : 0,
          refundRequests: data.refundRequests || 0,
          checkInRate: soldTickets > 0 ? ((data.checkIns || 0) / soldTickets * 100) : 0,
          popularTicketTypes: [],
          salesOverTime: [],
          demographics: { ageGroups: [], roles: [], companies: [] }
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
  async getTicketableEvents(): Promise<EventTicketing[]> {
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
      const events: EventTicketing[] = [];
      
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
  async purchaseTickets(bookingRequest: BookingRequest): Promise<EventTicket[]> {
    try {
      const tickets: EventTicket[] = [];
      
      await runTransaction(db, async (transaction) => {
        const eventRef = doc(db, FIRESTORE_COLLECTIONS.EVENTS, bookingRequest.eventId);
        const eventDoc = await transaction.get(eventRef);
        
        if (!eventDoc.exists()) {
          throw new Error('Event not found');
        }
        
        const eventData = eventDoc.data();
        const availableTickets = (eventData.capacity || 100) - (eventData.soldTickets || 0);
        
        if (bookingRequest.ticketTypes.reduce((sum, t) => sum + t.quantity, 0) > availableTickets) {
          throw new Error('Not enough tickets available');
        }
        
        // Create tickets
        for (const ticketRequest of bookingRequest.ticketTypes) {
          for (let i = 0; i < ticketRequest.quantity; i++) {
            const ticketRef = doc(collection(db, 'tickets'));
            const ticket: EventTicket = {
              id: ticketRef.id,
              eventId: bookingRequest.eventId,
              userId: bookingRequest.userId,
              ticketTypeId: ticketRequest.ticketTypeId,
              purchaseDate: new Date(),
              price: ticketRequest.price,
              currency: 'USD',
              status: 'confirmed',
              qrCode: `EVT-${bookingRequest.eventId}-${ticketRef.id}`,
              checkInStatus: 'not_checked_in',
              isTransferable: true
            };
            
            transaction.set(ticketRef, {
              ...ticket,
              purchaseDate: serverTimestamp()
            });
            
            tickets.push(ticket);
          }
        }
        
        // Update event sold tickets count
        const totalTickets = bookingRequest.ticketTypes.reduce((sum, t) => sum + t.quantity, 0);
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
  async getUserTickets(userId: string): Promise<EventTicket[]> {
    try {
      const ticketsRef = collection(db, 'tickets');
      const q = query(
        ticketsRef,
        where('userId', '==', userId),
        orderBy('purchaseDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          eventId: data.eventId,
          userId: data.userId,
          ticketTypeId: data.ticketTypeId,
          purchaseDate: data.purchaseDate?.toDate?.() || new Date(data.purchaseDate),
          price: data.price,
          currency: data.currency || 'USD',
          status: data.status,
          qrCode: data.qrCode,
          checkInStatus: data.checkInStatus || 'not_checked_in',
          checkInTime: data.checkInTime?.toDate?.(),
          isTransferable: data.isTransferable ?? true
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
  async joinWaitlist(eventId: string, userId: string): Promise<WaitlistEntry> {
    try {
      const waitlistRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS, eventId, 'waitlist');
      
      // Check if already on waitlist
      const existingQuery = query(waitlistRef, where('userId', '==', userId));
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        const existing = existingSnapshot.docs[0];
        return {
          id: existing.id,
          ...existing.data()
        } as WaitlistEntry;
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
  async validateDiscountCode(code: string, eventId: string): Promise<DiscountCode | null> {
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
