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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom));
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  async sendMessage(message: Omit<ChatMessage, 'id'>): Promise<string> {
    try {
      const docRef = await db.collection('messages').add(message);
      
      // Update chat room's last message and activity
      await db.collection('chatRooms').doc(message.chatRoomId).update({
        lastMessage: message,
        lastActivity: message.createdAt
      });
      
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedPost));
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
            likedBy: likedBy.filter(id => id !== userId)
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
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
        if (!event.attendees.includes(userId)) {
          await eventRef.update({
            attendees: [...event.attendees, userId],
            'ticketing.soldTickets': event.ticketing.soldTickets + 1,
            'ticketing.availableTickets': event.ticketing.availableTickets - 1
          });
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
      
      const matches1 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      const matches2 = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      
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
        message,
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
        const newTotalXP = userXP.totalXP + amount;
        const newLevel = Math.floor(newTotalXP / 1000) + 1; // Simple leveling system
        
        await userXPRef.update({
          totalXP: newTotalXP,
          level: newLevel,
          currentLevelXP: newTotalXP % 1000,
          nextLevelXP: 1000,
          xpHistory: [
            ...userXP.xpHistory,
            {
              id: `xp-${Date.now()}`,
              userId,
              amount,
              reason,
              category,
              createdAt: new Date()
            }
          ]
        });
      } else {
        // Create new XP record
        const newUserXP: UserXP = {
          userId,
          totalXP: amount,
          level: 1,
          currentLevelXP: amount,
          nextLevelXP: 1000,
          xpHistory: [{
            id: `xp-${Date.now()}`,
            userId,
            amount,
            reason,
            category,
            createdAt: new Date()
          }]
        };
        await userXPRef.set(newUserXP);
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
      throw error;
    }
  },

  async getAchievements(): Promise<Achievement[]> {
    try {
      // Mock achievements
      return [
        {
          id: 'first_event',
          name: 'First Steps',
          description: 'Attended your first event',
          icon: '🎯',
          type: 'milestone',
          criteria: {
            type: 'event_count',
            target: 1
          },
          reward: {
            xp: 100,
            badge: 'Newcomer'
          },
          rarity: 'common',
          isHidden: false,
          earnedBy: ['user1', 'user2'],
          createdAt: new Date()
        },
        {
          id: 'networking_guru',
          name: 'Networking Guru',
          description: 'Made 50+ connections',
          icon: '🤝',
          type: 'social',
          criteria: {
            type: 'connection_count',
            target: 50
          },
          reward: {
            xp: 500,
            badge: 'Connector',
            title: 'The Networker'
          },
          rarity: 'rare',
          isHidden: false,
          earnedBy: ['user1'],
          createdAt: new Date()
        },
        {
          id: 'week_warrior',
          name: 'Week Warrior',
          description: 'Login for 7 consecutive days',
          icon: '🔥',
          type: 'streak',
          criteria: {
            type: 'streak',
            target: 7
          },
          reward: {
            xp: 200,
            badge: 'Dedicated'
          },
          rarity: 'uncommon',
          isHidden: false,
          earnedBy: ['user2', 'user3'],
          createdAt: new Date()
        }
      ];
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  },

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      // Mock user achievements
      return [
        {
          id: 'ua1',
          userId,
          achievementId: 'first_event',
          earnedAt: new Date('2024-02-15'),
          progress: 100,
          isNew: false
        },
        {
          id: 'ua2',
          userId,
          achievementId: 'networking_guru',
          earnedAt: new Date('2024-03-01'),
          progress: 85,
          isNew: true
        }
      ];
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }
  },

  async getUserStreaks(userId: string): Promise<Streak[]> {
    try {
      return [
        {
          id: 'streak1',
          userId,
          type: 'daily_login',
          currentStreak: 7,
          longestStreak: 15,
          lastActivityDate: new Date(),
          isActive: true
        },
        {
          id: 'streak2',
          userId,
          type: 'event_attendance',
          currentStreak: 3,
          longestStreak: 8,
          lastActivityDate: new Date('2024-03-10'),
          isActive: true
        }
      ];
    } catch (error) {
      console.error('Error fetching user streaks:', error);
      return [];
    }
  },

  async getChallenges(): Promise<Challenge[]> {
    try {
      return [
        {
          id: 'march_challenge',
          name: 'March Madness',
          description: 'Complete these tasks during March to earn exclusive rewards',
          type: 'monthly',
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-31'),
          tasks: [
            {
              id: 'task1',
              name: 'Attend 3 Events',
              description: 'Join at least 3 different events this month',
              type: 'attend_event',
              target: 3,
              xpReward: 150,
              isCompleted: false
            },
            {
              id: 'task2',
              name: 'Make 10 Connections',
              description: 'Connect with 10 new people',
              type: 'make_connection',
              target: 10,
              xpReward: 200,
              isCompleted: false
            }
          ],
          rewards: [
            {
              id: 'reward1',
              name: 'March Champion Badge',
              type: 'badge',
              value: 'march_champion',
              description: 'Exclusive badge for March challenge winners'
            }
          ],
          participants: ['user1', 'user2', 'user3'],
          isActive: true,
          createdBy: 'admin',
          maxParticipants: 100
        }
      ];
    } catch (error) {
      console.error('Error fetching challenges:', error);
      return [];
    }
  },

  async getFeedbackWalls(eventId?: string): Promise<FeedbackWall[]> {
    try {
      return [
        {
          id: 'wall1',
          eventId: eventId || 'event1',
          feedbacks: [
            {
              id: 'fb1',
              wallId: 'wall1',
              content: 'Amazing event! Learned so much today 🎉',
              rating: 5,
              emoji: '🎉',
              isAnonymous: false,
              authorId: 'user1',
              createdAt: new Date(),
              isVisible: true,
              likes: 12,
              likedBy: ['user2', 'user3']
            },
            {
              id: 'fb2',
              wallId: 'wall1',
              content: 'Great networking opportunities. Well organized!',
              rating: 4,
              emoji: '👏',
              isAnonymous: true,
              createdAt: new Date(),
              isVisible: true,
              likes: 8,
              likedBy: ['user1', 'user4']
            },
            {
              id: 'fb3',
              wallId: 'wall1',
              content: 'The AI session was mind-blowing! 🤖',
              rating: 5,
              emoji: '🤖',
              isAnonymous: false,
              authorId: 'user3',
              createdAt: new Date(),
              isVisible: true,
              likes: 15,
              likedBy: ['user1', 'user2', 'user4']
            }
          ],
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
    try {
      return [
        {
          id: 'title1',
          name: 'The Networker',
          description: 'Master of connections and relationships',
          icon: '🤝',
          color: '#3B82F6',
          rarity: 'rare',
          requirements: ['Make 50+ connections', 'Attend 10+ networking events'],
          isActive: true,
          earnedAt: new Date('2024-03-01')
        },
        {
          id: 'title2',
          name: 'Early Bird',
          description: 'Always first to join new events',
          icon: '🐦',
          color: '#10B981',
          rarity: 'common',
          requirements: ['Be among first 10 to register for 5 events'],
          isActive: false,
          earnedAt: new Date('2024-02-15')
        }
      ];
    } catch (error) {
      console.error('Error fetching user titles:', error);
      return [];
    }
  }
};

// Event Ticketing & Management Services
export const ticketingService = {
  async getEventWithTicketing(eventId: string): Promise<EventTicketing | null> {
    try {
      // Mock implementation - in real app would fetch from Firestore
      return {
        id: eventId,
        title: 'Sample Event',
        description: 'This is a sample event description',
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-15'),
        location: 'Sample Venue',
        ticketTypes: [
          {
            id: '1',
            name: 'General Admission',
            description: 'Standard event access',
            price: 25,
            totalAvailable: 100,
            sold: 45,
            maxPerPerson: 4,
            saleStartDate: new Date('2024-02-15'),
            saleEndDate: new Date('2024-03-14'),
            benefits: ['Event access', 'Welcome kit'],
            color: '#3B82F6'
          },
          {
            id: '2',
            name: 'VIP Pass',
            description: 'Premium access with additional benefits',
            price: 75,
            totalAvailable: 25,
            sold: 12,
            maxPerPerson: 2,
            saleStartDate: new Date('2024-02-15'),
            saleEndDate: new Date('2024-03-14'),
            benefits: ['Event access', 'VIP lounge', 'Premium meals', 'Meet & greet'],
            color: '#8B5CF6'
          }
        ],
        totalCapacity: 125,
        currentAttendees: 57,
        waitlistEntries: [],
        ticketingAnalytics: {
          totalRevenue: 2025,
          ticketsSold: 57,
          conversionRate: 0.65,
          refundRequests: 2,
          checkInRate: 0.85,
          popularTicketTypes: [
            { typeId: '1', sold: 45 },
            { typeId: '2', sold: 12 }
          ],
          salesOverTime: [],
          demographics: {
            ageGroups: [],
            roles: [],
            companies: []
          }
        },
        discountCodes: [],
        checkInSettings: {
          enableQrCode: true,
          enableManualCheckIn: true,
          checkInWindow: { startMinutes: 30, endMinutes: 120 },
          requireConfirmation: true,
          sendConfirmationEmail: true
        },
        refundPolicy: {
          allowRefunds: true,
          refundDeadline: new Date('2024-03-10'),
          refundPercentage: 90,
          processingFee: 2,
          refundableTicketTypes: ['1', '2']
        },
        eventOrganizer: {
          id: 'org1',
          name: 'Event Organizers Inc.',
          email: 'organizer@example.com',
          verificationStatus: 'verified'
        },
        attendees: [],
        tags: ['tech', 'networking'],
        category: 'Technology',
        isPublic: true,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as EventTicketing;
    } catch (error) {
      console.error('Error fetching event with ticketing:', error);
      return null;
    }
  },

  async purchaseTickets(bookingRequest: BookingRequest): Promise<EventTicket[]> {
    try {
      // Mock implementation - simulate ticket purchase
      return bookingRequest.tickets.map((ticket, index) => ({
        id: `ticket_${Date.now()}_${index}`,
        eventId: bookingRequest.eventId,
        userId: bookingRequest.userId,
        ticketType: {
          id: ticket.ticketTypeId,
          name: 'General Admission',
          description: 'Standard event access',
          price: 25,
          totalAvailable: 100,
          sold: 45,
          maxPerPerson: 4,
          saleStartDate: new Date(),
          saleEndDate: new Date(),
          benefits: ['Event access'],
          color: '#3B82F6'
        },
        price: 25,
        ticketStatus: 'confirmed',
        qrCode: `QR_${Date.now()}_${index}`,
        purchaseDate: new Date(),
      } as EventTicket));
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      throw error;
    }
  },

  async getUserTickets(userId: string): Promise<EventTicket[]> {
    try {
      // Mock implementation
      return [
        {
          id: 'ticket1',
          eventId: 'event1',
          userId,
          ticketType: {
            id: '1',
            name: 'General Admission',
            description: 'Standard event access',
            price: 25,
            totalAvailable: 100,
            sold: 45,
            maxPerPerson: 4,
            saleStartDate: new Date(),
            saleEndDate: new Date(),
            benefits: ['Event access'],
            color: '#3B82F6'
          },
          price: 25,
          ticketStatus: 'confirmed',
          qrCode: 'QR_123456',
          purchaseDate: new Date(),
        }
      ];
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
  },

  async checkInTicket(ticketId: string): Promise<boolean> {
    try {
      // Mock implementation - simulate check-in
      console.log(`Checking in ticket: ${ticketId}`);
      return true;
    } catch (error) {
      console.error('Error checking in ticket:', error);
      return false;
    }
  },

  async joinWaitlist(eventId: string, userId: string, ticketTypeId?: string): Promise<WaitlistEntry> {
    try {
      const waitlistEntry: WaitlistEntry = {
        id: `waitlist_${Date.now()}`,
        eventId,
        userId,
        position: Math.floor(Math.random() * 10) + 1,
        joinedAt: new Date(),
        notified: false,
        ticketTypeId
      };
      return waitlistEntry;
    } catch (error) {
      console.error('Error joining waitlist:', error);
      throw error;
    }
  },

  async validateDiscountCode(code: string, eventId: string): Promise<DiscountCode | null> {
    try {
      // Mock implementation
      if (code === 'EARLYBIRD') {
        return {
          id: 'discount1',
          code: 'EARLYBIRD',
          type: 'percentage',
          value: 20,
          maxUses: 100,
          currentUses: 45,
          validFrom: new Date('2024-02-01'),
          validTo: new Date('2024-03-01'),
          applicableTicketTypes: ['1', '2'],
          isActive: true
        };
      }
      return null;
    } catch (error) {
      console.error('Error validating discount code:', error);
      return null;
    }
  }
};

// Recurring Groups & Meetup Services
export const groupService = {
  async getGroups(userId?: string): Promise<RecurringGroup[]> {
    try {
      // Mock implementation
      return [
        {
          id: 'group1',
          name: 'AI/ML Enthusiasts',
          description: 'Weekly meetup for AI and Machine Learning enthusiasts to share knowledge and work on projects together',
          category: 'Technology',
          organizerId: 'user1',
          members: ['user1', 'user2', 'user3', 'user4'],
          schedule: {
            frequency: 'weekly',
            dayOfWeek: 3, // Wednesday
            time: '19:00',
            timezone: 'Asia/Kolkata'
          },
          location: {
            type: 'hybrid',
            address: 'Tech Hub, Bengaluru',
            virtualUrl: 'https://meet.google.com/abc-defg-hij'
          },
          maxMembers: 25,
          isPrivate: false,
          tags: ['AI', 'Machine Learning', 'Technology', 'Networking'],
          coverImage: '/api/placeholder/group-cover-1.jpg',
          createdAt: new Date('2024-01-15'),
          upcomingMeetings: [
            {
              id: 'meeting1',
              groupId: 'group1',
              title: 'Getting Started with Neural Networks',
              description: 'Introduction to neural networks and hands-on coding session',
              date: new Date('2024-03-20T19:00:00'),
              attendees: ['user1', 'user2', 'user3'],
              agenda: '1. Introduction to Neural Networks\n2. Hands-on Coding\n3. Q&A Session',
              feedback: [],
              status: 'scheduled'
            }
          ],
          pastMeetings: ['meeting2', 'meeting3']
        },
        {
          id: 'group2',
          name: 'Startup Founders Circle',
          description: 'Monthly gathering of startup founders to share experiences, challenges, and opportunities',
          category: 'Business',
          organizerId: 'user2',
          members: ['user2', 'user5', 'user6'],
          schedule: {
            frequency: 'monthly',
            dayOfMonth: 15,
            time: '18:30',
            timezone: 'Asia/Kolkata'
          },
          location: {
            type: 'physical',
            address: 'Startup Incubator, Mumbai'
          },
          maxMembers: 15,
          isPrivate: true,
          tags: ['Startups', 'Entrepreneurship', 'Business', 'Networking'],
          coverImage: '/api/placeholder/group-cover-2.jpg',
          createdAt: new Date('2024-02-01'),
          upcomingMeetings: [
            {
              id: 'meeting4',
              groupId: 'group2',
              title: 'Scaling Your Startup: Lessons Learned',
              description: 'Panel discussion with successful founders who scaled their startups',
              date: new Date('2024-03-15T18:30:00'),
              attendees: ['user2', 'user5'],
              feedback: [],
              status: 'scheduled'
            }
          ],
          pastMeetings: ['meeting5']
        }
      ];
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  },

  async createGroup(group: Omit<RecurringGroup, 'id' | 'createdAt' | 'upcomingMeetings' | 'pastMeetings'>): Promise<string> {
    try {
      // Mock implementation
      const groupId = `group_${Date.now()}`;
      return groupId;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  async joinGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      // Mock implementation
      return true;
    } catch (error) {
      console.error('Error joining group:', error);
      return false;
    }
  },

  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      // Mock implementation
      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      return false;
    }
  },

  async getGroupCalendarEvents(groupId: string): Promise<GroupCalendarEvent[]> {
    try {
      // Mock implementation
      return [
        {
          id: 'event1',
          groupId,
          googleCalendarId: 'cal_event_1',
          title: 'Weekly AI/ML Meetup',
          description: 'Regular meetup for AI enthusiasts',
          startDate: new Date('2024-03-20T19:00:00'),
          endDate: new Date('2024-03-20T21:00:00'),
          location: 'Tech Hub, Bengaluru',
          attendees: [
            { userId: 'user1', status: 'going', respondedAt: new Date() },
            { userId: 'user2', status: 'maybe' },
            { userId: 'user3', status: 'going', respondedAt: new Date() }
          ],
          reminders: [
            {
              id: 'reminder1',
              type: 'email',
              minutesBefore: 60,
              sent: false
            }
          ],
          recurring: true,
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=WE',
          status: 'scheduled',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  },

  async createCalendarEvent(event: Omit<GroupCalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Mock implementation
      return `event_${Date.now()}`;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  },

  async updateRSVP(eventId: string, userId: string, status: 'going' | 'maybe' | 'not-going'): Promise<boolean> {
    try {
      // Mock implementation
      return true;
    } catch (error) {
      console.error('Error updating RSVP:', error);
      return false;
    }
  },

  async createSurvey(survey: Omit<GroupSurvey, 'id' | 'responses' | 'createdAt'>): Promise<string> {
    try {
      // Mock implementation
      return `survey_${Date.now()}`;
    } catch (error) {
      console.error('Error creating survey:', error);
      throw error;
    }
  },

  async submitSurveyResponse(response: Omit<SurveyResponse, 'id' | 'submittedAt'>): Promise<string> {
    try {
      // Mock implementation
      return `response_${Date.now()}`;
    } catch (error) {
      console.error('Error submitting survey response:', error);
      throw error;
    }
  },

  async getGroupDiscussions(groupId: string): Promise<GroupDiscussion[]> {
    try {
      // Mock implementation
      return [
        {
          id: 'discussion1',
          groupId,
          title: 'Best Resources for Learning Machine Learning',
          description: 'Share your favorite ML learning resources',
          authorId: 'user1',
          messages: [
            {
              id: 'msg1',
              discussionId: 'discussion1',
              authorId: 'user1',
              content: 'What are your favorite resources for learning ML? I recommend Andrew Ng\'s course on Coursera.',
              reactions: { '👍': ['user2', 'user3'], '❤️': ['user4'] },
              createdAt: new Date(),
              isDeleted: false
            },
            {
              id: 'msg2',
              discussionId: 'discussion1',
              authorId: 'user2',
              content: 'I love fast.ai courses! Very practical approach.',
              replyTo: 'msg1',
              reactions: { '👍': ['user1', 'user3'] },
              createdAt: new Date(),
              isDeleted: false
            }
          ],
          tags: ['learning', 'resources', 'ML'],
          isPinned: true,
          isLocked: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    } catch (error) {
      console.error('Error fetching discussions:', error);
      return [];
    }
  },

  async createDiscussion(discussion: Omit<GroupDiscussion, 'id' | 'messages' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Mock implementation
      return `discussion_${Date.now()}`;
    } catch (error) {
      console.error('Error creating discussion:', error);
      throw error;
    }
  },

  async getGroupResources(groupId: string): Promise<GroupResource[]> {
    try {
      // Mock implementation
      return [
        {
          id: 'resource1',
          groupId,
          title: 'Introduction to Neural Networks - Slides',
          description: 'Presentation slides from our last meeting',
          type: 'presentation',
          url: '/api/placeholder/neural-networks-slides.pdf',
          uploadedBy: 'user1',
          uploadedAt: new Date(),
          tags: ['neural networks', 'slides', 'presentation'],
          downloadCount: 15,
          isPublic: true
        },
        {
          id: 'resource2',
          groupId,
          title: 'Recommended Reading List',
          description: 'Curated list of ML papers and books',
          type: 'document',
          url: '/api/placeholder/reading-list.pdf',
          uploadedBy: 'user2',
          uploadedAt: new Date(),
          tags: ['reading', 'papers', 'books'],
          downloadCount: 23,
          isPublic: true
        }
      ];
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  },

  async uploadResource(resource: Omit<GroupResource, 'id' | 'uploadedAt' | 'downloadCount'>): Promise<string> {
    try {
      // Mock implementation
      return `resource_${Date.now()}`;
    } catch (error) {
      console.error('Error uploading resource:', error);
      throw error;
    }
  }
};