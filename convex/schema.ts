import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    role: v.optional(v.union(v.literal("student"), v.literal("professional"), v.literal("organizer"), v.literal("admin"), v.literal("speaker"), v.literal("attendee"), v.literal("vendor"))),
    
    // Onboarding & Profile
    onboardingCompleted: v.optional(v.boolean()),
    bio: v.optional(v.string()),
    interests: v.optional(v.string()), // Comma-separated or JSON string
    
    // Student fields
    college: v.optional(v.string()),
    degree: v.optional(v.union(v.literal("ug"), v.literal("pg"))),
    year: v.optional(v.number()),
    
    // Professional fields
    company: v.optional(v.string()),
    designation: v.optional(v.string()),
    country: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"), v.literal("prefer-not-to-say"))),
    bloodGroup: v.optional(v.string()),
    
    // Common fields
    phone: v.optional(v.string()),
    mobile: v.optional(v.string()),
    foodChoice: v.optional(v.union(v.literal("veg"), v.literal("non-veg"), v.literal("vegan"))),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      number: v.string(),
    })),
    
    // System fields
    registrationId: v.optional(v.string()),
    checkedIn: v.optional(v.boolean()),
    points: v.optional(v.number()),
    organizationId: v.optional(v.string()),
    status: v.optional(v.string()), // active, suspended, banned
    myEvents: v.optional(v.array(v.string())), // Array of session/event IDs
    wishlist: v.optional(v.array(v.string())), // Array of event IDs
    eventRatings: v.optional(v.any()), // Map of eventId to rating
    
    // Gamification
    xp: v.optional(v.number()),
    level: v.optional(v.number()),
  }).index("by_email", ["email"]),

  events: defineTable({
    title: v.string(),
    description: v.string(),
    startDate: v.number(), // timestamp
    endDate: v.number(), // timestamp
    location: v.any(), // Store versatile location object
    type: v.string(),
    category: v.string(),
    status: v.string(), // draft, published, cancelled, completed
    organizerId: v.id("users"),
    organizationId: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    capacity: v.number(),
    registeredCount: v.number(),
    isPaid: v.optional(v.boolean()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    agenda: v.optional(v.any()), // Array of agenda items
    speakers: v.optional(v.array(v.string())), // Array of user IDs
  }).index("by_organizer", ["organizerId"]).index("by_status", ["status"]),

  registrations: defineTable({
    userId: v.id("users"),
    eventId: v.id("events"),
    status: v.string(), // confirmed, pending, cancelled, checked-in
    registrationDate: v.number(),
    ticketId: v.optional(v.id("tickets")),
    checkedIn: v.optional(v.boolean()),
    checkInTime: v.optional(v.number()),
  }).index("by_user", ["userId"]).index("by_event", ["eventId"]).index("by_event_user", ["eventId", "userId"]),

  tickets: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    ticketTypeId: v.optional(v.string()),
    ticketNumber: v.string(),
    status: v.string(),
    price: v.number(),
    purchaseDate: v.number(),
    qrCode: v.optional(v.string()),
    checkInStatus: v.optional(v.string()),
  }).index("by_user", ["userId"]).index("by_event", ["eventId"]).index("by_ticket_number", ["ticketNumber"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.string(), // event, system, reminder
    read: v.boolean(),
    createdAt: v.number(),
    link: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  badges: defineTable({
    name: v.string(),
    description: v.string(),
    imageUrl: v.string(),
    criteria: v.string(),
    category: v.string(),
  }),

  user_badges: defineTable({
    userId: v.id("users"),
    badgeId: v.id("badges"),
    awardedAt: v.number(),
  }).index("by_user", ["userId"]),

  communities: defineTable({
    name: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    createdBy: v.id("users"),
    isPrivate: v.boolean(),
    membersCount: v.number(),
  }),

  community_posts: defineTable({
    communityId: v.id("communities"),
    authorId: v.id("users"),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    likes: v.number(),
    createdAt: v.number(),
  }).index("by_community", ["communityId"]),

  chat_rooms: defineTable({
    name: v.optional(v.string()),
    type: v.string(), // direct, group, event
    eventId: v.optional(v.id("events")),
    participants: v.array(v.id("users")),
    lastMessageAt: v.optional(v.number()),
  }),

  messages: defineTable({
    roomId: v.id("chat_rooms"),
    senderId: v.id("users"),
    content: v.string(),
    sentAt: v.number(),
    readBy: v.array(v.id("users")),
  }).index("by_room", ["roomId"]),

  files: defineTable({
    storageId: v.string(),
    userId: v.id("users"),
    name: v.string(),
    contentType: v.string(),
    size: v.number(),
    url: v.string(),
  }).index("by_user", ["userId"]),
});
