// Firestore service utilities for the new modules
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  setDoc,
  runTransaction,
  increment,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';
import { emailService } from './email-service';
import {
  Community,
  Post,
  Comment,
  ChatRoom,
  ChatMessage,
  FeedPost,
  Event,
  RecurringGroup,
  Match,
  UserProfile,
  ConnectionRequest,
  Badge,
  UserXP,
  EventReplay,
  AnonymousFeedback,
  EventTicket,
  TicketType,
  EventTicketing,
  WaitlistEntry,
  DiscountCode,
  BookingRequest,
  GroupCalendarEvent,
  GroupAttendee,
  GroupSurvey,
  SurveyResponse,
  GroupDiscussion,
  GroupResource,
  Achievement,
  UserAchievement,
  Streak,
  Challenge,
  UserTitle,
  FeedbackWall,
  WallFeedback
} from '@/types';

// Community & Discussion Services
export const communityService = {
  async getCommunities(): Promise<Community[]> {
    try {
      const snapshot = await getDocs(collection(db, 'communities'));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Community));
    } catch (error) {
      console.error('Error fetching communities:', error);
      return [];
    }
  },

  async createCommunity(community: Omit<Community, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'communities'), community);
      return docRef.id;
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  },

  async getPosts(communityId: string): Promise<Post[]> {
    try {
      const q = query(
        collection(db, 'posts'),
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  },

  async createPost(post: Omit<Post, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'posts'), post);
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  async voteOnPost(postId: string, userId: string, vote: 'up' | 'down'): Promise<void> {
    try {
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const post = postDoc.data() as Post;
        const votedBy = post.votedBy || {};
        const previousVote = votedBy[userId];

        // Remove previous vote counts
        let upvotes = post.upvotes || 0;
        let downvotes = post.downvotes || 0;

        if (previousVote === 'up') {
          upvotes = Math.max(0, upvotes - 1);
        } else if (previousVote === 'down') {
          downvotes = Math.max(0, downvotes - 1);
        }

        // Add new vote
        if (vote === 'up') {
          upvotes++;
        } else {
          downvotes++;
        }

        votedBy[userId] = vote;

        await updateDoc(postRef, {
          upvotes,
          downvotes,
          votedBy
        });
      }
    } catch (error) {
      console.error('Error voting on post:', error);
      throw error;
    }
  },

  async getComments(postId: string): Promise<Comment[]> {
    try {
      const q = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Comment));
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  },

  async createComment(comment: Omit<Comment, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'comments'), comment);
      return docRef.id;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }
};

// Chat Service
export const chatService = {
  async getChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const q = query(
        collection(db, 'chatRooms'),
        where('participants', 'array-contains', userId),
        orderBy('lastActivity', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ChatRoom));
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      return [];
    }
  },

  // Real-time subscription for chat rooms
  subscribeToChatRooms(
    userId: string, 
    callback: (rooms: ChatRoom[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', userId),
      orderBy('lastActivity', 'desc')
    );
    
    return onSnapshot(
      q,
      (snapshot) => {
        const rooms = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        } as ChatRoom));
        callback(rooms);
      },
      (error) => {
        console.error('Error in chat rooms subscription:', error);
        onError?.(error);
      }
    );
  },

  async createChatRoom(chatRoom: Omit<ChatRoom, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'chatRooms'), chatRoom);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  },

  async getMessages(chatRoomId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, 'messages'),
        where('chatRoomId', '==', chatRoomId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  // Real-time subscription for messages
  subscribeToMessages(
    chatRoomId: string,
    callback: (messages: ChatMessage[]) => void,
    onError?: (error: Error) => void,
    messageLimit: number = 100
  ): Unsubscribe {
    const q = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoomId),
      orderBy('createdAt', 'asc'),
      firestoreLimit(messageLimit)
    );
    
    return onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate() 
              : data.createdAt,
          } as ChatMessage;
        });
        callback(messages);
      },
      (error) => {
        console.error('Error in messages subscription:', error);
        onError?.(error);
      }
    );
  },

  async sendMessage(message: Omit<ChatMessage, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        ...message,
        createdAt: serverTimestamp(),
      });
      
      // Update chat room's last message and activity
      if (message.chatRoomId) {
        await updateDoc(doc(db, 'chatRooms', message.chatRoomId), {
          lastMessage: message,
          lastActivity: serverTimestamp()
        });
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Add reaction to message
  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const data = messageDoc.data();
        const reactions = data.reactions || {};
        
        if (!reactions[emoji]) {
          reactions[emoji] = [];
        }
        
        if (!reactions[emoji].includes(userId)) {
          reactions[emoji].push(userId);
        }
        
        await updateDoc(messageRef, { reactions });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  },

  // Remove reaction from message
  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const data = messageDoc.data();
        const reactions = data.reactions || {};
        
        if (reactions[emoji]) {
          reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        }
        
        await updateDoc(messageRef, { reactions });
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  },

  // Delete message (soft delete)
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        isDeleted: true,
        content: '[Message deleted]',
        deletedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
};

// Feed Service
export const feedService = {
  async getFeedPosts(limit: number = 20): Promise<FeedPost[]> {
    try {
      const q = query(
        collection(db, 'feedPosts'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (new Date(data.createdAt || Date.now())),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (new Date(data.updatedAt || Date.now())),
        } as FeedPost;
      });
    } catch (error) {
      console.error('Error fetching feed posts:', error);
      return [];
    }
  },

  async createFeedPost(post: Omit<FeedPost, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'feedPosts'), post);
      return docRef.id;
    } catch (error) {
      console.error('Error creating feed post:', error);
      throw error;
    }
  },

  async likePost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(db, 'feedPosts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const post = postDoc.data() as FeedPost;
        const likedBy = post.likedBy || [];
        
        if (likedBy.includes(userId)) {
          // Unlike
          await updateDoc(postRef, {
            likes: Math.max(0, post.likes - 1),
            likedBy: likedBy.filter((id: string) => id !== userId)
          });
        } else {
          // Like
          await updateDoc(postRef, {
            likes: post.likes + 1,
            likedBy: [...likedBy, userId]
          });
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  async deleteFeedPost(postId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'feedPosts', postId));
    } catch (error) {
      console.error('Error deleting feed post:', error);
      throw error;
    }
  }
};

// Event Service
export const eventService = {
  async getEvents(): Promise<Event[]> {
    try {
      const q = query(
        collection(db, 'events'),
        // where('status', '==', 'published'), // Temporarily disabled to see all
        orderBy('startDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  async getEventById(eventId: string): Promise<Event | null> {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        return { id: eventDoc.id, ...eventDoc.data() } as Event;
      }
      return null;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  },

  async createEvent(event: Omit<Event, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'events'), event);
      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    try {
      await updateDoc(doc(db, 'events', eventId), updates);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  async registerForEvent(eventId: string, userId: string): Promise<void> {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const event = eventDoc.data() as Event;
        const currentAttendees = (event as any).attendees || [];
        
        if (!currentAttendees.includes(userId)) {
          const updates: any = {
            attendees: [...currentAttendees, userId],
            registeredCount: (event.registeredCount || 0) + 1
          };
          
          if (event.pricing) {
             updates['ticketing.soldTickets'] = (event as any).ticketing?.soldTickets ? (event as any).ticketing.soldTickets + 1 : 1;
          }

          await updateDoc(eventRef, updates);
        }
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  }
};

// Ticket Service
export const ticketService = {
  // Generate a unique ticket number
  generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EVT-${timestamp}-${random}`;
  },

  // Create a new ticket
  async createTicket(ticketData: Omit<EventTicket, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'tickets'), {
        ...ticketData,
        createdAt: new Date(),
        status: ticketData.status || 'confirmed'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  // Get ticket by ID
  async getTicketById(ticketId: string): Promise<EventTicket | null> {
    try {
      const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
      if (ticketDoc.exists()) {
        return { id: ticketDoc.id, ...ticketDoc.data() } as EventTicket;
      }
      return null;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return null;
    }
  },

  // Get ticket by ticket number (for QR scanning)
  async getTicketByNumber(ticketNumber: string): Promise<EventTicket | null> {
    try {
      const q = query(
        collection(db, 'tickets'),
        where('ticketNumber', '==', ticketNumber)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as EventTicket;
      }
      return null;
    } catch (error) {
      console.error('Error fetching ticket by number:', error);
      return null;
    }
  },

  // Get all tickets for a user
  async getUserTickets(userId: string): Promise<EventTicket[]> {
    try {
      const q = query(
        collection(db, 'tickets'),
        where('userId', '==', userId),
        orderBy('purchaseDate', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventTicket));
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
  },

  // Get all tickets for an event
  async getEventTickets(eventId: string): Promise<EventTicket[]> {
    try {
      const q = query(
        collection(db, 'tickets'),
        where('eventId', '==', eventId),
        orderBy('purchaseDate', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventTicket));
    } catch (error) {
      console.error('Error fetching event tickets:', error);
      return [];
    }
  },

  // Check in a ticket
  async checkInTicket(ticketId: string): Promise<boolean> {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      const ticketDoc = await getDoc(ticketRef);
      
      if (!ticketDoc.exists()) {
        throw new Error('Ticket not found');
      }

      const ticket = ticketDoc.data() as EventTicket;
      
      if (ticket.status === 'checked-in') {
        throw new Error('Ticket already checked in');
      }

      if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
        throw new Error('Ticket is not valid');
      }

      await updateDoc(ticketRef, {
        status: 'checked-in',
        checkInTime: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error checking in ticket:', error);
      throw error;
    }
  },

  // Cancel a ticket
  async cancelTicket(ticketId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: 'cancelled',
        cancelledAt: new Date()
      });
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      throw error;
    }
  },

  // Full registration flow with transaction
  async registerForEvent(
    eventId: string, 
    userId: string, 
    userDetails: { name: string; email: string },
    ticketTypeId?: string,
    customFields?: Record<string, any>
  ): Promise<EventTicket> {
    try {
      const eventRef = doc(db, 'events', eventId);
      
      // Use a transaction to ensure atomic updates
      const result = await runTransaction(db, async (transaction) => {
        // Get event details within transaction
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) {
          throw new Error('Event not found');
        }
        
        const event = eventDoc.data() as Event;
        
        // Check capacity
        const currentCount = event.registeredCount || 0;
        if (event.capacity && currentCount >= event.capacity) {
          throw new Error('Event is at full capacity');
        }

        // Check if already registered (need to do this outside transaction for query)
        const existingTicketQuery = query(
          collection(db, 'tickets'),
          where('eventId', '==', eventId),
          where('userId', '==', userId),
          where('status', 'in', ['confirmed', 'pending'])
        );
        const existingTickets = await getDocs(existingTicketQuery);
        if (!existingTickets.empty) {
          throw new Error('Already registered for this event');
        }

        // Determine price
        let price = 0;
        let currency = 'USD';
        if (event.pricing && event.pricing.type !== 'free' && !event.pricing.isFree) {
          price = event.pricing.basePrice || 0;
          if (ticketTypeId && (event as any).ticketTypes) {
            const ticketType = (event as any).ticketTypes.find((t: any) => t.id === ticketTypeId);
            if (ticketType) {
              price = ticketType.price || price;
            }
          }
        }

        // Generate ticket
        const ticketNumber = this.generateTicketNumber();
        const ticketRef = doc(collection(db, 'tickets'));
        const ticketData: Omit<EventTicket, 'id'> = {
          eventId,
          userId,
          ticketTypeId,
          ticketNumber,
          status: 'confirmed',
          purchaseDate: new Date(),
          price,
          currency,
          attendeeName: userDetails.name,
          attendeeEmail: userDetails.email,
          customFields,
          event: {
            title: event.title,
            date: event.startDate || new Date(),
            location: typeof event.location === 'string' 
              ? event.location 
              : event.location?.venue?.name || 'TBD',
            image: event.imageUrl || event.image
          }
        };

        // Atomically create ticket and update counts
        transaction.set(ticketRef, {
          ...ticketData,
          purchaseDate: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        
        // Update event registration count
        transaction.update(eventRef, {
          registeredCount: increment(1),
          updatedAt: serverTimestamp()
        });
        
        // Add user to event attendees subcollection
        const attendeeRef = doc(db, 'events', eventId, 'attendees', userId);
        transaction.set(attendeeRef, {
          userId,
          name: userDetails.name,
          email: userDetails.email,
          registeredAt: serverTimestamp(),
          ticketId: ticketRef.id
        });

        return { ticketId: ticketRef.id, ticketData, event };
      });

      const finalTicket = { id: result.ticketId, ...result.ticketData } as EventTicket;

      // Send confirmation email (async, don't block on failure)
      emailService.sendRegistrationConfirmation(finalTicket, result.event).catch(err => {
        console.error('Failed to send confirmation email:', err);
      });

      return finalTicket;
    } catch (error) {
      console.error('Error in registration flow:', error);
      throw error;
    }
  }
};

// Matching Service
export const matchingService = {
  async getUserMatches(userId: string): Promise<Match[]> {
    try {
      const q1 = query(
        collection(db, 'matches'),
        where('user1Id', '==', userId),
        where('status', '==', 'potential')
      );
      const snapshot1 = await getDocs(q1);
      
      const q2 = query(
        collection(db, 'matches'),
        where('user2Id', '==', userId),
        where('status', '==', 'potential')
      );
      const snapshot2 = await getDocs(q2);
      
      const matches1 = snapshot1.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Match));
      const matches2 = snapshot2.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Match));
      
      return [...matches1, ...matches2];
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  },

  async swipeUser(matchId: string, userId: string, action: 'like' | 'pass'): Promise<boolean> {
    try {
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);
      
      if (matchDoc.exists()) {
        const match = matchDoc.data() as Match;
        
        if (action === 'like') {
          await updateDoc(matchRef, { status: 'liked', likedAt: new Date() });
          
          // Check if it's a mutual match
          const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
          const q = query(
            collection(db, 'matches'),
            where('user1Id', '==', otherUserId),
            where('user2Id', '==', userId),
            where('status', '==', 'liked')
          );
          const otherMatches = await getDocs(q);
          
          if (!otherMatches.empty) {
            // It's a match!
            await updateDoc(matchRef, { status: 'matched', matchedAt: new Date() });
            return true;
          }
        } else {
          await updateDoc(matchRef, { status: 'passed' });
        }
      }
      return false;
    } catch (error) {
      console.error('Error swiping user:', error);
      throw error;
    }
  }
};

// User Profile Service
export const userProfileService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const d = await getDoc(doc(db, 'userProfiles', userId));
      return d.exists() ? { id: d.id, ...d.data() } as UserProfile : null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  async getAllUserProfiles(limit: number = 50): Promise<UserProfile[]> {
    try {
      const q = query(collection(db, 'userProfiles'), firestoreLimit(limit));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    } catch (error) {
      console.error('Error fetching all user profiles:', error);
      return [];
    }
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'userProfiles', userId), updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async sendConnectionRequest(fromUserId: string, toUserId: string, message?: string): Promise<string> {
    try {
      const request: Omit<ConnectionRequest, 'id'> = {
        fromUserId,
        toUserId,
        message: message || '',
        status: 'pending',
        createdAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'connectionRequests'), request);
      return docRef.id;
    } catch (error) {
      console.error('Error sending connection request:', error);
      throw error;
    }
  },

  async getConnectionRequests(userId: string): Promise<ConnectionRequest[]> {
    try {
      const q = query(
        collection(db, 'connectionRequests'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConnectionRequest));
    } catch (error) {
      console.error('Error fetching connection requests:', error);
      return [];
    }
  },

  async respondToConnectionRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<void> {
    try {
      await updateDoc(doc(db, 'connectionRequests', requestId), { status });
    } catch (error) {
      console.error('Error responding to connection request:', error);
      throw error;
    }
  }
};

// XP and Gamification Service
export const gamificationService = {
  async getUserXP(userId: string): Promise<UserXP | null> {
    try {
      const d = await getDoc(doc(db, 'userXP', userId));
      return d.exists() ? d.data() as UserXP : null;
    } catch (error) {
      console.error('Error fetching user XP:', error);
      return null;
    }
  },

  async awardXP(userId: string, amount: number, reason: string, category: string): Promise<void> {
    try {
      const userXPRef = doc(db, 'userXP', userId);
      const userXPDoc = await getDoc(userXPRef);
      
      if (userXPDoc.exists()) {
        const userXP = userXPDoc.data() as UserXP;
        const newTotalXP = (userXP.xp || 0) + amount;
        
        await updateDoc(userXPRef, {
          xp: newTotalXP,
        });
      } else {
        const newUserXP: UserXP = {
          userId,
          xp: amount
        };
        await setDoc(userXPRef, newUserXP);
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
      throw error;
    }
  },
  // ... other gamification methods (mocked in previous file, assuming they were)
  async getAchievements(): Promise<Achievement[]> { return []; },
  async getUserAchievements(userId: string): Promise<UserAchievement[]> { return []; },
  async getUserStreaks(userId: string): Promise<Streak[]> { return []; },
  async getChallenges(): Promise<Challenge[]> { return []; },
  async getFeedbackWalls(eventId?: string): Promise<FeedbackWall[]> {
      try {
        // Mock return for now as per previous implementation
        return [{
          id: 'wall1',
          eventId: eventId || 'event1',
          entries: [],
          isPublic: true,
          moderationEnabled: false,
          createdAt: new Date()
        }];
      } catch (error) { return []; }
  },
  async addFeedbackToWall(wallId: string, feedback: any): Promise<string> { return 'mock_id'; },
  async getUserTitles(userId: string): Promise<UserTitle[]> { return []; }
};

// Event Ticketing & Management Services (Mocked for now in previous implementation)
export const ticketingService = {
  async getEventWithTicketing(eventId: string): Promise<EventTicketing | null> {
    // Mock
    return {
      soldTickets: 57,
      availableTickets: 68,
      ticketTypes: [
        { id: '1', price: 25, benefits: ['Event access', 'Welcome kit'] },
        { id: '2', price: 75, benefits: ['Event access', 'VIP lounge', 'Premium meals'] }
      ],
      analytics: {
        totalRevenue: 2025,
        ticketsSold: 57,
        conversionRate: 0.65,
        refundRequests: 2,
        checkInRate: 0.85
      }
    } as EventTicketing;
  },
  async purchaseTickets(bookingRequest: BookingRequest): Promise<EventTicket[]> { return []; },
  async getUserTickets(userId: string): Promise<EventTicket[]> { return []; },
  async checkInTicket(ticketId: string): Promise<boolean> { return true; },
  async joinWaitlist(eventId: string, userId: string): Promise<WaitlistEntry> { return { id: 'w1' } as WaitlistEntry; },
  async validateDiscountCode(code: string, eventId: string): Promise<DiscountCode | null> { return null; }
};

// Recurring Groups (Mocked)
export const groupService = {
  async getGroups(userId?: string): Promise<RecurringGroup[]> { return []; },
  async createGroup(group: any): Promise<string> { return 'group1'; },
  async joinGroup(groupId: string, userId: string): Promise<boolean> { return true; },
  async leaveGroup(groupId: string, userId: string): Promise<boolean> { return true; },
  async getGroupCalendarEvents(groupId: string): Promise<GroupCalendarEvent[]> { return []; },
  async createCalendarEvent(event: any): Promise<string> { return 'event1'; },
  async updateRSVP(eventId: string, userId: string, status: string): Promise<boolean> { return true; },
  async createSurvey(survey: any): Promise<string> { return 'survey1'; },
  async submitSurveyResponse(response: any): Promise<string> { return 'resp1'; },
  async getGroupDiscussions(groupId: string): Promise<GroupDiscussion[]> { return []; },
  async createDiscussion(discussion: any): Promise<string> { return 'disc1'; },
  async getGroupResources(groupId: string): Promise<GroupResource[]> { return []; },
  async uploadResource(resource: any): Promise<string> { return 'res1'; }
};