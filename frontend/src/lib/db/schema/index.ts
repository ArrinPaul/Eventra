import { pgTable, text, timestamp, integer, boolean, uuid, jsonb, decimal, primaryKey } from 'drizzle-orm/pg-core';
import type { AdapterAccount } from "next-auth/adapters";

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
  interests: text('interests').array(),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  ticketNumber: text('ticket_number').notNull().unique(),
  status: text('status').default('confirmed').notNull(), // confirmed, pending, cancelled, checked_in, refunded
  purchaseDate: timestamp('purchase_date').defaultNow().notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  qrCode: text('qr_code'),
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
