import { pgTable, text, timestamp, integer, boolean, uuid, jsonb, decimal, primaryKey, customType } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AdapterAccount } from "next-auth/adapters";

// Custom type for pgvector
const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(768)';
  },
});

// --- Auth.js / NextAuth Required Tables ---

export const users = pgTable('users', {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // --- Eventra Custom Fields ---
  role: text('role').default('attendee').notNull(), // attendee, organizer, admin, professional
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  points: integer('points').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  xp: integer('xp').default(0).notNull(),
  bio: text('bio'),
  skills: text('skills').array(),
  interests: text('interests'), // Stored as comma-separated string
  
  // Student fields
  college: text('college'),
  degree: text('degree'),
  year: integer('year'),

  // Professional fields
  company: text('company'),
  designation: text('designation'),
  country: text('country'),
  gender: text('gender'),
  bloodGroup: text('blood_group'),
  
  // Organizer fields
  organizationName: text('organization_name'),
  website: text('website'),

  phone: text('phone'),
  mobile: text('mobile'),

  // AI Context
  embedding: vector('embedding'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable("account", {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// --- Eventra Core Features ---

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  imageUrl: text('image_url'),
  category: text('category').notNull(),
  status: text('status').default('draft').notNull(), // draft, published, cancelled, completed
  type: text('type').default('physical').notNull(), // physical, virtual, hybrid
  location: jsonb('location').notNull(), 
  capacity: integer('capacity').notNull(),
  registeredCount: integer('registered_count').default(0).notNull(),
  organizerId: text('organizer_id').references(() => users.id).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).default('0').notNull(),
  isPaid: boolean('is_paid').default(false).notNull(),
  
  // Recurrence
  isRecurring: boolean('is_recurring').default(false).notNull(),
  recurrenceRule: text('recurrence_rule'), // iCal RRULE format
  parentEventId: uuid('parent_event_id'), // Self-reference for series

  // Settings
  waitlistEnabled: boolean('waitlist_enabled').default(false).notNull(),
  visibility: text('visibility').default('public').notNull(), // public, private, unlisted
  
  // AI Context
  embedding: vector('embedding'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ticketTiers = pgTable('ticket_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  capacity: integer('capacity').notNull(),
  registeredCount: integer('registered_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  tierId: uuid('tier_id').references(() => ticketTiers.id),
  ticketNumber: text('ticket_number').notNull().unique(),
  status: text('status').default('confirmed').notNull(), // confirmed, pending, cancelled, checked_in, refunded
  purchaseDate: timestamp('purchase_date').defaultNow().notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  qrCode: text('qr_code'),
  personalizedMessage: text('personalized_message'), // AI Generated
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const waitlist = pgTable('waitlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  position: integer('position').notNull(),
  status: text('status').default('waiting').notNull(), // waiting, promoted, cancelled
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Social & Engagement ---

export const communities = pgTable('communities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  image: text('image'),
  category: text('category').notNull(),
  isPrivate: boolean('is_private').default(false).notNull(),
  creatorId: text('creator_id').references(() => users.id).notNull(),
  memberCount: integer('member_count').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const communityMembers = pgTable('community_members', {
  communityId: uuid('community_id').references(() => communities.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').default('member').notNull(), // member, moderator, admin
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.communityId, t.userId] }),
}));

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  authorId: text('author_id').references(() => users.id).notNull(),
  communityId: uuid('community_id').references(() => communities.id, { onDelete: 'cascade' }),
  likes: integer('likes').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Gamification ---

export const badges = pgTable('badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  category: text('category').notNull(),
  criteria: jsonb('criteria').notNull(), // { type: 'points', value: 1000 }
});

export const userBadges = pgTable('user_badges', {
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  badgeId: uuid('badge_id').references(() => badges.id, { onDelete: 'cascade' }).notNull(),
  awardedAt: timestamp('awarded_at').defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.badgeId] }),
}));

// --- Communications ---

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // 'info', 'success', 'warning', 'error'
  link: text('link'),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- New Tables for Social, Chat, and AI ---

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  authorId: text('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const follows = pgTable('follows', {
  followerId: text('follower_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followingId: text('following_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.followerId, t.followingId] }),
}));

export const chatRooms = pgTable('chat_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  type: text('type').default('direct').notNull(), // direct, group, event
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').references(() => chatRooms.id, { onDelete: 'cascade' }).notNull(),
  senderId: text('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiChatSessions = pgTable('ai_chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiChatMessages = pgTable('ai_chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => aiChatSessions.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // user, assistant
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const eventFeedback = pgTable('event_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(),
  comment: text('content'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activityFeed = pgTable('activity_feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'registration', 'post', 'comment', 'event_created', 'badge_awarded'
  actorId: text('actor_id').references(() => users.id), // Who performed the action
  targetId: text('target_id'), // UUID of the related entity (event, post, etc.)
  content: text('content'), // Optional text snippet
  metadata: jsonb('metadata'), // Extra context (e.g. { eventTitle: '...', postExcerpt: '...' })
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Relations ---

export const eventsRelations = relations(events, ({ many }) => ({
  ticketTiers: many(ticketTiers),
  tickets: many(tickets),
  waitlist: many(waitlist),
  chatRooms: many(chatRooms),
  aiChatSessions: many(aiChatSessions),
  feedback: many(eventFeedback),
}));

export const ticketTiersRelations = relations(ticketTiers, ({ one }) => ({
  event: one(events, {
    fields: [ticketTiers.eventId],
    references: [events.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  event: one(events, {
    fields: [tickets.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
  tier: one(ticketTiers, {
    fields: [tickets.tierId],
    references: [ticketTiers.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  tickets: many(tickets),
  communities: many(communities),
  communityMembers: many(communityMembers),
  posts: many(posts),
  comments: many(comments),
  notifications: many(notifications),
  userBadges: many(userBadges),
  aiChatSessions: many(aiChatSessions),
  feedback: many(eventFeedback),
  activityLogs: many(activityFeed),
}));

export const communitiesRelations = relations(communities, ({ one, many }) => ({
  creator: one(users, {
    fields: [communities.creatorId],
    references: [users.id],
  }),
  members: many(communityMembers),
  posts: many(posts),
}));

export const communityMembersRelations = relations(communityMembers, ({ one }) => ({
  community: one(communities, {
    fields: [communityMembers.communityId],
    references: [communities.id],
  }),
  user: one(users, {
    fields: [communityMembers.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [posts.communityId],
    references: [communities.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));
