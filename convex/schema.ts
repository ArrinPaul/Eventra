import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal("student"), v.literal("professional"), v.literal("organizer"),
      v.literal("admin"), v.literal("speaker"), v.literal("attendee"), v.literal("vendor"),
    )),
    onboardingCompleted: v.optional(v.boolean()),
    bio: v.optional(v.string()),
    interests: v.optional(v.string()),
    college: v.optional(v.string()),
    degree: v.optional(v.union(v.literal("ug"), v.literal("pg"))),
    year: v.optional(v.number()),
    company: v.optional(v.string()),
    designation: v.optional(v.string()),
    country: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"), v.literal("prefer-not-to-say"))),
    bloodGroup: v.optional(v.string()),
    phone: v.optional(v.string()),
    mobile: v.optional(v.string()),
    foodChoice: v.optional(v.union(v.literal("veg"), v.literal("non-veg"), v.literal("vegan"))),
    emergencyContact: v.optional(v.object({ name: v.string(), number: v.string() })),
    registrationId: v.optional(v.string()),
    checkedIn: v.optional(v.boolean()),
    points: v.optional(v.number()),
    organizationId: v.optional(v.string()),
    status: v.optional(v.string()),
    myEvents: v.optional(v.array(v.string())),
    wishlist: v.optional(v.array(v.string())),
    eventRatings: v.optional(v.record(v.string(), v.number())),
    xp: v.optional(v.number()),
    level: v.optional(v.number()),
    notificationPreferences: v.optional(v.object({
      email: v.optional(v.boolean()),
      push: v.optional(v.boolean()),
      eventReminders: v.optional(v.boolean()),
      communityUpdates: v.optional(v.boolean()),
      marketingEmails: v.optional(v.boolean()),
    })),
  }).index("by_email", ["email"]).index("by_points", ["points"]),

  events: defineTable({
    title: v.string(),
    description: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    location: v.optional(v.union(
      v.string(),
      v.object({
        venue: v.optional(v.union(v.string(), v.object({ name: v.optional(v.string()), address: v.optional(v.string()), city: v.optional(v.string()), country: v.optional(v.string()) }))),
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        country: v.optional(v.string()),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        virtualLink: v.optional(v.string()),
      })
    )),
    type: v.string(),
    category: v.string(),
    status: v.string(),
    organizerId: v.id("users"),
    coOrganizerIds: v.optional(v.array(v.id("users"))),
    organizationId: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    capacity: v.number(),
    registeredCount: v.number(),
    isPaid: v.optional(v.boolean()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    agenda: v.optional(v.array(v.object({
      title: v.string(),
      startTime: v.optional(v.string()),
      endTime: v.optional(v.string()),
      description: v.optional(v.string()),
      speaker: v.optional(v.string()),
      type: v.optional(v.string()),
    }))),
    speakers: v.optional(v.array(v.string())),
    waitlistEnabled: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  }).index("by_organizer", ["organizerId"]).index("by_status", ["status"]),

  registrations: defineTable({
    userId: v.id("users"),
    eventId: v.id("events"),
    status: v.string(),
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
    attendeeName: v.optional(v.string()),
    attendeeEmail: v.optional(v.string()),
  }).index("by_user", ["userId"]).index("by_event", ["eventId"]).index("by_ticket_number", ["ticketNumber"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
    link: v.optional(v.string()),
  }).index("by_user", ["userId"]).index("by_user_read", ["userId", "read"]),

  badges: defineTable({
    name: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    icon: v.string(),
    criteria: v.string(),
    category: v.string(),
    xpReward: v.number(),
    rarity: v.union(v.literal("common"), v.literal("uncommon"), v.literal("rare"), v.literal("epic"), v.literal("legendary")),
  }),

  user_badges: defineTable({
    userId: v.id("users"),
    badgeId: v.id("badges"),
    awardedAt: v.number(),
  }).index("by_user", ["userId"]).index("by_user_badge", ["userId", "badgeId"]),

  points_history: defineTable({
    userId: v.id("users"),
    points: v.number(),
    reason: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  communities: defineTable({
    name: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    createdBy: v.id("users"),
    isPrivate: v.boolean(),
    membersCount: v.number(),
    category: v.string(),
  }),

  community_members: defineTable({
    communityId: v.id("communities"),
    userId: v.id("users"),
    role: v.string(),
    joinedAt: v.number(),
  }).index("by_community", ["communityId"]).index("by_user", ["userId"]).index("by_community_user", ["communityId", "userId"]),

  community_posts: defineTable({
    communityId: v.id("communities"),
    authorId: v.id("users"),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    likes: v.number(),
    createdAt: v.number(),
  }).index("by_community", ["communityId"]),

  post_likes: defineTable({
    postId: v.id("community_posts"),
    userId: v.id("users"),
    createdAt: v.number(),
  }).index("by_post", ["postId"]).index("by_user_post", ["userId", "postId"]),

  comments: defineTable({
    postId: v.id("community_posts"),
    authorId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_post", ["postId"]),

  chat_rooms: defineTable({
    name: v.optional(v.string()),
    type: v.string(),
    eventId: v.optional(v.id("events")),
    participants: v.array(v.id("users")),
    lastMessageAt: v.optional(v.number()),
  }).index("by_event", ["eventId"]).index("by_type", ["type"]).index("by_participants", ["participants"]),

  messages: defineTable({
    roomId: v.id("chat_rooms"),
    senderId: v.id("users"),
    content: v.string(),
    sentAt: v.number(),
    readBy: v.array(v.id("users")),
    fileUrl: v.optional(v.string()),
    fileType: v.optional(v.string()),
  }).index("by_room", ["roomId"]),

  files: defineTable({
    storageId: v.string(),
    userId: v.id("users"),
    name: v.string(),
    contentType: v.string(),
    size: v.number(),
    url: v.string(),
  }).index("by_user", ["userId"]),

  reviews: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    rating: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_event", ["eventId"]).index("by_user", ["userId"]),

  certificates: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    certificateNumber: v.string(),
    issueDate: v.number(),
    personalizedMessage: v.optional(v.string()),
  }).index("by_user", ["userId"]).index("by_event", ["eventId"]).index("by_certificate_number", ["certificateNumber"]),

  connections: defineTable({
    requesterId: v.id("users"),
    receiverId: v.id("users"),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_requester", ["requesterId"]).index("by_receiver", ["receiverId"]),

  challenges: defineTable({
    title: v.string(),
    description: v.string(),
    type: v.string(),
    xpReward: v.number(),
    criteria: v.string(),
    target: v.number(),
    icon: v.string(),
    isActive: v.boolean(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  }),

  user_challenges: defineTable({
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    progress: v.number(),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    startedAt: v.number(),
  }).index("by_user", ["userId"]).index("by_user_challenge", ["userId", "challengeId"]),

  system_settings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_key", ["key"]),

  audit_log: defineTable({
    userId: v.id("users"),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_resource", ["resource"]),

  activity_feed: defineTable({
    userId: v.id("users"),
    type: v.string(), // "registration", "badge_earned", "post_created", "event_created", "check_in", "connection"
    title: v.string(),
    description: v.optional(v.string()),
    link: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_created", ["createdAt"]),

  ai_chat_sessions: defineTable({
    userId: v.id("users"),
    title: v.string(),
    eventId: v.optional(v.id("events")),
    createdAt: v.number(),
    lastActivity: v.number(),
    context: v.optional(v.object({
      userRole: v.string(),
      eventTitle: v.optional(v.string()),
      currentPage: v.optional(v.string()),
    })),
  }).index("by_user", ["userId"]).index("by_last_activity", ["lastActivity"]),

  ai_chat_messages: defineTable({
    sessionId: v.id("ai_chat_sessions"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    createdAt: v.number(),
    actions: v.optional(v.array(v.object({
      label: v.string(),
      action: v.string(),
      data: v.optional(v.any()),
    }))),
  }).index("by_session", ["sessionId"]),

  automations: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    triggerType: v.string(),
    triggerConfig: v.any(),
    actions: v.array(v.object({
      id: v.string(),
      type: v.string(),
      config: v.any(),
      delay: v.optional(v.number()),
    })),
    isActive: v.boolean(),
    runCount: v.number(),
    successCount: v.number(),
    errorCount: v.number(),
    lastRun: v.optional(v.number()),
    n8nWebhookUrl: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  shared_reports: defineTable({
    eventId: v.id("events"),
    token: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    viewCount: v.number(),
  }).index("by_token", ["token"]).index("by_event", ["eventId"]),

  event_discussions: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    content: v.string(),
    parentMessageId: v.optional(v.id("event_discussions")),
    likes: v.number(),
    createdAt: v.number(),
    isQuestion: v.boolean(),
    isAnswered: v.optional(v.boolean()),
  }).index("by_event", ["eventId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number(),
  }).index("by_follower", ["followerId"]).index("by_following", ["followingId"]).index("by_both", ["followerId", "followingId"]),

  event_reactions: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    emoji: v.string(), // "🔥", "❤️", "👍", "😮", "🙌"
  }).index("by_event", ["eventId"]).index("by_user_event", ["userId", "eventId"]),
});