# Eventra — Complete Feature Specification

> **Last Updated:** 2026-06-28  
> **Architecture:** Next.js 15 + Drizzle ORM (PostgreSQL) + Clerk Auth + Supabase Storage + Resend Email + Genkit AI  
> **Status:** Active Development

---

## Table of Contents

1. [Authentication & User Management](#1-authentication--user-management)
2. [Event Management](#2-event-management)
3. [Ticketing System](#3-ticketing-system)
4. [Payment Integration](#4-payment-integration)
5. [AI-Powered Features](#5-ai-powered-features)
6. [Map & Campus Navigation](#6-map--campus-navigation)
7. [Photo Gallery](#7-photo-gallery)
8. [Certificate System](#8-certificate-system)
9. [Stakeholder & Staff Management](#9-stakeholder--staff-management)
10. [Attendee Management](#10-attendee-management)
11. [Analytics & Reporting](#11-analytics--reporting)
12. [Feedback System](#12-feedback-system)
13. [Event Updates & Communications](#13-event-updates--communications)
14. [Issue Tracking](#14-issue-tracking)
15. [Task Management (Kanban Board)](#15-task-management-kanban-board)
16. [Community & Social Features](#16-community--social-features)
17. [Gamification](#17-gamification)
18. [Chat & Messaging](#18-chat--messaging)
19. [Networking & Matchmaking](#19-networking--matchmaking)
20. [Admin Panel](#20-admin-panel)
21. [UI/UX Components](#21-uiux-components)
22. [Database Schema](#22-database-schema)
23. [API Routes & Server Actions](#23-api-routes--server-actions)
24. [Integrations](#24-integrations)
25. [Environment Variables](#25-environment-variables)
26. [Pages & Routes](#26-pages--routes)
27. [Email System](#27-email-system)
28. [Security Features](#28-security-features)

---

## 1. Authentication & User Management

### 1.1 Clerk Authentication System
- **Login Page** (`src/app/(auth)/login/[[...rest]]/page.tsx`) — Email/password + OAuth login via Clerk
- **Register Page** (`src/app/(auth)/register/[[...rest]]/page.tsx`) — Registration with Clerk
- **Onboarding** (`src/app/(auth)/onboarding/page.tsx`) — Post-registration profile setup wizard
- **Auth Layout** (`src/app/(auth)/layout.tsx`) — Dedicated auth layout (no sidebar)
- **Clerk Webhook** (`src/app/api/webhooks/clerk/route.ts`) — Sync user data from Clerk to DB
- **Session Management** — JWT tokens managed by `@clerk/nextjs`
- **Middleware** (`src/middleware.ts`) — Route protection

### 1.2 User Model (`src/lib/db/schema/index.ts` → `users`)
```
Fields:
- id: text (primary key, UUID)
- name: text
- email: text (required, indexed)
- emailVerified: timestamp
- image: text
- role: text (default: 'attendee') — Values: student, professional, organizer, admin, speaker, attendee, vendor
- onboardingCompleted: boolean (default: false)
- points: integer (default: 0)
- level: integer (default: 1)
- xp: integer (default: 0)
- bio: text
- skills: text[] (array)
- interests: text
- college: text
- degree: text ('ug' | 'pg')
- year: integer
- company: text
- designation: text
- country: text
- gender: text
- bloodGroup: text
- organizationName: text
- website: text
- phone: text
- mobile: text
- embedding: vector(768) — For AI recommendations
- createdAt: timestamp (default: now)
- updatedAt: timestamp (default: now)
```

### 1.3 Role-Based Access Control (RBAC)
**Roles:** `student`, `professional`, `organizer`, `admin`, `speaker`, `attendee`, `vendor`

**Event Staff Model** (`event_staff`):
```
Fields:
- id: uuid (primary key)
- eventId: uuid → events.id (cascade delete)
- userId: text → users.id (cascade delete)
- role: text — Values: volunteer, speaker, admin, moderator
- permissions: jsonb — Array of permission strings
- createdAt: timestamp (default: now)
- Unique constraint: (eventId, userId)
```

**Permission Categories (per role via `permissions` jsonb):**
- `canManageEvent` — Full event CRUD
- `canVerifyTickets` — Ticket scanning
- `canViewAttendees` — Attendee list access
- `canManageStakeholders` — Volunteer/speaker management
- `canViewAnalytics` — Analytics dashboard
- `canSendUpdates` — Event update creation
- `canManageCertificates` — Certificate generation
- `canManageGallery` — Photo upload/management

### 1.4 Auth Utilities (`src/lib/auth-utils.ts`)
- `getAuthContext()` — Returns userId, clerkId, mongoUser, isAuthenticated
- `getEventAuthContext(eventId)` — Full event context with role, permissions
- `canAccessEventManagement(userId, eventId)` — Boolean check
- `hasEventPermission(userId, eventId, permission)` — Granular check
- `requireAuth()` — Throws if not authenticated
- `requireEventAccess(eventId)` — Throws if no event access

---

## 2. Event Management

### 2.1 Event Model (`events` table)
```
Fields:
- id: uuid (primary key, random)
- slug: text (unique, indexed) — SEO-friendly slug
- title: text (required)
- description: text (required)
- startDate: timestamp (required, indexed)
- endDate: timestamp (required, indexed)
- imageUrl: text
- externalUrl: text
- sourceType: text (default: 'native') — native | scraped
- sourcePlatform: text — External platform source
- externalId: text — External event ID (indexed)
- category: text (required, indexed)
- status: text (default: 'draft', indexed) — draft | published | cancelled
- type: text (default: 'physical') — physical | online | hybrid
- location: jsonb (required) — { venue, address, city, country, lat, lng, isVirtual, virtualLink }
- capacity: integer (required)
- registeredCount: integer (default: 0)
- organizerId: text → users.id (indexed)
- price: decimal(10,2) (default: '0')
- isPaid: boolean (default: false)
- isRecurring: boolean (default: false)
- recurrenceRule: text — RRULE string
- parentEventId: uuid — For sub-events
- waitlistEnabled: boolean (default: false)
- visibility: text (default: 'public') — public | private | unlisted
- coOrganizerIds: text[] (array)
- embedding: vector(768) — For AI recommendations
- feedbackTemplateId: uuid → feedback_templates.id
- branding: jsonb — { primaryColor, logoUrl, customCss }
- createdAt: timestamp (default: now)
- updatedAt: timestamp (default: now)
```

### 2.2 Event Server Actions (`src/app/actions/events.ts`)
**`createEvent(eventData)`**:
1. Validates input with Zod
2. Generates unique slug from title
3. Creates event record
4. Links feedback template if provided
5. Assigns organizer role via `event_staff`
6. Revalidates cache paths

**`getEvents({query, category, page, limit})`**:
- Full-text search on title, description, location
- Category filtering
- Status filtering (published only for public)
- Paginated results

**`getEventById(eventId)`** — Populates organizer, staff, ticket tiers

**`updateEvent(eventId, eventData)`** — Updates event fields, revalidates paths

**`deleteEvent(eventId)`** — Cascade deletes related records

**`getEventsByUser(userId, page, limit)`** — Events organized by user

**`getRelatedEventsByCategory(categoryId, eventId, limit)`** — Similar events

### 2.3 Sub-Events
- Parent-child event hierarchy (`parentEventId`)
- Sub-events inherit parent capacity
- Separate event creation for sub-events

### 2.4 Event Form (`src/features/events/event-form.tsx`)
**Multi-step wizard** (`src/features/events/wizard/`):
- **Step 1** (`step-1-basic-info.tsx`): Title, category, description, image, tags
- **Step 2** (`step-2-date-location.tsx`): Dates, times, location, capacity, pricing
- **Smart Scheduler** (`smart-scheduler-assistant.tsx`): AI-assisted scheduling

**Fields:**
- Title, category, tags, description
- Image upload (Supabase Storage)
- Location with map picker (lat/lng)
- Start/end dates and times
- Capacity (unlimited support: -1)
- Pricing (free/paid toggle, price input)
- Visibility settings
- Waitlist toggle
- Recurring event support

### 2.5 Event Categories & Tags
- Predefined categories in constants
- Tags stored as text array on events
- Category filtering in explore page

### 2.6 Event Status Management
- Statuses: `draft`, `published`, `cancelled`
- Status-based UI rendering
- Bulk status updates

### 2.7 Event Discovery & Filtering
- **Explore Events** (`src/app/(app)/explore/page.tsx`)
- **Event Filters** (`src/features/events/explore-client.tsx`) — Category, date, price, status
- **Search** (`src/app/(app)/search/page.tsx`) — Full-text search with AI recommendations
- **Event Cards** (`src/features/events/event-card.tsx`)
- **My Events** (`src/app/(app)/my-events/page.tsx`)

---

## 3. Ticketing System

### 3.1 Ticket Tier Model (`ticket_tiers` table)
```
Fields:
- id: uuid (primary key)
- eventId: uuid → events.id (cascade delete)
- name: text (required)
- description: text
- price: decimal(10,2) (required)
- capacity: integer (required)
- registeredCount: integer (default: 0)
- createdAt: timestamp (default: now)
```

### 3.2 Ticket Model (`tickets` table)
```
Fields:
- id: uuid (primary key)
- eventId: uuid → events.id
- userId: text → users.id
- tierId: uuid → ticket_tiers.id
- ticketNumber: text (unique, indexed)
- entryCode: text (indexed) — 6-digit code for quick verification
- status: text (default: 'confirmed') — confirmed | pending | cancelled | checked-in | refunded | expired
- purchaseDate: timestamp (default: now)
- expiresAt: timestamp — Auto-set to event end + 24h
- price: decimal(10,2) (required)
- qrCode: text
- verifiedAt: timestamp — When ticket was verified
- verifiedBy: text — Who verified the ticket
- personalizedMessage: text
- metadata: jsonb — ticketType, seatNumber, section, additionalInfo
- createdAt: timestamp (default: now)
- updatedAt: timestamp (default: now)

Indexes:
- { eventId } — Event lookups
- { userId } — User ticket lookups
- { status } — Status filtering
- { entryCode } — Entry code lookups
- { entryCode, eventId } — Composite for verification
```

### 3.3 Order Flow
**`processFreeRegistration(eventId)`** (`src/app/actions/payments.ts`):
1. **Free Events**: Creates ticket directly with status 'confirmed'
2. Generates unique ticket number (TKT-{random})
3. Generates 6-digit entry code (100000-999999)
4. Sets expiration to event end + 24 hours
5. Sends confirmation email with entry code
6. Updates event `registeredCount`

**`createCheckoutSession(eventId)`** (`src/app/actions/payments.ts`):
1. **Paid Events**: Creates Dodo Payments checkout session
2. Lazy product creation if not exists
3. Returns checkout URL for redirect
4. Webhook confirms payment and creates ticket

**Ticket Cancellation** (`src/app/actions/registrations.ts`):
- Verifies ownership
- Updates ticket status to 'cancelled'
- Restores event capacity
- Triggers waitlist auto-promotion

### 3.4 QR Code Generation
- **Library:** `qrcode.react`
- **Component:** QR code displayed on ticket cards
- **Scanning:** `html5-qrcode` for camera-based QR scanning
- **Signing:** HMAC-SHA256 signature to prevent QR spoofing

### 3.5 Ticket Verification
**Check-in System** (`src/app/(app)/check-in/page.tsx`):
- Manual code entry (ticket number or 6-digit entry code)
- QR code scanning
- Real-time status update
- Verification timestamp + verifiedBy tracking
- Race-condition protection via optimistic locking

**Check-in Scanner** (`src/app/(app)/check-in-scanner/page.tsx`):
- Camera-based QR scanning interface
- Offline support with local attendee list
- Batch verification support
- Sound effects for success/error

**Entry Code Verification API** (`POST /api/tickets/verify`):
- 6-digit code verification
- Returns ticket details and attendee info
- Prevents double-scanning

### 3.6 My Tickets Page (`src/app/(app)/tickets/page.tsx`)
- List of all user tickets
- QR code display
- Entry code display
- Ticket status badges
- Event details linking
- PDF download with QR code

---

## 4. Payment Integration

### 4.1 Payment Provider
- **Dodo Payments** — REST API integration
- **Free Events:** Direct ticket creation (no payment needed)
- **Paid Events:** Checkout session redirect
- **Webhook handling** for payment confirmation

### 4.2 Checkout Flow (`src/app/actions/payments.ts`)
1. User selects ticket tier
2. System validates capacity
3. **Free Events:** Creates ticket directly with entry code
4. **Paid Events:**
   - Lazy creates Dodo product if not exists
   - Creates checkout session
   - Returns checkout URL for redirect
5. Webhook confirms payment
6. Ticket created and confirmed
7. Confirmation email sent with entry code

### 4.3 Webhook Handler (`POST /api/webhooks/dodo`)
- Receives payment confirmation events
- Validates webhook signatures
- Creates ticket with entry code
- Updates event registration count
- Sends confirmation email

---

## 5. AI-Powered Features

### 5.1 AI Event Recommendations (`src/lib/ai/index.ts`)
- **Technology:** Google Genkit with Gemini (`@genkit-ai/googleai`)
- **Vector embeddings** on events and users (pgvector, 768 dimensions)
- **User interest matching** based on skills, interests, past registrations
- **Recommendation caching** (`ai_recommendation_cache` table)

### 5.2 AI Chatbot (`src/app/api/ai/chat/route.ts`)
- **Technology:** Genkit AI flows
- Event-specific context injection
- Conversation history (`ai_chat_sessions` + `ai_chat_messages` tables)
- Floating AI chat component (`src/features/chat/floating-ai-chat.tsx`)
- Event-specific chatbot (`src/features/ai/event-chatbot.tsx`)

### 5.3 AI Task Generation
- Event-type specific task prompts
- Structured JSON output
- Kanban board integration
- Fallback tasks if AI fails

### 5.4 AI Report Generation
- Event performance analysis
- Financial summary
- Feedback analysis
- Export: PDF (jsPDF), Word (docx)
- Report storage in database

### 5.5 AI Insights & Analytics (`src/features/ai/ai-insights-client.tsx`)
- Predictive analytics for attendance
- Engagement scoring
- Smart recommendations for event improvements

### 5.6 AI Social Post Generator (`src/features/organizer/social-post-generator.tsx`)
- Generate social media posts for events
- Multiple platform formats
- Hashtag suggestions

### 5.7 Attendance Predictor (`src/features/organizer/attendance-predictor.tsx`)
- ML-based attendance prediction
- Historical data analysis
- Risk assessment for low turnout

---

## 6. Map & Campus Navigation

### 6.1 Interactive Map (`src/app/(app)/map/page.tsx`)
- **Library:** Leaflet + React-Leaflet
- **Tile Layer:** OpenStreetMap
- **Component:** `src/features/map/interactive-campus-map.tsx`

### 6.2 Campus Data (`src/features/map/map-data.ts`)
```
Predefined Locations with lat/lng coordinates:
- Main Gate, Cross Road, Block 1, Students Square
- Open Auditorium, Block 4, Xpress Cafe, Block 6
- Amphi Theater, PU Block, Architecture Block
```

### 6.3 Location Features
- Custom markers with popups
- Turn-by-turn routing (leaflets-routing-machine)
- Route styling (purple colored line)
- GPS detection
- Camera-based location detection
- Predictive location matching

---

## 7. Photo Gallery

### 7.1 Media Model (`event_media` table)
```
Fields:
- id: uuid (primary key)
- eventId: uuid → events.id (cascade delete)
- authorId: text → users.id (cascade delete)
- url: text (required)
- storageId: text (required) — Supabase storage path
- caption: text
- isApproved: boolean (default: false)
- visibility: text (default: 'public') — public | private
- viewCount: integer (default: 0)
- downloadCount: integer (default: 0)
- metadata: jsonb — { width, height, tags }
- createdAt: timestamp (default: now)
- updatedAt: timestamp (default: now)
```

### 7.2 Gallery Management
- **Upload Component** — Image upload via Supabase Storage
- **Gallery Grid** — Grid display with image count
- **Preview Dialog** — Full-size image preview
- **Moderation** — Organizer approval workflow (`isApproved` field)
- **Component:** `src/features/events/event-gallery.tsx`

### 7.3 Media Moderation (`src/features/organizer/media-moderation-client.tsx`)
- Approve/reject uploaded media
- Bulk moderation actions
- Content filtering

---

## 8. Certificate System

### 8.1 Certificate Template Model (`certificate_templates` table)
```
Fields:
- id: uuid (primary key)
- eventId: uuid → events.id (cascade delete)
- title: text (required)
- description: text
- layout: jsonb (required) — { backgroundUrl, fields: [{ id, type, x, y, size, color, value }] }
- html: text — Static HTML version for rendering
- isDefault: boolean (default: false)
- createdAt: timestamp (default: now)
- updatedAt: timestamp (default: now)
```

### 8.2 Certificate Generation
- **Template Builder** (`src/features/certificates/certificate-template-builder.tsx`)
- **Certificate Card** (`src/features/certificates/certificate-card.tsx`)
- **Bulk Distribution** (`src/features/certificates/bulk-distribution-client.tsx`)
- **Generator Utility** (`src/core/utils/certificate-generator.ts`)
- **Verify Page** (`src/app/(app)/certificates/verify/page.tsx`)

### 8.3 Certificate Features
- Role-based certificates (Participant, Volunteer, Speaker)
- Custom field placement (x, y coordinates)
- HTML-based preview with iframe
- PDF generation via jsPDF
- Bulk ZIP download
- Email distribution with personalized certificates
- Certificate verification system

---

## 9. Stakeholder & Staff Management

### 9.1 Event Staff Model (`event_staff` table)
```
Fields:
- id: uuid (primary key)
- eventId: uuid → events.id (cascade delete)
- userId: text → users.id (cascade delete)
- role: text — volunteer, speaker, admin, moderator
- permissions: jsonb — Array of permission strings
- createdAt: timestamp (default: now)
- Unique constraint: (eventId, userId)
```

### 9.2 Staff Management UI
- **Staff Manager** (`src/features/organizer/staff-manager-client.tsx`)
- **Co-Organizer Manager** (`src/features/organizer/co-organizer-manager.tsx`)
- **Guest List Manager** (`src/features/organizer/guest-list-manager-client.tsx`)
- **Role Assignment** with permission matrix
- **Bulk operations** for staff updates

### 9.3 Sponsors Management
- **Sponsor Manager** (`src/features/organizer/sponsor-manager-client.tsx`)
- Sponsor tiers (bronze, silver, gold, platinum)
- Lead scanning and tracking (`sponsor_leads` table)
- Sponsor visibility ordering

---

## 10. Attendee Management

### 10.1 Attendee Data
- Paginated attendee lists via server actions
- Search by name/email
- Verification status tracking
- Export to Excel (xlsx library)

### 10.2 Attendee Views
- **Attendee Dashboard** (`src/features/dashboard/attendee-dashboard.tsx`)
- **Check-in View** (`src/features/check-in/attendee-check-in-view.tsx`)
- **Registration tracking** (`src/app/actions/registrations.ts`)

### 10.3 Data Export (`src/app/(app)/export/page.tsx`)
- Excel export of attendee data
- Two-sheet workbook: Event Info + Attendees
- Custom field selection

---

## 11. Analytics & Reporting

### 11.1 Analytics Dashboard (`src/app/(app)/analytics/page.tsx`)
- **Comprehensive Dashboard** (`src/features/analytics/comprehensive-analytics-dashboard.tsx`)
- **Organizer Analytics** (`src/features/analytics/organizer-analytics-dashboard.tsx`)
- **AI Insights Widget** (`src/features/analytics/ai-insights-widget.tsx`)
- **Engagement Metrics** (`src/features/dashboard/engagement-metrics.tsx`)

### 11.2 Analytics Data
- Event stats: tickets sold, revenue, capacity utilization
- Feedback analytics: satisfaction scores, NPS
- Issue analytics: counts, resolution rates
- Revenue tracking and financial summaries
- Charts via Recharts library

### 11.3 Deep Insights (`src/features/organizer/deep-insights-dashboard.tsx`)
- Advanced analytics with AI
- Predictive modeling
- Comparative analysis

### 11.4 Admin Analytics (`src/features/admin/admin-analytics-overview.tsx`)
- Platform-wide statistics
- User growth metrics
- Event category distribution

---

## 12. Feedback System

### 12.1 Feedback Template Model (`feedback_templates` table)
```
Fields:
- id: uuid (primary key)
- eventId: uuid → events.id (cascade delete)
- title: text (required)
- description: text
- questions: jsonb (required) — Array of { id, type, label, options? }
- isDefault: boolean (default: false)
- createdAt: timestamp (default: now)
```

### 12.2 Feedback Response Model (`event_feedback` table)
```
Fields:
- id: uuid (primary key)
- eventId: uuid → events.id (cascade delete)
- userId: text → users.id (cascade delete)
- rating: integer (required) — 1-5 stars
- comment: text
- responses: jsonb — Key-value pairs for custom questions
- createdAt: timestamp (default: now)
- Unique constraint: (userId, eventId) — One response per user per event
```

### 12.3 Feedback UI
- **Submission Form** (`src/features/feedback/feedback-submission-form.tsx`)
- **Dynamic Form** (`src/features/events/dynamic-feedback-form.tsx`)
- **Template Builder** (`src/features/feedback/feedback-template-builder.tsx`)
- **Analytics Dashboard** (`src/features/feedback/feedback-analytics-dashboard.tsx`)
- **Organizer Feedback** (`src/features/organizer/feedback-analytics.tsx`)

### 12.4 Feedback Features
- Default rating questions (1-5 stars)
- NPS score (1-10)
- Custom questions (rating, text, multiple choice, yes/no)
- Anonymous feedback support
- Response rate tracking
- Email-based feedback requests

---

## 13. Event Updates & Communications

### 13.1 Announcement System
- **Announcement Manager** (`src/features/organizer/announcement-manager.tsx`)
- **Announcement Banner** (`src/features/events/announcement-banner.tsx`)
- **Event Updates Management** — Create, publish, send updates

### 13.2 Update Types
- Announcement
- Schedule change
- Location change
- Cancellation
- Reminder
- General

### 13.3 Recipient Targeting
- All users
- Specific users
- Role-based targeting (attendee, speaker, organizer, volunteer)

### 13.4 Email Communications
- **Email Service** (`src/core/services/email.ts`) — Resend integration
- **API Route** (`src/app/api/send-email/route.ts`)
- Bulk email sending
- Email tracking stats (sent, delivered, opened, clicked, bounced)
- Certificate emails, thank-you emails, feedback request emails

---

## 14. Issue Tracking

### 14.1 Issue Categories
- Event information
- Tickets & registration
- Event experience
- Payments
- Other

### 14.2 Issue Severity
- Low
- Medium
- High

### 14.3 Issue Status Workflow
- Open → In Progress → Resolved → Closed

### 14.4 Issue Features
- Report issues with category selection
- Attachments support
- Admin notes for internal tracking
- Status updates with timestamps
- Search and filtering

---

## 15. Task Management (Kanban Board)

### 15.1 Task Model
- Fields: id, content, column, priority, estimatedDuration, completed, subtasks[], event, organizer
- Columns: Planning, In Progress, Review, Completed
- Priority: High, Medium, Low

### 15.2 Kanban Board
- **Event Planning** (`src/app/actions/event-planning.ts`)
- Drag & drop reordering
- Subtask support
- Priority badges (color-coded)
- AI auto-generation of tasks
- Progress tracking

---

## 16. Community & Social Features

### 16.1 Community Model (`communities` table)
```
Fields:
- id: uuid (primary key)
- name: text (required)
- description: text (required)
- image: text
- category: text (required)
- isPrivate: boolean (default: false)
- creatorId: text → users.id
- memberCount: integer (default: 1)
- createdAt: timestamp (default: now)
```

### 16.2 Community Members (`community_members` table)
```
Fields:
- communityId: uuid → communities.id (composite PK)
- userId: text → users.id (composite PK)
- role: text (default: 'member')
- joinedAt: timestamp (default: now)
```

### 16.3 Posts & Comments
- **Posts** (`posts` table) — Content, image, likes, community/author links
- **Comments** (`comments` table) — Content, author, post links
- **Activity Feed** (`activity_feed` table) — User actions tracking

### 16.4 Community UI
- **Community List** (`src/features/community/community-list.tsx`)
- **Community Detail** (`src/features/community/community-detail.tsx`)
- **Feed** (`src/features/feed/feed-client.tsx`, `live-feed-client.tsx`)
- **Discussion Board** (`src/features/events/event-discussion-board.tsx`)
- **Polls** (`src/features/events/event-polls.tsx`)
- **Reactions** (`src/features/events/event-reactions.tsx`)
- **Comment Section** (`src/features/feed/comment-section.tsx`)
- **Event Pulse** (`src/features/feed/event-pulse-client.tsx`)

---

## 17. Gamification

### 17.1 Badge System
- **Badges** (`badges` table) — name, description, icon, category, criteria (jsonb)
- **User Badges** (`user_badges` table) — userId, badgeId, awardedAt
- **Badge Showcase** (`src/features/gamification/badge-showcase.tsx`)
- **Seed Data** (`src/lib/db/seed-badges.ts`)

### 17.2 Points & Levels
- Users earn points for actions
- Level progression based on XP
- XP tracking on user model

### 17.3 Leaderboard
- **Leaderboard Page** (`src/app/(app)/leaderboard/page.tsx`)
- **Leaderboard Client** (`src/features/leaderboard/leaderboard-client.tsx`)
- Ranking by points/level

### 17.4 Challenges
- **Challenges Hub** (`src/features/gamification/challenges-hub.tsx`)
- **Challenge Actions** (`src/app/actions/challenges.ts`)
- Challenge completion tracking

---

## 18. Chat & Messaging

### 18.1 Chat Models
- **Chat Rooms** (`chat_rooms` table) — name, type (direct/group/event), eventId
- **Chat Participants** (`chat_participants` table) — roomId, userId
- **Chat Messages** (`chat_messages` table) — roomId, senderId, content, imageUrl

### 18.2 Chat UI
- **Enhanced Chat** (`src/features/chat/enhanced-chat-client.tsx`)
- **User Picker** (`src/features/chat/user-picker.tsx`)
- **Chat Page** (`src/app/(app)/chat/page.tsx`)
- Real-time messaging
- Image sharing
- Event-specific chat rooms

---

## 19. Networking & Matchmaking

### 19.1 Matchmaking System
- **Vector-based matching** using user embeddings (pgvector)
- **Matchmaking View** (`src/features/matchmaking/matchmaking-view.tsx`)
- **Matchmaking Section** (`src/features/networking/matchmaking-section.tsx`)
- **Matchmaking Card** (`src/features/networking/matchmaking-card.tsx`)
- AI conversation starters

### 19.2 Networking Features
- **Networking Client** (`src/features/networking/networking-client.tsx`)
- **Follow System** (`follows` table) — followerId, followingId
- **Follow Button** (`src/components/shared/follow-button.tsx`)
- User discovery and connections

### 19.3 Referral System (`src/features/dashboard/referral-system.tsx`)
- Referral code generation
- Referral tracking
- Reward system

---

## 20. Admin Panel

### 20.1 Admin Dashboard (`src/app/(app)/admin/page.tsx`)
- **Admin Dashboard** (`src/features/admin/admin-dashboard.tsx`)
- **Admin Analytics** (`src/features/admin/admin-analytics-overview.tsx`)
- **User Management** (`src/features/admin/user-management.tsx`)
- **System Settings** (`src/features/admin/system-settings.tsx`)
- **System Maintenance** (`src/features/admin/system-maintenance-panel.tsx`)

### 20.2 Event Moderation
- **Event Moderation** (`src/features/admin/event-moderation.tsx`)
- **Event Scraper** (`src/features/admin/event-scraper-tool.tsx`)
- Approve/reject events
- Content moderation

### 20.3 Admin Features
- User role management
- Platform analytics
- Event oversight
- System configuration
- Database management

---

## 21. UI/UX Components

### 21.1 Shadcn/ui Components (`src/components/ui/`)
- accordion, alert-dialog, avatar, badge, button, calendar, card
- checkbox, chart, dialog, dropdown-menu, form, input, label
- popover, progress, radio-group, scroll-area, select, separator
- sheet, skeleton, switch, table, tabs, textarea, toast, toaster
- tooltip

### 21.2 Layout Components (`src/components/layout/`)
- Header, Sidebar, Organizer Sidebar
- Brand Logo

### 21.3 Shared Components (`src/components/shared/`)
- Empty State, Export Button, Follow Button
- Language Switcher, Error Boundary

### 21.4 Providers
- Theme Provider (`src/components/providers.tsx`) — next-themes dark/light mode
- Clerk Provider integration

### 21.5 Feature Components (`src/features/`)
- **Home:** Landing page
- **Auth:** Onboarding wizard, Register wizard, Login form
- **Events:** Event card, Event details, Event form, Event creation wizard, My events
- **Dashboard:** Organizer dashboard, Attendee dashboard
- **Analytics:** Comprehensive dashboard, Organizer dashboard, AI insights
- **Feedback:** Template builder, Submission form, Analytics dashboard
- **Certificates:** Template builder, Certificate card, Bulk distribution
- **Tickets:** Ticketing client, My tickets
- **Check-in:** Attendee check-in, Scanner
- **Chat:** Enhanced chat, Floating AI chat, User picker
- **Community:** List, Detail
- **Feed:** Activity feed, Live feed, Event pulse, Comments
- **Gamification:** Client, Challenges hub, Badge showcase
- **Leaderboard:** Client
- **Map:** Interactive campus map
- **AI:** Tools client, Insights, Event chatbot, Recommendation dashboard
- **Organizer:** Revenue dashboard, Announcement manager, Staff manager, Sponsor manager, etc.

### 21.6 Theme & Animations
- `next-themes` for dark/light mode
- `framer-motion` for animations
- `recharts` for charts
- `tailwindcss-animate` for Tailwind animations

---

## 22. Database Schema

### 22.1 Tables (25 total)

| # | Table | Purpose |
|---|-------|---------|
| 1 | `users` | User profiles with Clerk auth link |
| 2 | `account` | OAuth provider accounts |
| 3 | `session` | User sessions |
| 4 | `verificationToken` | Email verification tokens |
| 5 | `events` | Core event data |
| 6 | `ticket_tiers` | Ticket type definitions |
| 7 | `tickets` | Individual ticket records |
| 8 | `waitlist` | Event waitlist |
| 9 | `communities` | User communities |
| 10 | `community_members` | Community membership |
| 11 | `posts` | Community posts |
| 12 | `comments` | Post comments |
| 13 | `badges` | Gamification badges |
| 14 | `user_badges` | Awarded badges |
| 15 | `notifications` | User notifications |
| 16 | `follows` | User follow relationships |
| 17 | `chat_rooms` | Chat room definitions |
| 18 | `chat_participants` | Chat room members |
| 19 | `chat_messages` | Chat messages |
| 20 | `ai_chat_sessions` | AI conversation sessions |
| 21 | `ai_chat_messages` | AI conversation messages |
| 22 | `ai_recommendation_cache` | Cached AI recommendations |
| 23 | `rate_limits` | API rate limiting |
| 24 | `feedback_templates` | Feedback form templates |
| 25 | `certificate_templates` | Certificate designs |
| 26 | `event_feedback` | Feedback responses |
| 27 | `event_staff` | Event staff assignments |
| 28 | `sponsors` | Event sponsors |
| 29 | `activity_feed` | User activity log |
| 30 | `event_media` | Gallery photos/media |
| 31 | `sponsor_leads` | Sponsor lead tracking |
| 32 | `ingestion_sources` | External event sources |

### 22.2 Key Indexes
- Users: email, embedded vector
- Events: startDate, category, status, slug (unique), organizerId, externalId, embedded vector
- Tickets: eventId, userId, status, ticketNumber (unique)
- Communities: creator
- Posts: community, author
- Chat: room, user, session, sender
- Notifications: user, read

---

## 23. API Routes & Server Actions

### 23.1 Server Actions (`src/app/actions/`)

| File | Purpose |
|------|---------|
| `admin.ts` | Admin operations |
| `analytics.ts` | Analytics data retrieval |
| `announcements.ts` | Event announcements |
| `ai-recommendations.ts` | AI recommendation generation |
| `ai-tools.ts` | AI tool operations |
| `certificates.ts` | Certificate generation/distribution |
| `challenges.ts` | Gamification challenges |
| `chat.ts` | Chat operations |
| `check-in.ts` | Ticket check-in |
| `collab.ts` | Collaboration features |
| `communities.ts` | Community CRUD |
| `dashboard.ts` | Dashboard data |
| `event-engagement.ts` | Event engagement metrics |
| `event-insights.ts` | Event insights |
| `event-planning.ts` | Event planning/tasks |
| `events.ts` | Event CRUD |
| `feed.ts` | Activity feed |
| `feedback.ts` | Feedback operations |
| `gamification.ts` | Gamification logic |
| `health.ts` | Health check |
| `ingestion.ts` | Data ingestion |
| `matchmaking.ts` | Networking matchmaking |
| `media.ts` | Media operations |
| `moderation.ts` | Content moderation |
| `networking.ts` | Networking features |
| `notifications.ts` | Notification operations |
| `organizer-tools.ts` | Organizer utilities |
| `registrations.ts` | Event registrations |
| `scraper.ts` | Event scraping |
| `search.ts` | Search operations |
| `sponsors.ts` | Sponsor management |
| `tickets.ts` | Ticket operations |
| `users.ts` | User operations |
| `waitlist.ts` | Waitlist management |

### 23.2 API Routes (`src/app/api/`)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/webhooks/clerk` | Clerk webhook handler |
| POST | `/api/send-email` | Email sending |
| POST | `/api/ai/chat` | AI chat endpoint |

---

## 24. Integrations

| Service | Purpose | Package/Method |
|---------|---------|----------------|
| Clerk | Authentication | `@clerk/nextjs` |
| Supabase | Database + Storage | `@supabase/supabase-js`, `postgres` |
| Drizzle ORM | Database ORM | `drizzle-orm`, `drizzle-kit` |
| Google Genkit | AI features | `genkit`, `@genkit-ai/googleai`, `@genkit-ai/dotprompt` |
| Resend | Email service | `resend` |
| Twilio | SMS/WhatsApp | `twilio` |
| qrcode.react | QR code generation | `qrcode.react` |
| html5-qrcode | QR code scanning | `html5-qrcode` |
| jsPDF | PDF generation | `jspdf` |
| docx | Word generation | `docx` |
| jszip | ZIP creation | `jszip` |
| html2canvas | HTML to canvas | `html2canvas` |
| Recharts | Charts | `recharts` |
| Framer Motion | Animations | `framer-motion` |
| React DnD | Drag and drop | (planned) |
| TanStack Query | Data fetching | `@tanstack/react-query` |
| Zod | Validation | `zod` |
| React Hook Form | Forms | `react-hook-form` |
| PapaParse | CSV parsing | `papaparse` |
| Svix | Webhook verification | `svix` |
| RRule | Recurring events | `rrule` |
| next-themes | Dark/light mode | `next-themes` |
| next-intl | Internationalization | `next-intl` |
| Lucide React | Icons | `lucide-react` |

---

## 25. Environment Variables

```
# Database
DATABASE_URL=

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI (Genkit + Gemini)
GEMINI_API_KEY=
GOOGLE_GENAI_API_KEY=

# Email (Resend)
RESEND_API_KEY=

# SMS (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=

# Webhook
SVIX_WEBHOOK_SECRET=
```

---

## 26. Pages & Routes

### 26.1 Auth Routes
| Route | Purpose |
|-------|---------|
| `/login/[[...rest]]` | Login page |
| `/register/[[...rest]]` | Registration page |
| `/onboarding` | Post-registration profile setup |

### 26.2 App Routes
| Route | Purpose |
|-------|---------|
| `/` | Home page with landing |
| `/explore` | Browse all events |
| `/events` | Events listing |
| `/events/create` | Create new event |
| `/events/[id]` | Event detail page |
| `/events/[id]/edit` | Edit event |
| `/events/[id]/feedback` | Submit feedback |
| `/events/[id]/claim-spot` | Claim waitlist spot |
| `/my-events` | My organized events |
| `/dashboard` | User dashboard |
| `/organizer` | Organizer dashboard |
| `/organizer/analytics` | Organizer analytics |
| `/organizer/certificates` | Certificate management |
| `/organizer/feedback` | Feedback management |
| `/organizer/feedback/[eventId]` | Event-specific feedback |
| `/organizer/media` | Media management |
| `/organizer/media/[eventId]` | Event-specific media |
| `/organizer/collab` | Collaboration management |
| `/organizer/collab/[eventId]` | Event-specific collab |
| `/organizer/ai-insights` | AI insights |
| `/tickets` | My tickets |
| `/check-in` | Check-in dashboard |
| `/check-in-scanner` | QR scanner |
| `/certificates` | My certificates |
| `/certificates/verify` | Verify certificate |
| `/analytics` | Analytics dashboard |
| `/feedback/[eventId]` | Event feedback view |
| `/calendar` | Event calendar |
| `/search` | Search events |
| `/map` | Campus map |
| `/community` | Communities |
| `/community/[id]` | Community detail |
| `/chat` | Chat messaging |
| `/feed` | Activity feed |
| `/networking` | Networking hub |
| `/matchmaking` | Matchmaking |
| `/gamification` | Gamification hub |
| `/leaderboard` | Leaderboard |
| `/ai-tools` | AI tools |
| `/ai-recommendations` | AI recommendations |
| `/admin` | Admin panel |
| `/preferences` | User preferences |
| `/settings` | Settings |
| `/notifications` | Notifications |
| `/profile` | User profile |
| `/export` | Data export |
| `/agenda` | Event agenda |
| `/maintenance` | Maintenance page |
| `/offline` | Offline page |

---

## 27. Email System

### 27.1 Email Templates (`src/core/services/email.ts`)

**1. Confirmation Email:**
- Registration confirmation
- Ticket number display
- "View My Tickets" CTA button

**2. Certificate Email:**
- Certificate ready notification
- "Download Certificate" CTA button

**3. Announcement Email:**
- Event update notification
- Content preview
- Event link CTA

**4. Feedback Email:**
- Feedback request with event details
- Time estimate
- CTA to feedback form

**5. Thank You Email:**
- Post-event appreciation
- Event highlights
- Certificate download link

**6. Ticket Confirmation Email:**
- Event details
- Ticket ID and entry codes
- Important information

### 27.2 Email Service
- **Provider:** Resend
- **Bulk sending** with rate limiting
- **Email tracking** stats

---

## 28. Security Features

- **JWT Authentication** via Clerk
- **Role-Based Access Control** with granular permissions
- **Zod Validation** on all inputs
- **Server Actions** with `'use server'` directive
- **Environment Variables** for all secrets
- **Rate Limiting** (`rate_limits` table)
- **Webhook Signature Verification** (Svix)
- **Middleware** route protection
- **Content Moderation** system
- **CORS** configuration via Next.js middleware

---

## Missing Features (To Be Implemented)

### Priority 1 — Critical (Must Have)
| Feature | Status | Notes |
|---------|--------|-------|
| Dodo Payments Integration | ✅ Complete | REST API integration with checkout flow |
| Sub-Event System | ❌ Missing | Parent-child event hierarchy |
| AI Task Generation | ❌ Missing | Gemini-based Kanban auto-generation |
| AI Location Prediction | ❌ Missing | Roboflow + Gemini + GPS hybrid |
| Stakeholder Management | ❌ Missing | Separate model from event_staff |
| Issue Tracking | ❌ Missing | User-facing issue reporting |
| Event Updates/Notifications | ❌ Missing | 6 update types with email |
| Ticket Entry Codes | ✅ Complete | 6-digit codes with verification API |
| Ticket Cancellation | ✅ Complete | Cancellation with capacity restore + waitlist promotion |

### Priority 2 — Important (Should Have)
| Feature | Status | Notes |
|---------|--------|-------|
| Leaflet Navigation Map | ❌ Missing | Turn-by-turn directions |
| Location Detection | ❌ Missing | Camera + GPS + AI |
| Certificate PDF Generation | ⚠️ Partial | Generator utility exists, needs full integration |
| Feedback Custom Questions | ⚠️ Partial | Template builder exists, needs full CRUD |
| Bulk Email Communications | ⚠️ Partial | Basic email exists, needs bulk templates |
| Social Sharing | ❌ Missing | WhatsApp, Telegram, Email, Copy Link |
| Feedback Email Distribution | ❌ Missing | Send feedback request emails |

### Priority 3 — Nice to Have
| Feature | Status | Notes |
|---------|--------|-------|
| ImageKit Integration | ❌ Missing | Using Supabase Storage instead |
| UploadThing | ❌ Missing | Using Supabase Storage instead |
| GSAP Animations | ❌ Missing | Using Framer Motion instead |
| Embla Carousel | ❌ Missing | Not installed |

---

*Document created: 2026-06-28*  
*Architecture: Next.js 15 + Drizzle ORM + PostgreSQL + Clerk + Supabase + Genkit AI*
