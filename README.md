# Eventra -- The Intelligent Event Management Ecosystem

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle--ORM-0.45.2-orange?style=flat-square)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](#license)

Eventra is an enterprise-grade event management platform that automates the full lifecycle of complex events. Built with Next.js 15, PostgreSQL with pgvector, Drizzle ORM, Clerk authentication, and Google Gemini AI, Eventra transforms passive event hosting into an active, data-driven, and community-centric experience.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Core Systems](#core-systems)
  - [Authentication and Authorization](#authentication-and-authorization)
  - [Event Lifecycle Engine](#event-lifecycle-engine)
  - [Ticketing and Payments](#ticketing-and-payments)
  - [AI Intelligence Engine](#ai-intelligence-engine)
  - [Vector Recommendation Engine](#vector-recommendation-engine)
  - [Communication Hub](#communication-hub)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Server Actions](#server-actions)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Database Setup](#database-setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Performance Considerations](#performance-considerations)
- [Known Issues](#known-issues)
- [License](#license)

---

## Architecture Overview

Eventra follows a Feature-First modular architecture with four integrated engines: AI, Recommendation, Communication, and Lifecycle. Server Components and Server Actions handle all business logic through a centralized engine router.

```mermaid
graph TD
    subgraph Presentation["Presentation Layer"]
        A["Next.js 15 App Router"] --> B["Server Components"]
        A --> C["Client Components"]
        A --> D["Middleware - Clerk Auth"]
    end

    subgraph BusinessLogic["Business Logic Layer"]
        B --> E["Server Actions"]
        C --> E
        E --> F{"Engine Router"}
        F -->|AI Request| G["Intelligence Engine"]
        F -->|Search/Match| H["Recommendation Engine"]
        F -->|Messaging| I["Communication Hub"]
        F -->|Ticketing/Events| J["Lifecycle Engine"]
    end

    subgraph DataLayer["Data and External Layer"]
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

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15.5 | App Router, Server Components, Server Actions |
| Language | TypeScript 5 | Type-safe development |
| Authentication | Clerk 7.3 | OAuth, JWT sessions, Webhooks |
| Database | PostgreSQL 15 (Supabase) | Relational data, pgvector for embeddings |
| ORM | Drizzle ORM 0.45 | Type-safe queries, migrations |
| AI | Google Gemini 1.5 Flash + Genkit | Content generation, predictions, embeddings |
| Payments | Dodo Payments | Checkout, refunds, webhook handling |
| Email | Resend | Transactional email delivery |
| SMS | Twilio | SMS notifications |
| UI | Shadcn/ui + Radix UI + Tailwind CSS | Component library, responsive design |
| Charts | Recharts | Data visualization |
| Maps | Leaflet + React-Leaflet | Interactive campus maps |
| PDF | jsPDF + html2canvas | Certificate generation |
| QR Codes | qrcode.react | Ticket QR rendering |
| State | TanStack React Query | Server state management |
| Forms | React Hook Form + Zod | Form validation |
| i18n | next-intl | Internationalization |

---

## Project Structure

```
Eventra/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (app)/                    # Authenticated routes (sidebar layout)
│   │   │   ├── admin/                # Admin dashboard
│   │   │   ├── events/               # Event CRUD, detail, edit
│   │   │   ├── tickets/              # User tickets
│   │   │   ├── community/            # Community feeds
│   │   │   ├── chat/                 # Messaging
│   │   │   ├── certificates/         # Certificate management
│   │   │   ├── organizer/            # Organizer tools, analytics, reports
│   │   │   ├── map/                  # Campus navigation
│   │   │   ├── gamification/         # Badges, challenges
│   │   │   ├── networking/           # Professional networking
│   │   │   ├── matchmaking/          # AI matchmaking
│   │   │   ├── check-in/             # Attendee check-in
│   │   │   ├── check-in-scanner/     # QR scanner
│   │   │   ├── analytics/            # Event analytics
│   │   │   ├── feedback/             # Feedback forms
│   │   │   ├── preferences/          # User settings
│   │   │   └── profile/              # User profiles
│   │   ├── (auth)/                   # Unauthenticated routes
│   │   │   ├── login/                # Clerk login
│   │   │   ├── register/             # Clerk registration
│   │   │   └── onboarding/           # Post-registration wizard
│   │   ├── api/                      # API Route Handlers
│   │   │   ├── webhooks/clerk/       # Clerk user sync
│   │   │   ├── webhooks/dodo/        # Payment webhooks
│   │   │   ├── ai/chat/              # AI chatbot
│   │   │   ├── tickets/verify/       # Ticket verification
│   │   │   ├── certificates/         # Certificate operations
│   │   │   ├── health/               # Health check
│   │   │   └── ...                   # 21 API routes total
│   │   ├── actions/                  # Server Actions (44 files)
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Landing page
│   ├── features/                     # Feature modules (25 domains)
│   │   ├── events/                   # Event components
│   │   ├── ticketing/                # Ticket components
│   │   ├── ai/                       # AI-powered components
│   │   ├── chat/                     # Chat components
│   │   ├── community/                # Community components
│   │   ├── certificates/             # Certificate components
│   │   └── ...                       # 25 feature directories
│   ├── components/                   # Shared UI components (Shadcn/ui)
│   ├── core/                         # Core business logic
│   │   ├── actions/                  # Core server actions
│   │   ├── auth/                     # Session management
│   │   ├── config/                   # App configuration
│   │   ├── services/                 # Email, SEO, locale services
│   │   └── utils/                    # Crypto, certificate generation
│   ├── hooks/                        # Custom React hooks
│   ├── i18n/                         # Internationalization config
│   ├── lib/                          # Shared libraries
│   │   ├── db/                       # Database connection and schema
│   │   ├── ai/                       # Genkit AI flows
│   │   ├── supabase/                 # Supabase client
│   │   ├── auth-utils.ts             # Auth utility functions
│   │   ├── rate-limit.ts             # Rate limiting
│   │   └── logger.ts                 # Structured logging
│   ├── types/                        # TypeScript type definitions
│   └── middleware.ts                  # Clerk middleware
├── drizzle/                          # Database migrations
├── scripts/                          # Build and utility scripts
├── public/                           # Static assets
├── messages/                         # i18n translation files
└── [config files]                    # next.config.ts, drizzle.config.ts, etc.
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

    U->>M: Request (non-public route)
    M->>C: Verify session
    alt Session valid
        C-->>M: Auth object
        alt Admin route
            M->>M: Check role === admin
            alt Not admin
                M-->>U: Redirect to /
            end
        end
        M-->>U: NextResponse.next()
    else No session
        C-->>M: Redirect to sign-in
        M-->>U: 302 to /login
    end

    U->>SA: Server Action call
    SA->>SA: requireAuth() / validateEventOwnership()
    SA->>DB: Query with user context
    DB-->>SA: Result
    SA-->>U: Response
```

**Role Hierarchy:**

| Role | Capabilities |
|------|-------------|
| admin | Full platform access, user management, event moderation |
| organizer | Event CRUD, staff management, analytics, reports |
| moderator | Content moderation, community management |
| speaker | Profile visibility, session management |
| volunteer | Check-in assistance, basic event access |
| professional | Standard attendee with enhanced profile |
| attendee | Basic event participation |
| vendor | Sponsor and vendor access |

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
| `canAccessEventManagement(userId, eventId)` | Boolean check for event access |
| `hasEventPermission(userId, eventId, permission)` | Boolean permission check |

---

### Event Lifecycle Engine

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
        SA->>DB: Verify Signature
        SA->>DB: Create Order + Tickets
        SA->>E: Send Confirmation Email
    end
    DB-->>U: Tickets with QR codes + Entry codes
```

**Ticket Features:**
- Multi-tier pricing per event
- QR code generation with HMAC-SHA256 signing
- 6-digit entry codes for manual check-in
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

    subgraph GenkitFlow["Genkit Processing"]
        E{"Flow Router"}
        A --> E
        E --> F["Content Generation"]
        E --> G["Prediction Model"]
        E --> H["Embedding Generator"]
        E --> I["Task Planner"]
    end

    subgraph Gemini["Gemini 1.5 Flash"]
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
| Predictive Analytics | Estimates attendee turnout based on registration trends |
| AI Task Generation | Produces structured Kanban tasks with subtasks and priorities |
| AI Chatbot | Event-specific Q&A with conversation history persistence |
| AI Report Generation | Structured event reports with 6 sections |
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

    C --> G["Email Templates"]
    G --> G1["Confirmation"]
    G --> G2["Certificate"]
    G --> G3["Announcement"]
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

## Database Schema

Eventra uses 32 PostgreSQL tables managed through Drizzle ORM. The schema includes relational data, vector embeddings via pgvector, and hierarchical relationships.

### Entity Relationship Diagram

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
    USERS ||--o{ FOLLOWERS : follows

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

    COMMUNITIES ||--o{ POSTS : contains
    COMMUNITIES ||--o{ COMMUNITY_MEMBERS : has
    POSTS ||--o{ COMMENTS : receives

    CHAT_ROOMS ||--o{ CHAT_MESSAGES : contains
    CHAT_ROOMS ||--o{ CHAT_PARTICIPANTS : includes

    TICKET_TIERS ||--o{ TICKETS : categorizes

    BADGES ||--o{ USER_BADGES : awards

    TAGS ||--o{ EVENT_TAGS : links
```

### Table Summary

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
| Security | rate_limits | Per-user, per-scope rate limiting |

---

## API Reference

### Webhook Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/webhooks/clerk` | Svix signature | User sync from Clerk to database |
| POST | `/api/webhooks/dodo` | Svix signature | Payment completion and refund handling |

### Protected API Routes

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/ai/chat` | Required | 15/min | AI chatbot with conversation history |
| POST | `/api/tickets/verify` | Staff permission | 30/min | Ticket check-in verification |
| POST | `/api/reports` | Event ownership | 5/min | AI report generation |
| POST | `/api/predict` | Required | 20/min | Location prediction |
| POST | `/api/feedback/submit` | Required | 5/min | Submit event feedback |
| GET | `/api/feedback/responses` | Event ownership | 30/min | Get feedback analytics |
| POST | `/api/send-email` | Required | -- | Send transactional email |
| GET | `/api/health` | None | -- | Health check |

### Unprotected Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Returns service status and timestamp |

---

## Server Actions

Eventra uses 44 server action files organized by domain. All actions are defined with `'use server'` and handle authentication, validation, and database operations.

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
| `JWT_SECRET` | JWT signing secret (required in production) | `your-256-bit-secret` |
| `QR_SECRET` | QR code signing secret (required in production) | `your-256-bit-secret` |

### Optional Variables

| Variable | Description | Default Behavior |
|----------|-------------|-----------------|
| `DATABASE_POOLER_URL` | Supabase transaction pooler URL | Falls back to DATABASE_URL |
| `GEMINI_API_KEY` | Google Gemini API key | AI features disabled |
| `DODO_PAYMENTS_API_KEY` | Dodo Payments API key | Payments disabled |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | Dodo webhook secret | Webhook verification skipped in dev |
| `RESEND_API_KEY` | Resend email API key | Email sending skipped |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | SMS disabled |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | SMS disabled |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | SMS disabled |
| `ROBOFLOW_API_KEY` | Roboflow API key | Computer vision disabled |
| `SVIX_WEBHOOK_SECRET` | Svix webhook secret | Webhook verification skipped |
| `SESSION_SECRET` | Session signing secret | Falls back to JWT_SECRET |

### Environment Validation

The project includes Zod-based environment validation:

- `src/lib/env.ts` -- Runtime validation for server and public env vars
- `scripts/check-env.mjs` -- Build-time validation with optional connectivity checks

```bash
# Validate required env vars
npm run env:check

# Validate and check connectivity to all services
npm run env:check:staging
```

---

## Local Development Setup

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
```

### Environment Configuration

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Database Setup

```bash
# Push schema to database
npm run db:push

# Or generate and run migrations
npm run db:generate
```

### Start Development Server

```bash
npm run dev
```

The application starts at `http://localhost:9002`.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack on port 9002 |
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

Eventra uses Drizzle ORM for schema management. The schema is defined in `src/lib/db/schema/index.ts` and includes 32 tables with full relational definitions.

```bash
# Generate migration files from schema changes
npm run db:generate

# Push schema directly to database (development)
npm run db:push

# Open Drizzle Studio for visual database inspection
npm run db:studio
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
# Seed test data
npm run test:smoke

# Verify checklist
npm run test:verify

# Clean up test data
npm run test:smoke:clean
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

### Current State

The project includes smoke tests for core flow validation. The smoke test seeds test data, runs through critical user journeys, and validates persistence.

```bash
# Run smoke tests
npm run test:smoke

# Verify results
npm run test:verify

# Clean up
npm run test:smoke:clean
```

### Test Coverage Areas

- Ticket creation and verification
- Community and post flows
- Chat room operations
- Feedback submission
- Badge and gamification flows
- Organizer announcement and webhook operations

---

## Deployment

### Build

```bash
npm run build
```

The build process:
1. Compiles TypeScript with zero errors
2. Lints with ESLint
3. Generates static pages where possible
4. Outputs optimized bundles

### Production Server

```bash
npm run start
```

### Environment Requirements for Production

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Must use SSL for remote databases |
| `JWT_SECRET` | Yes | Application throws if missing in production |
| `QR_SECRET` | Yes | Application throws if missing in production |
| `CLERK_SECRET_KEY` | Yes | Use live keys, not test keys |
| `CLERK_WEBHOOK_SECRET` | Yes | Required for user sync |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | Yes | Required for payment verification |
| `NODE_ENV` | Yes | Must be `production` |

### Deployment Checklist

1. Set all required environment variables
2. Run `npm run env:check:staging` to validate connectivity
3. Run `npm run db:push` to sync database schema
4. Run `npm run build` to verify production build
5. Deploy and verify `/api/health` returns 200

---

## Security

### Authentication Layers

1. **Middleware**: Clerk middleware protects all non-public routes
2. **Server Actions**: `requireAuth()` and `validateEventOwnership()` guard mutations
3. **API Routes**: Auth checks on all protected endpoints
4. **Webhooks**: Svix signature verification for Clerk and Dodo webhooks

### Security Features

- **HMAC-SHA256 QR signing**: Prevents ticket QR code forgery
- **Timing-safe comparisons**: `crypto.timingSafeEqual` for signature verification
- **Rate limiting**: Per-user, per-scope rate limiting via database-backed counters
- **Production secret enforcement**: Application throws on startup if `JWT_SECRET` or `QR_SECRET` are missing in production
- **Input validation**: Zod schemas for all user inputs and environment variables
- **SQL injection prevention**: Drizzle ORM parameterized queries
- **XSS prevention**: React's built-in escaping + DOMPurify for HTML content
- **CSRF protection**: Next.js built-in CSRF tokens for server actions

### Public Routes

The following routes are accessible without authentication:

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/explore` | Event discovery |
| `/login/*` | Clerk login |
| `/register/*` | Clerk registration |
| `/api/webhooks/clerk` | Clerk webhook |
| `/api/webhooks/dodo` | Dodo payment webhook |
| `/api/health` | Health check |
| `/maintenance` | Maintenance page |

---

## Performance Considerations

- **Server Components**: Default rendering strategy for reduced client-side JavaScript
- **Database connection pooling**: Supabase transaction pooler on port 6543 with `prepare: false`
- **Singleton connection**: Prevents multiple connections during development hot reloads
- **Recommendation caching**: AI recommendations cached in `ai_recommendation_cache` table
- **Static page generation**: Where possible, pages are pre-rendered at build time
- **Turbopack**: Development server uses Turbopack for faster rebuilds

---

## Known Issues

1. **Middleware TypeScript error**: `src/middleware.ts` has a type error with `auth.protect()` due to a Clerk v7 API change. The middleware callback receives `auth` as a function, but `protect()` is called on the return value instead of directly on `auth`.
2. **Database schema drift**: The Drizzle schema defines columns (`source_type`, `source_platform`, `external_url`, `external_id`) that may not exist in the live database until `db:push` is run.
3. **Empty API keys**: AI, email, SMS, and payment features require API keys to be configured in `.env.local`.
4. **Entry code predictability**: `generateEntryCode()` uses `Math.random()` instead of `crypto.randomInt()`.

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
