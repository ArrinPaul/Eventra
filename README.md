# Eventra -- Intelligent Event Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle--ORM-0.45-orange?style=flat-square)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shades.io/badge/License-Proprietary-red?style=flat-square)](#license)

An enterprise-grade event management platform that automates the full lifecycle of complex events. Built with Next.js 15, PostgreSQL with pgvector, Drizzle ORM, Clerk authentication, and Google Gemini AI. Eventra transforms passive event hosting into an active, data-driven, and community-centric experience.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Core Systems](#core-systems)
  - [Authentication and Authorization](#authentication-and-authorization)
  - [Event Lifecycle](#event-lifecycle)
  - [Ticketing and Payments](#ticketing-and-payments)
  - [AI Intelligence Engine](#ai-intelligence-engine)
  - [Vector Recommendation Engine](#vector-recommendation-engine)
  - [Communication Hub](#communication-hub)
  - [Campus Map and Navigation](#campus-map-and-navigation)
- [Database](#database)
- [API Routes](#api-routes)
- [Server Actions](#server-actions)
- [Environment Variables](#environment-variables)
- [Setup](#setup)
- [Database Setup](#database-setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Known Issues](#known-issues)
- [License](#license)

---

## Architecture

Eventra follows a Feature-First modular architecture. Four integrated engines power the platform: Intelligence (AI), Recommendation (vector search), Communication (email/SMS/chat), and Lifecycle (events/ticketing/payments). Server Components and Server Actions handle all business logic through a centralized engine router.

```mermaid
graph TD
    subgraph Presentation["Presentation Layer"]
        A["Next.js 15 App Router"] --> B["Server Components"]
        A --> C["Client Components"]
        A --> D["Middleware - Clerk Auth"]
    end

    subgraph Business["Business Logic Layer"]
        B --> E["Server Actions / API Handlers"]
        C --> E
        E --> F{"Engine Router"}
        F -->|AI Request| G["Intelligence Engine"]
        F -->|Search/Match| H["Recommendation Engine"]
        F -->|Messaging| I["Communication Hub"]
        F -->|Events/Tickets| J["Lifecycle Engine"]
    end

    subgraph Data["Data and External Layer"]
        G --> K[("Supabase PostgreSQL + pgvector")]
        H --> K
        I --> K
        J --> K
        G --> L["Google Gemini API"]
        I --> M["Resend Email"]
        I --> N["Twilio SMS"]
        J --> O["Dodo Payments"]
    end

    style G fill:#7C3AED,stroke:#fff,color:#fff
    style H fill:#06B6D4,stroke:#fff,color:#fff
    style I fill:#10B981,stroke:#fff,color:#fff
    style J fill:#F59E0B,stroke:#fff,color:#fff
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15.5 | App Router, Server Components, Server Actions, Turbopack |
| Language | TypeScript 5 | Type-safe development with strict mode |
| Authentication | Clerk 7.3 | OAuth, JWT sessions, Webhooks, Role-based access |
| Database | PostgreSQL 15 (Supabase) | Relational data, pgvector for AI embeddings |
| ORM | Drizzle ORM 0.45 | Type-safe queries, migrations, schema management |
| AI | Google Gemini 1.5 Flash + Genkit | Content generation, predictions, embeddings, chatbot |
| Payments | Dodo Payments | Checkout sessions, refunds, webhook handling |
| Email | Resend | Transactional email with 7 HTML templates |
| SMS | Twilio | SMS notifications |
| UI Components | Shadcn/ui + Radix UI | 48 pre-built accessible components |
| Styling | Tailwind CSS + tailwindcss-animate | Utility-first CSS with animation support |
| Charts | Recharts | Data visualization and analytics dashboards |
| Maps | Leaflet + React-Leaflet | Real-world campus maps |
| PDF Generation | jsPDF + html2canvas | Certificate generation and bulk export |
| QR Codes | qrcode.react | Ticket QR code rendering |
| State Management | TanStack React Query | Server state caching and synchronization |
| Form Handling | React Hook Form + Zod | Form validation and error handling |
| Internationalization | next-intl | Multi-language support (English, Spanish) |
| Date Handling | date-fns | Date formatting and manipulation |
| Recurrence | rrule | Recurring event scheduling |

---

## Project Structure

```
Eventra/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── (app)/                        # Authenticated routes (33 pages with sidebar)
│   │   │   ├── admin/                    # Admin dashboard, user management
│   │   │   ├── events/                   # Event CRUD, detail, edit, create
│   │   │   ├── tickets/                  # User ticket management
│   │   │   ├── community/                # Community feeds and discussions
│   │   │   ├── chat/                     # Real-time messaging
│   │   │   ├── certificates/             # Certificate management and verification
│   │   │   ├── organizer/                # Organizer tools, analytics, reports, media
│   │   │   ├── map/                      # Interactive campus map with pathfinding
│   │   │   ├── gamification/             # Badges, challenges, XP system
│   │   │   ├── networking/               # Professional networking hub
│   │   │   ├── matchmaking/              # AI-powered connection matching
│   │   │   ├── check-in/                 # Attendee check-in dashboard
│   │   │   ├── check-in-scanner/         # QR code scanner for check-in
│   │   │   ├── analytics/                # Event analytics dashboard
│   │   │   ├── feedback/                 # Feedback forms and responses
│   │   │   ├── preferences/              # User settings and preferences
│   │   │   └── profile/                  # User profiles with social features
│   │   ├── (auth)/                       # Unauthenticated routes
│   │   │   ├── login/                    # Clerk login
│   │   │   ├── register/                 # Clerk registration
│   │   │   └── onboarding/               # Post-registration profile wizard
│   │   ├── api/                          # 21 API Route Handlers
│   │   │   ├── webhooks/clerk/           # Clerk user sync webhook
│   │   │   ├── webhooks/dodo/            # Dodo Payments webhook
│   │   │   ├── ai/chat/                  # AI chatbot endpoint
│   │   │   ├── tickets/verify/           # Ticket verification
│   │   │   ├── certificates/             # Generate, distribute, preview
│   │   │   ├── feedback/                 # Submit and responses
│   │   │   ├── issues/                   # Issue tracking CRUD
│   │   │   ├── stakeholders/             # Stakeholder management
│   │   │   ├── tasks/                    # Kanban task operations
│   │   │   ├── event-updates/            # Event announcements
│   │   │   ├── reports/                  # AI report generation
│   │   │   ├── predict/                  # Location prediction
│   │   │   ├── send-email/               # Email sending
│   │   │   ├── health/                   # Health check with DB connectivity
│   │   │   └── event-gallery/            # Photo gallery
│   │   ├── actions/                      # 44 Server Action files
│   │   ├── globals.css                   # Global styles with CSS variables
│   │   ├── layout.tsx                    # Root layout with providers
│   │   └── page.tsx                      # Landing page
│   ├── features/                         # Feature-first modules (25 domains)
│   │   ├── events/                       # Event components and forms
│   │   ├── ticketing/                    # Ticket display and management
│   │   ├── ai/                           # AI-powered components
│   │   ├── chat/                         # Chat interface components
│   │   ├── community/                    # Community and social components
│   │   ├── certificates/                 # Certificate builder and viewer
│   │   ├── map/                          # Interactive SVG campus map
│   │   ├── gamification/                 # Badge showcase and leaderboard
│   │   ├── networking/                   # Networking hub components
│   │   ├── matchmaking/                  # Match suggestion cards
│   │   ├── admin/                        # Admin panel components
│   │   ├── analytics/                    # Chart and dashboard components
│   │   ├── feedback/                     # Feedback form components
│   │   ├── organizer/                    # Organizer tool components
│   │   ├── profile/                      # Profile display components
│   │   ├── feed/                         # Activity feed components
│   │   ├── notifications/                # Notification components
│   │   ├── check-in/                     # Check-in components
│   │   ├── export/                       # Data export components
│   │   ├── home/                         # Home page components
│   │   ├── dashboard/                    # Dashboard widgets
│   │   ├── preferences/                  # Settings components
│   │   ├── leaderboard/                  # Ranking display
│   │   ├── search/                       # Search components
│   │   └── auth/                         # Auth-related components
│   ├── components/                       # Shared Shadcn/ui components (48)
│   ├── core/                             # Core business logic
│   │   ├── auth/                         # Session token management
│   │   ├── services/                     # Email, SEO, locale services
│   │   ├── utils/                        # Crypto (QR signing), certificate generation
│   │   └── config/                       # App configuration
│   ├── hooks/                            # Custom React hooks
│   ├── i18n/                             # Internationalization config
│   ├── lib/                              # Shared libraries
│   │   ├── db/                           # Database connection and 32-table schema
│   │   ├── ai/                           # Genkit AI flows
│   │   ├── supabase/                     # Supabase client
│   │   ├── auth-utils.ts                 # 9 auth utility functions
│   │   ├── rate-limit.ts                 # DB-backed rate limiting
│   │   ├── logger.ts                     # Structured JSON logging
│   │   ├── campus-locations.ts           # 11 campus location definitions
│   │   ├── gps-service.ts                # GPS singleton service
│   │   ├── gps-utils.ts                  # Haversine distance, campus bounds
│   │   └── hybrid-prediction.ts          # GPS + AI location prediction
│   ├── types/                            # TypeScript type definitions
│   └── middleware.ts                      # Clerk middleware with route protection
├── drizzle/                              # Database migration files
├── scripts/                              # Build, seed, and utility scripts
├── public/                               # Static assets
├── messages/                             # i18n translation files (en, es)
└── [config files]                        # next.config.ts, drizzle.config.ts, etc.
```

---

## Core Systems

### Authentication and Authorization

Eventra uses Clerk for authentication with a layered authorization system. The middleware intercepts all non-public routes and enforces authentication. Admin routes receive additional role-based protection.

```mermaid
sequenceDiagram
    participant U as User
    participant M as Middleware
    participant C as Clerk
    participant SA as Server Action
    participant DB as Database

    U->>M: Request to protected route
    M->>C: auth.protect()
    alt Authenticated
        C-->>M: Auth object with sessionClaims
        alt Admin route
            M->>M: Check role === admin
            alt Not admin
                M-->>U: Redirect to /
            end
        end
        M-->>U: Proceed to route
    else Not authenticated
        C-->>M: Redirect to sign-in
        M-->>U: 302 to /login
    end

    U->>SA: Server Action call
    SA->>SA: requireAuth() or validateEventOwnership()
    SA->>DB: Query with user context
    DB-->>SA: Result
    SA-->>U: Response
```

**Role Hierarchy:**

| Role | Description |
|------|-------------|
| admin | Full platform access, user management, event moderation, system settings |
| organizer | Event CRUD, staff management, analytics, reports, certificates |
| moderator | Content moderation, community management, issue resolution |
| speaker | Profile visibility, session management, attendee interaction |
| volunteer | Check-in assistance, basic event access, attendee support |
| professional | Standard attendee with enhanced profile and networking |
| attendee | Basic event participation, feedback submission, ticket management |
| vendor | Sponsor access, lead scanning, booth management |

**Auth Utility Functions** (`src/lib/auth-utils.ts`):

| Function | Purpose |
|----------|---------|
| `getAuthContext()` | Returns userId, clerkId, user profile, isAuthenticated |
| `getEventAuthContext(eventId)` | Returns role, permissions, isOrganizer, canAccess for an event |
| `requireAuth()` | Throws if not authenticated |
| `requireEventAccess(eventId)` | Throws if no access to the event |
| `requireEventPermission(eventId, permission)` | Throws if missing specific permission |
| `validateEventOwnership(eventId)` | Validates organizer/co-organizer/staff/admin |
| `validateStaffPermission(eventId, permission)` | Granular permission validation |
| `canAccessEventManagement(userId, eventId)` | Boolean check for event management access |
| `hasEventPermission(userId, eventId, permission)` | Boolean check for specific permission |

---

### Event Lifecycle

Events flow through a defined lifecycle from creation to post-event analytics.

```mermaid
stateDiagram-v2
    [*] --> Draft: Create Event
    Draft --> Published: Publish
    Draft --> Cancelled: Cancel
    Published --> Active: Event Start Date
    Published --> Cancelled: Cancel
    Active --> Completed: Event End Date
    Completed --> Archived: Auto-archive

    state Published {
        [*] --> RegistrationOpen
        RegistrationOpen --> WaitlistActive: Capacity Full
        WaitlistActive --> RegistrationOpen: Spot Available
    }

    state Active {
        [*] --> CheckInOpen
        CheckInOpen --> LiveEvent
        LiveEvent --> FeedbackCollection
    }
```

**Event Features:**
- Multi-step creation wizard with AI-assisted scheduling
- Dynamic categories and tag management
- Campus location selector with 11 predefined locations
- RRule-based recurring event support
- Sub-event hierarchy via parentEventId
- Public/private visibility controls
- Co-organizer support (multiple organizers per event)
- Custom branding per event (colors, logos, CSS)

---

### Ticketing and Payments

The ticketing system handles multi-tier pricing, QR-based check-in, waitlists, and payment processing through Dodo Payments.

```mermaid
sequenceDiagram
    participant U as Attendee
    participant SA as Server Action
    participant P as Dodo Payments
    participant DB as Database
    participant E as Email Service

    U->>SA: Register for Event
    alt Free Event
        SA->>DB: Create Order + Tickets
        SA->>E: Send Confirmation Email
    else Paid Event
        SA->>P: Create Checkout Session
        P-->>U: Redirect to Checkout
        U->>P: Complete Payment
        P->>SA: Webhook: payment.completed
        SA->>DB: Verify Svix Signature
        SA->>DB: Create Order + Tickets
        SA->>E: Send Confirmation Email
    end
    DB-->>U: Tickets with QR codes + Entry codes
```

**Ticket Features:**
- Multi-tier pricing per event (VIP, Early Bird, General, etc.)
- QR code generation with HMAC-SHA256 signing
- 6-digit entry codes for manual check-in (crypto.randomInt)
- Waitlist with automatic promotion on cancellation
- Ticket expiration (event end + 24 hours)
- Race-condition-safe double-scan prevention
- Refund handling via webhook with capacity restoration
- PDF certificate generation with AI-personalized messages

**Payment Flow:**
- Dodo Payments integration for checkout sessions
- Webhook signature verification via svix
- Automatic order and ticket creation on payment completion
- Refund processing with order/ticket status updates
- Free event direct registration bypass

---

### AI Intelligence Engine

Powered by Google Gemini 1.5 Flash through the Genkit framework, the AI engine provides automation across event planning, content generation, and analytics.

```mermaid
graph LR
    subgraph Input["Input Sources"]
        A["Event Specs"]
        B["User Bio/Interests"]
        C["Registration Trends"]
        D["Historical Data"]
    end

    subgraph Processing["Genkit Flow Router"]
        A --> E{"Flow Router"}
        B --> E
        C --> E
        E --> F["Content Generation"]
        E --> G["Prediction Model"]
        E --> H["Embedding Generator"]
        E --> I["Task Planner"]
    end

    subgraph Output["Gemini 1.5 Flash"]
        F --> J["Descriptions, Agendas, Copy"]
        G --> K["Attendance Forecasts"]
        H --> L["768-dim Vectors"]
        I --> M["Kanban Task Lists"]
    end

    J --> N[("PostgreSQL")]
    K --> O["Organizer Dashboard"]
    L --> N
    M --> P["Task Board"]
```

**AI Capabilities:**

| Feature | Description |
|---------|-------------|
| Smart Event Planning | Generates descriptions, agendas, and marketing copy |
| Predictive Analytics | Estimates attendee turnout from registration trends |
| AI Task Generation | Produces structured Kanban tasks with subtasks and priorities |
| AI Chatbot | Event-specific Q&A with conversation history persistence |
| AI Report Generation | Structured 6-section event reports |
| Social Post Generator | Multi-platform social media content |
| Content Moderation | Real-time sentiment analysis and content filtering |
| Location Prediction | Hybrid GPS + AI weighted combination with agreement boost |

---

### Vector Recommendation Engine

Eventra uses pgvector with 768-dimensional embeddings for semantic matching between users and events.

```mermaid
graph TD
    subgraph Embedding["Embedding Pipeline"]
        A["User Profile + Interests"] --> B["Gemini Embedding API"]
        C["Event Data + Description"] --> B
        B --> D["768-dim Vector"]
    end

    subgraph Search["Semantic Search"]
        D --> E{"pgvector Cosine Similarity"}
        F["Stored Embeddings"] --> E
        E --> G["Ranked Results"]
    end

    subgraph Output["Recommendation Output"]
        G --> H["Personalized Explore Feed"]
        G --> I["Matchmaking Suggestions"]
        G --> J["Connection Recommendations"]
    end

    H --> K["Cached in ai_recommendation_cache"]
```

**Vector Features:**
- User interest embeddings generated from bio, skills, and preferences
- Event content embeddings generated from title, description, and category
- Cosine similarity search for semantic matching
- Recommendation caching with TTL for performance
- Connection matchmaking based on professional goals

---

### Communication Hub

Multi-channel communication system supporting real-time chat, email, and SMS notifications.

```mermaid
graph TD
    A["Event/System Trigger"] --> B{"Notification Dispatcher"}
    B -->|"Email"| C["Resend API"]
    B -->|"SMS"| D["Twilio API"]
    B -->|"In-App"| E["notifications table"]
    B -->|"Chat"| F["chat_messages table"]

    C --> G["7 Email Templates"]
    G --> G1["Registration Confirmation"]
    G --> G2["Certificate Ready"]
    G --> G3["Event Announcement"]
    G --> G4["Feedback Request"]
    G --> G5["Thank You"]
    G --> G6["Ticket Details"]
    G --> G7["Event Update"]

    E --> H["Real-time UI Update"]
    F --> I["Chat Interface"]
```

**Communication Features:**
- 7 HTML email templates with gradient headers
- Bulk email with delivery tracking (sent/delivered/opened/clicked/bounced/failed)
- Event-specific chat rooms with direct and group messaging
- AI-powered chatbot with conversation persistence
- Notification system with read/unread tracking
- Multi-channel delivery (email, SMS, in-app)

---

### Campus Map and Navigation

Eventra includes a campus-specific navigation system with two modes: a dynamic per-event map and a hardcoded fallback campus map.

**Dynamic Per-Event Map:**
- Each event can have its own custom map built by the organizer
- Organizer uploads any image (floor plan, venue layout, campus map)
- Place nodes on the image by clicking -- each node gets a name, category, and description
- Connect nodes with edges to define walkable paths
- BFS pathfinding generates shortest route between any two nodes
- Turn-by-turn directions in the sidebar ("Head right toward Stage", "You have arrived")
- 10 node categories: location, stage, booth, restroom, entrance, exit, food, info, workshop, vip
- Percentage-based coordinates (0-100) -- works with any image size
- Falls back to hardcoded campus map if no custom map exists

**Hardcoded Campus Map** (fallback):
- Interactive SVG campus map with 16 predefined zones
- Pan and zoom controls
- Zone buildings colored by category (academic, library, lab, sports, dining, outdoor, parking, admin)
- Live event indicators with pulsing red dots
- Animated navigation paths with turn-by-turn instructions
- User location marker with pulsing blue dot
- Compass and scale bar

**GPS + AI Hybrid Location Detection:**
- GPS Service (`gps-service.ts`): singleton service watching device GPS with caching
- GPS Utils (`gps-utils.ts`): Haversine distance, campus bounds checking, nearest-location matching
- Hybrid Prediction (`hybrid-prediction.ts`): combines GPS (40%) + AI (60%) with configurable weights, agreement boost, and breakdown visualization

**Map Routes:**
- `/events/[id]/map` -- Attendee view with navigation
- `/events/[id]/map/edit` -- Organizer editor (upload image, place nodes, draw edges)

---

## Database

34 PostgreSQL tables managed by Drizzle ORM with pgvector for AI embeddings.

```mermaid
erDiagram
    USERS ||--o{ EVENTS : organizes
    USERS ||--o{ TICKETS : owns
    USERS ||--o{ COMMUNITY_MEMBERS : joins
    USERS ||--o{ POSTS : writes
    USERS ||--o{ CHAT_MESSAGES : sends
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ USER_BADGES : earns
    USERS ||--o{ AI_CHAT_SESSIONS : initiates
    USERS ||--o{ EVENT_STAFF : works
    USERS ||--o{ ORDERS : places
    USERS ||--o{ ACTIVITY_FEED : generates
    USERS ||--o{ FEEDBACK_RESPONSES : submits

    EVENTS ||--o{ TICKET_TIERS : configures
    EVENTS ||--o{ TICKETS : issues
    EVENTS ||--o{ WAITLIST : manages
    EVENTS ||--o{ CHAT_ROOMS : anchors
    EVENTS ||--o{ SPONSORS : features
    EVENTS ||--o{ EVENT_STAFF : employs
    EVENTS ||--o{ EVENT_MEDIA : stores
    EVENTS ||--o{ ISSUES : tracks
    EVENTS ||--o{ EVENT_UPDATES : announces
    EVENTS ||--o{ ORDERS : processes
    EVENTS ||--o{ KANBAN_TASKS : plans
    EVENTS ||--o{ REPORTS : generates
    EVENTS ||--o{ STAKEHOLDERS : manages
    EVENTS ||--o{ EVENT_TAGS : tagged
    EVENTS ||--o| EVENT_MAPS : "has one map"

    EVENT_MAPS ||--o{ EVENT_MAP_NODES : contains
    EVENT_MAPS }o--|| USERS : created_by

    COMMUNITIES ||--o{ POSTS : contains
    COMMUNITIES ||--o{ COMMUNITY_MEMBERS : has
    POSTS ||--o{ COMMENTS : receives

    CHAT_ROOMS ||--o{ CHAT_MESSAGES : contains
    CHAT_ROOMS ||--o{ CHAT_PARTICIPANTS : includes

    BADGES ||--o{ USER_BADGES : awards
    TAGS ||--o{ EVENT_TAGS : links
```

**Table Groups:**

| Domain | Tables | Key Features |
|--------|--------|-------------|
| User Management | users, follows, user_badges | Profile, roles, gamification, pgvector embedding |
| Events | events, event_tags, event_media, event_updates, event_staff | CRUD, categories, tags, media, staff |
| Ticketing | tickets, ticket_tiers, waitlist, orders | Multi-tier, QR codes, entry codes, payments |
| Community | communities, community_members, posts, comments, activity_feed | Social features, feeds, discussions |
| Chat | chat_rooms, chat_participants, chat_messages | Direct, group, event-specific rooms |
| AI | ai_chat_sessions, ai_chat_messages, ai_recommendation_cache | Chat persistence, recommendation caching |
| Feedback | feedback_templates, feedback_responses, event_feedback | Custom forms, NPS calculation, analytics |
| Certificates | certificate_templates | Visual builder, PDF generation, bulk distribution |
| Operations | issues, kanban_tasks, reports, stakeholders, sponsors, sponsor_leads | Issue tracking, task management, reporting |
| Maps | event_maps, event_map_nodes | Per-event custom maps, node placement, pathfinding |
| Security | rate_limits | Per-user, per-scope rate limiting |
| Tags | tags, event_tags | Event categorization and filtering |
| Ingestion | ingestion_sources | External event scraping sources |

---

## API Routes

### Webhook Endpoints (Signature Verified)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/webhooks/clerk` | Svix signature | User sync from Clerk to database |
| POST | `/api/webhooks/dodo` | Svix signature | Payment completion and refund handling |

### Protected API Routes (Auth + Rate Limited)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/ai/chat` | Required | 15/min | AI chatbot with conversation history |
| POST | `/api/tickets/verify` | Staff permission | 30/min | Ticket check-in verification |
| POST | `/api/reports` | Event ownership | 5/min | AI report generation |
| POST | `/api/predict` | Required | 20/min | Location prediction |
| POST | `/api/feedback/submit` | Required | 5/min | Submit event feedback |
| GET | `/api/feedback/responses` | Event ownership | 30/min | Get feedback analytics |
| POST | `/api/send-email` | Required | Auth only | Send transactional email |
| POST/GET | `/api/tasks` | Event ownership | 30-60/min | Kanban task CRUD |
| POST | `/api/tasks/generate` | Event ownership | 10/min | AI task generation |
| POST/GET | `/api/stakeholders` | Event ownership | 20-30/min | Stakeholder management |
| POST/GET | `/api/issues` | Auth/Ownership | 5-30/min | Issue tracking |
| PATCH | `/api/issues/[id]` | Event ownership | 15/min | Update issue status |
| POST/GET | `/api/event-updates` | Event ownership | 10-60/min | Event announcements |
| POST | `/api/certificates/generate` | Event ownership | 5/min | Generate certificates |
| POST | `/api/certificates/distribute` | Event ownership | 5/min | Email distribution |
| GET | `/api/certificates/preview` | Event ownership | 30/min | Certificate preview |
| GET | `/api/event-gallery/[eventId]` | Public | 60/min | Photo gallery |

### Public Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/explore` | Event discovery |
| `/login/*`, `/register/*` | Clerk auth pages |
| `/api/health` | Health check (DB connectivity + latency) |
| `/maintenance` | Maintenance page |

---

## Server Actions

Eventra uses 45 server action files organized by domain. All actions are defined with `'use server'` and handle authentication, validation, and database operations.

| File | Purpose |
|------|---------|
| `events.ts` | Event CRUD operations |
| `tickets.ts` | Ticket management |
| `orders.ts` | Order creation, refunds, user orders |
| `registrations.ts` | Event registration with rate limiting |
| `check-in.ts` | Check-in operations with rate limiting |
| `payments.ts` | Dodo Payments webhook handling |
| `feedback.ts` | Feedback submission and analytics |
| `chat.ts` | Chat room and message operations |
| `communities.ts` | Community CRUD and membership |
| `certificates.ts` | Certificate generation and distribution |
| `reports.ts` | AI report generation and storage |
| `kanban-tasks.ts` | Kanban task CRUD |
| `stakeholders.ts` | Stakeholder management and CSV import |
| `issues.ts` | Issue tracking CRUD |
| `event-updates.ts` | Event announcements and email dispatch |
| `announcements.ts` | Announcement management |
| `gamification.ts` | Badge and points management |
| `challenges.ts` | Challenge system |
| `matchmaking.ts` | AI-powered matchmaking |
| `networking.ts` | Professional networking |
| `media.ts` | Photo gallery operations |
| `analytics.ts` | Event analytics computation |
| `dashboard.ts` | Dashboard data aggregation |
| `ai-recommendations.ts` | Vector-based recommendations |
| `ai-reports.ts` | AI report generation |
| `ai-tasks.ts` | AI task generation |
| `ai-tools.ts` | AI utility tools |
| `event-insights.ts` | Event insight computation |
| `event-planning.ts` | Event planning utilities |
| `event-engagement.ts` | Engagement tracking |
| `collab.ts` | Collaboration features |
| `admin.ts` | Admin operations |
| `notifications.ts` | Notification management |
| `users.ts` | User profile operations |
| `tags.ts` | Tag management |
| `sponsors.ts` | Sponsor management |
| `search.ts` | Search operations |
| `feed.ts` | Activity feed |
| `moderation.ts` | Content moderation |
| `health.ts` | Health check actions |
| `ingestion.ts` | External event ingestion |
| `scraper.ts` | Event scraping |
| `waitlist.ts` | Waitlist management |
| `organizer-tools.ts` | Organizer utility tools |
| `event-maps.ts` | Per-event map CRUD (getEventMap, saveEventMap, deleteEventMap, updateMapNode) |

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:6543/postgres` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_live_...` |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret | `whsec_...` |
| `JWT_SECRET` | JWT signing secret (min 16 chars, required in production) | `your-256-bit-secret` |
| `QR_SECRET` | QR code signing secret (required in production) | `your-256-bit-secret` |

### Optional Variables

| Variable | Description | Default Behavior |
|----------|-------------|-----------------|
| `DATABASE_POOLER_URL` | Supabase transaction pooler URL | Falls back to DATABASE_URL |
| `SESSION_SECRET` | Session signing secret | Falls back to JWT_SECRET |
| `GEMINI_API_KEY` | Google Gemini API key | AI features disabled |
| `DODO_PAYMENTS_API_KEY` | Dodo Payments API key | Payments disabled |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | Dodo webhook secret | Webhook verification skipped in dev |
| `RESEND_API_KEY` | Resend email API key | Email sending skipped |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | SMS disabled |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | SMS disabled |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | SMS disabled |
| `ROBOFLOW_API_KEY` | Roboflow API key | Computer vision disabled |
| `SVIX_WEBHOOK_SECRET` | Svix webhook secret | Webhook verification skipped |

### Environment Validation

The project includes Zod-based environment validation:

- `src/lib/env.ts` -- Runtime validation for server and public env vars
- `scripts/check-env.mjs` -- Build-time validation with optional connectivity checks

```bash
npm run env:check              # Validate required env vars
npm run env:check:staging      # Validate + check service connectivity
```

---

## Setup

### Prerequisites

- Node.js 18+ (recommended: 20)
- npm or yarn
- PostgreSQL 15+ (or Supabase account)
- Clerk account (free tier available)

### Installation

```bash
git clone <repository-url>
cd Eventra
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run db:push
npm run dev
```

The application starts at `http://localhost:9002`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with Turbopack on port 9002 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run env:check` | Validate environment variables |
| `npm run env:check:staging` | Validate env + check service connectivity |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run test:smoke` | Seed smoke test data |
| `npm run test:smoke:clean` | Clean smoke test data |
| `npm run test:verify` | Verify smoke test checklist |

---

## Database Setup

### Schema Management

Eventra uses Drizzle ORM for schema management. The schema is defined in `src/lib/db/schema/index.ts` and includes 32 tables with full relational definitions, pgvector embeddings, and composite indexes.

```bash
npm run db:generate    # Generate migration files from schema changes
npm run db:push        # Push schema directly to database (development)
npm run db:studio      # Open Drizzle Studio for visual database inspection
```

### Key Schema Features

- **pgvector**: 768-dimensional vector embeddings for AI recommendations
- **JSONB fields**: Flexible metadata storage for events, tickets, feedback, tasks
- **Composite indexes**: Optimized queries for ticket verification, rate limiting
- **Unique constraints**: Prevent duplicate registrations, feedback, and rate limit entries
- **Cascade deletes**: Automatic cleanup of dependent records

### Smoke Testing

The project includes a smoke test suite that validates core flows:

```bash
npm run test:smoke       # Seed test data and run flows
npm run test:verify      # Verify checklist results
npm run test:smoke:clean # Clean up test data
```

**Smoke Test Coverage:**
- Ticket creation and verification chain
- Community creation and member flow
- Chat room creation and message persistence
- Feedback submission and analytics
- Badge awarding and gamification
- Organizer tool operations (announcements, webhooks)

---

## Testing

The project uses Vitest for unit and integration tests.

```bash
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
```

**Test Files:**
- `src/core/utils/crypto.test.ts` -- QR signing, verification, payload parsing, entry code generation
- `src/features/map/pathfinding.test.ts` -- BFS pathfinding on dynamic node/edge graphs
- `src/features/map/types.test.ts` -- Percentage-to-pixel coordinate conversion
- `src/lib/env.test.ts` -- Environment variable schema validation

**Smoke Testing** (requires running database):
```bash
npm run test:smoke       # Seed test data and run flows
npm run test:verify      # Verify checklist results
npm run test:smoke:clean # Clean up test data
```

Smoke tests validate: ticket creation/verification, community operations, chat messaging, feedback submission, badge awarding, and organizer tools.

---

## Deployment

### Build

```bash
npm run build
```

The build process:
1. Compiles TypeScript with zero errors
2. Lints with ESLint
3. Generates optimized bundles
4. Outputs standalone build for deployment

### Production Requirements

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | Yes | Must be `production` |
| `DATABASE_URL` | Yes | Must use SSL for remote databases |
| `JWT_SECRET` | Yes | Application throws if missing |
| `QR_SECRET` | Yes | Application throws if missing |
| `CLERK_SECRET_KEY` | Yes | Use live keys, not test keys |
| `CLERK_WEBHOOK_SECRET` | Yes | Required for user sync |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | Yes | Required for payment verification |

### Deploy Checklist

1. Set all required environment variables
2. Run `npm run env:check:staging` to validate connectivity
3. Run `npm run db:push` to sync database schema
4. Run `npm run build` to verify production build
5. Deploy and verify `/api/health` returns 200 with DB latency

---

## Security

- **Middleware auth** -- Clerk middleware protects all non-public routes with `auth.protect()`
- **Server action guards** -- `requireAuth()`, `validateEventOwnership()`, `validateStaffPermission()` on all mutations
- **Webhook verification** -- Svix signature verification for Clerk and Dodo webhooks
- **HMAC-SHA256 QR signing** -- Prevents ticket QR code forgery
- **Timing-safe comparisons** -- `crypto.timingSafeEqual` for all signature checks
- **Rate limiting** -- DB-backed per-user, per-scope rate limiting on all API routes
- **Production secret enforcement** -- Application throws on startup if JWT_SECRET or QR_SECRET are missing
- **Security headers** -- HSTS (63072000s), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control
- **Input validation** -- Zod schemas for all user inputs and environment variables
- **SQL injection prevention** -- Drizzle ORM parameterized queries throughout
- **Role-based access** -- 8 roles with granular permission system per event

---

## Known Issues

1. **Platform-specific lock file** -- If `npm ci` fails with EBADPLATFORM errors, use `npm ci --force` or regenerate with `npm install`
2. **Empty API keys** -- AI, email, SMS, and payment features require API keys in `.env.local` to function
3. **No test suite** -- Smoke tests validate core flows but there are no unit/integration/E2E tests
4. **Campus hardcoding** -- GPS locations and bounds are hardcoded to one specific campus (dynamic maps are per-event and generic)

---

## License

Copyright 2026 Eventra Ecosystem. All rights reserved.

This project and its accompanying documentation are the proprietary and confidential property of Eventra. Any unauthorized use, reproduction, or distribution of this software, in whole or in part, without the prior written consent of the copyright holder is strictly prohibited.

### Usage Restrictions

- **Commercial Use**: Prohibited without a valid enterprise license
- **Modification**: Modification of the core Intelligence Engine (Genkit flows) is restricted to certified contributors
- **Redistribution**: Redistribution of the binary or source code is not permitted

---

*Last Updated: June 30, 2026*
