import { pgTable, text, timestamp, integer, boolean, uuid, jsonb, decimal, primaryKey } from 'drizzle-orm/pg-core';
import type { AdapterAccount } from "next-auth/adapters";

// --- Auth.js / NextAuth Required Tables ---

export const users = pgTable('users', {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // --- Eventra Custom Fields ---
  role: text('role', { enum: ['attendee', 'organizer', 'admin', 'professional'] }).default('attendee').notNull(),
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

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// --- Eventra Core Features Tables ---

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  imageUrl: text('image_url'),
  category: text('category').notNull(),
  status: text('status', { enum: ['draft', 'published', 'cancelled', 'completed'] }).default('draft').notNull(),
  type: text('type', { enum: ['physical', 'virtual', 'hybrid'] }).default('physical').notNull(),
  location: jsonb('location').notNull(), 
  capacity: integer('capacity').notNull(),
  registeredCount: integer('registered_count').default(0).notNull(),
  organizerId: text('organizer_id').references(() => users.id).notNull(), // Changed to text for Auth.js compatibility
  price: decimal('price', { precision: 10, scale: 2 }).default('0').notNull(),
  isPaid: boolean('is_paid').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(), // Changed to text for Auth.js compatibility
  ticketNumber: text('ticket_number').notNull().unique(),
  status: text('status', { enum: ['confirmed', 'pending', 'cancelled', 'checked_in', 'refunded'] }).default('confirmed').notNull(),
  purchaseDate: timestamp('purchase_date').defaultNow().notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  qrCode: text('qr_code'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
