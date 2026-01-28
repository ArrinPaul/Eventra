// Firestore service utilities for the new modules
import { db } from './firebase';
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
      const snapshot = await db.collection('communities').get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Community));
    } catch (error) {
      console.error('Error fetching communities:', error);
      return [];
    }
  },

  async createCommunity(community: Omit<Community, 'id'>): Promise<string> {
    try {
      const docRef = await db.collection('communities').add(community);
      return docRef.id;
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  },

  async getPosts(communityId: string): Promise<Post[]> {
    try {
      const snapshot = await db
        .collection('posts')
        .where('communityId', '==', communityId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Post));
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  },

  async createPost(post: Omit<Post, 'id'>): Promise<string> {
    try {
      const docRef = await db.collection('posts').add(post);
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  async voteOnPost(postId: string, userId: string, vote: 'up' | 'down'): Promise<void> {
    try {
      const postRef = db.collection('posts').doc(postId);
      const postDoc = await postRef.get();
      
      if (postDoc.exists) {
        const post = postDoc.data() as Post;
        const votedBy = post.votedBy || {};
        const previousVote = votedBy[userId];

        // Remove previous vote counts
        if (previousVote === 'up') {
          post.upvotes = Math.max(0, post.upvotes - 1);
        } else if (previousVote === 'down') {
          post.downvotes = Math.max(0, post.downvotes - 1);
        }

        // Add new vote
        if (vote === 'up') {
          post.upvotes++;
        } else {
          post.downvotes++;
        }

        votedBy[userId] = vote;

        await postRef.update({
          upvotes: post.upvotes,
          downvotes: post.downvotes,
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
      const snapshot = await db
        .collection('comments')
        .where('postId', '==', postId)
        .orderBy('createdAt', 'asc')
        .get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Comment));
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  },

  async createComment(comment: Omit<Comment, 'id'>): Promise<string> {
    try {
      const docRef = await db.collection('comments').add(comment);
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
      const snapshot = await db
        .collection('chatRooms')
        .where('participants', 'array-contains', userId)
        .orderBy('lastActivity', 'desc')
        .get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ChatRoom));
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      return [];
    }
  },

  async createChatRoom(chatRoom: Omit<ChatRoom, 'id'>): Promise<string> {
    try {
      const docRef = await db.collection('chatRooms').add(chatRoom);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  },

  async getMessages(chatRoomId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const snapshot = await db
        .collection('messages')
        .where('chatRoomId', '==', chatRoomId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  async sendMessage(message: Omit<ChatMessage, 'id'>): Promise<string> {
    try {
      const docRef = await db.collection('messages').add(message);
      
      // Update chat room's last message and activity
      if (message.chatRoomId) {
        await db.collection('chatRooms').doc(message.chatRoomId).update({
          lastMessage: message,
          lastActivity: message.createdAt
        });
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
};

// Feed Service
export const feedService = {
  async getFeedPosts(limit: number = 20): Promise<FeedPost[]> {
    try {
      const snapshot = await db
        .collection('feedPosts')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as FeedPost));
    } catch (error) {
      console.error('Error fetching feed posts:', error);
      return [];
    }
  },

  async createFeedPost(post: Omit<FeedPost, 'id'>): Promise<string> {
    try {
      const docRef = await db.collection('feedPosts').add(post);
      return docRef.id;
    } catch (error) {
      console.error('Error creating feed post:', error);
      throw error;
    }
  },

  async likePost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = db.collection('feedPosts').doc(postId);
      const postDoc = await postRef.get();
      
      if (postDoc.exists) {
        const post = postDoc.data() as FeedPost;
        const likedBy = post.likedBy || [];
        
        if (likedBy.includes(userId)) {
          // Unlike
          await postRef.update({
            likes: Math.max(0, post.likes - 1),
            likedBy: likedBy.filter((id: string) => id !== userId)
          });
        } else {
          // Like
          await postRef.update({
            likes: post.likes + 1,
            likedBy: [...likedBy, userId]
          });
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }
};

// Event Service
export const eventService = {
  async getEvents(): Promise<Event[]> {
    try {
      const snapshot = await db
        .collection('events')
        .where('isPublished', '==', true)
        .orderBy('startDate', 'asc')
        .get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  async createEvent(event: Omit<Event, 'id'>): Promise<string> {
    try {
      const docRef = await db.collection('events').add(event);
      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  async registerForEvent(eventId: string, userId: string): Promise<void> {
    try {
      const eventRef = db.collection('events').doc(eventId);
      const eventDoc = await eventRef.get();
      
      if (eventDoc.exists) {
        const event = eventDoc.data() as Event;
        // Check both new 'maxAttendees' and potentially legacy 'attendees' usage
        const currentAttendees = (event as any).attendees || [];
        
        if (!currentAttendees.includes(userId)) {
          const updates: any = {
            attendees: [...currentAttendees, userId]
          };
          
          if (event.pricing) {
             // Basic mock logic for ticketing update
             updates['ticketing.soldTickets'] = (event as any).ticketing?.soldTickets ? (event as any).ticketing.soldTickets + 1 : 1;
          }

          await eventRef.update(updates);
        }
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  }
};

// Matching Service
export const matchingService = {
  async getUserMatches(userId: string): Promise<Match[]> {
    try {
      const snapshot = await db
        .collection('matches')
        .where('user1Id', '==', userId)
        .where('status', '==', 'potential')
        .get();
      
      const snapshot2 = await db
        .collection('matches')
        .where('user2Id', '==', userId)
        .where('status', '==', 'potential')
        .get();
      
      const matches1 = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Match));
      const matches2 = snapshot2.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Match));
      
      return [...matches1, ...matches2];
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  },

  async swipeUser(matchId: string, userId: string, action: 'like' | 'pass'): Promise<boolean> {
    try {
      const matchRef = db.collection('matches').doc(matchId);
      const matchDoc = await matchRef.get();
      
      if (matchDoc.exists) {
        const match = matchDoc.data() as Match;
        
        if (action === 'like') {
          await matchRef.update({ status: 'liked', likedAt: new Date() });
          
          // Check if it's a mutual match
          const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
          const otherMatches = await db
            .collection('matches')
            .where('user1Id', '==', otherUserId)
            .where('user2Id', '==', userId)
            .where('status', '==', 'liked')
            .get();
          
          if (!otherMatches.empty) {
            // It's a match!
            await matchRef.update({ status: 'matched', matchedAt: new Date() });
            return true;
          }
        } else {
          await matchRef.update({ status: 'passed' });
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
      const doc = await db.collection('userProfiles').doc(userId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } as UserProfile : null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await db.collection('userProfiles').doc(userId).update(updates);
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
      
      const docRef = await db.collection('connectionRequests').add(request);
      return docRef.id;
    } catch (error) {
      console.error('Error sending connection request:', error);
      throw error;
    }
  }
};

// XP and Gamification Service
export const gamificationService = {
  async getUserXP(userId: string): Promise<UserXP | null> {
    try {
      const doc = await db.collection('userXP').doc(userId).get();
      return doc.exists ? doc.data() as UserXP : null;
    } catch (error) {
      console.error('Error fetching user XP:', error);
      return null;
    }
  },

  async awardXP(userId: string, amount: number, reason: string, category: string): Promise<void> {
    try {
      const userXPRef = db.collection('userXP').doc(userId);
      const userXPDoc = await userXPRef.get();
      
      if (userXPDoc.exists) {
        const userXP = userXPDoc.data() as UserXP;
        const newTotalXP = (userXP.xp || 0) + amount;
        
        await userXPRef.update({
          xp: newTotalXP,
          // Simplified update
        });
      } else {
        // Create new XP record
        const newUserXP: UserXP = {
          userId,
          xp: amount
        };
        await userXPRef.set(newUserXP);
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
      throw error;
    }
  },

  async getAchievements(): Promise<Achievement[]> {
    return []; // Mock
  },

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return []; // Mock
  },

  async getUserStreaks(userId: string): Promise<Streak[]> {
    return []; // Mock
  },

  async getChallenges(): Promise<Challenge[]> {
    return []; // Mock
  },

  async getFeedbackWalls(eventId?: string): Promise<FeedbackWall[]> {
    try {
      return [
        {
          id: 'wall1',
          eventId: eventId || 'event1',
          entries: [], // Fixed: changed 'feedbacks' to 'entries' to match type
          isPublic: true,
          moderationEnabled: false,
          createdAt: new Date()
        }
      ];
    } catch (error) {
      console.error('Error fetching feedback walls:', error);
      return [];
    }
  },

  async addFeedbackToWall(wallId: string, feedback: Omit<WallFeedback, 'id' | 'wallId' | 'createdAt' | 'likes' | 'likedBy' | 'isVisible'>): Promise<string> {
    try {
      // Mock implementation
      return `feedback_${Date.now()}`;
    } catch (error) {
      console.error('Error adding feedback to wall:', error);
      throw error;
    }
  },

  async getUserTitles(userId: string): Promise<UserTitle[]> {
    return []; // Mock
  }
};

// Event Ticketing & Management Services
export const ticketingService = {
  async getEventWithTicketing(eventId: string): Promise<EventTicketing | null> {
    try {
      // Mock implementation - in real app would fetch from Firestore
      return {
        soldTickets: 57,
        availableTickets: 68,
        ticketTypes: [
          {
            id: '1',
            price: 25,
            benefits: ['Event access', 'Welcome kit']
          },
          {
            id: '2',
            price: 75,
            benefits: ['Event access', 'VIP lounge', 'Premium meals', 'Meet & greet']
          }
        ],
        analytics: {
          totalRevenue: 2025,
          ticketsSold: 57,
          conversionRate: 0.65,
          refundRequests: 2,
          checkInRate: 0.85
        }
      } as EventTicketing;
    } catch (error) {
      console.error('Error fetching event with ticketing:', error);
      return null;
    }
  },

  async purchaseTickets(bookingRequest: BookingRequest): Promise<EventTicket[]> {
    try {
      // Mock implementation - simulate ticket purchase
      return bookingRequest.tickets.map((ticket: any, index: number) => ({
        id: `ticket_${Date.now()}_${index}`,
        // Minimal mock
      } as EventTicket));
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      throw error;
    }
  },

  async getUserTickets(userId: string): Promise<EventTicket[]> {
    return []; // Mock
  },

  async checkInTicket(ticketId: string): Promise<boolean> {
    return true; // Mock
  },

  async joinWaitlist(eventId: string, userId: string, ticketTypeId?: string): Promise<WaitlistEntry> {
    return { id: 'w1' } as WaitlistEntry; // Mock
  },

  async validateDiscountCode(code: string, eventId: string): Promise<DiscountCode | null> {
    return null; // Mock
  }
};

// Recurring Groups & Meetup Services
export const groupService = {
  async getGroups(userId?: string): Promise<RecurringGroup[]> {
    return []; // Mock
  },

  async createGroup(group: any): Promise<string> {
    return 'group1';
  },

  async joinGroup(groupId: string, userId: string): Promise<boolean> {
    return true;
  },

  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    return true;
  },

  async getGroupCalendarEvents(groupId: string): Promise<GroupCalendarEvent[]> {
    return [];
  },

  async createCalendarEvent(event: any): Promise<string> {
    return 'event1';
  },

  async updateRSVP(eventId: string, userId: string, status: 'going' | 'maybe' | 'not-going'): Promise<boolean> {
    return true;
  },

  async createSurvey(survey: any): Promise<string> {
    return 'survey1';
  },

  async submitSurveyResponse(response: any): Promise<string> {
    return 'resp1';
  },

  async getGroupDiscussions(groupId: string): Promise<GroupDiscussion[]> {
    return [];
  },

  async createDiscussion(discussion: any): Promise<string> {
    return 'disc1';
  },

  async getGroupResources(groupId: string): Promise<GroupResource[]> {
    return [];
  },

  async uploadResource(resource: any): Promise<string> {
    return 'res1';
  }
};