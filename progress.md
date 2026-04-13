# Eventra Project Progress & Vision

## 1. Final Project Vision (The "End State")
Eventra is envisioned as a high-performance, production-grade event management and community engagement platform. The final state will feature:

- **Robust Architecture**: A unified Next.js 15 application using the App Router, with a clean separation between the **Core Engine** (business logic), **Features** (modular UI/UX), and **Infrastructure** (database/external APIs).
- **Backend Sovereignty**: Moving away from BaaS (like Convex/Firebase) to a self-managed, scalable database (e.g., PostgreSQL with Drizzle/Prisma) for total data control.
- **AI-First Experience**: Deeply integrated Genkit flows for personalized recommendations, automated event planning, and intelligent moderation.
- **Modern UI/UX**: A lightning-fast, accessible, and mobile-responsive interface built with Tailwind CSS and Radix UI primitives.
- **Global Ready**: Full i18n support and optimized for global performance.

## 2. Current Status (Rework Phase)
- [x] **Legacy Removal**: Deleted Convex, Firebase, and Vercel dependencies/configurations.
- [x] **Infrastructure Reset**: Removed old tests, workflows, and BaaS-coupled server actions.
- [x] **Mock Foundation**: Implemented a mock Auth hook to keep the UI functional during the transition.
- [x] **Clean Skeleton**: Re-organized core providers and layouts.

## 3. Roadmap to Completion

### Phase 1: Foundation & Infrastructure (High Priority)
- [x] **Database Selection**: Finalized the new database choice (PostgreSQL).
- [x] **ORM Setup**: Implemented Drizzle ORM for type-safe database access.
- [x] **Authentication**: Implemented Auth.js (NextAuth v5) with Google OAuth and Drizzle Adapter.
- [x] **Schema Design**: Ported and expanded core tables from the previous Convex schema to the new DB.

### Phase 2: Core Feature Rework
- [ ] **Event Engine**: Implement CRUD operations for events using Server Actions.
- [ ] **Ticketing & Payments**: Re-integrate Stripe with the new backend and implement secure QR ticket generation.
- [ ] **Community & Social**: Re-build the social feed, communities, and real-time chat (likely using WebSockets or a real-time provider like Pusher).

### Phase 3: AI & Intelligence
- [ ] **Genkit Re-Wiring**: Connect existing Genkit flows to the new database.
- [ ] **Smart Services**: Re-enable AI recommendations and automated event summaries.

### Phase 4: Quality & DevOps
- [ ] **Testing Suite**: Implement a new testing strategy (Vitest for units, Playwright for E2E) that works with the new architecture.
- [ ] **CI/CD**: Create new GitHub Actions for automated linting, testing, and deployment.
- [ ] **Performance Tuning**: Optimize database queries and implement edge caching where applicable.

---

## 4. Architectural Decision: Unified vs. Split Structure
**Decision**: We will maintain a **Unified Next.js Structure** with a **Feature-Driven Modular Approach** inside `src/`.

**Rationale**:
- **Simplicity**: Single repository, single deployment, and unified type sharing between frontend and backend.
- **Performance**: Next.js Server Components and Server Actions provide the best developer experience and performance for this scale of application.
- **Scalability**: A modular `features/` directory allows the team to work on isolated parts of the app without friction.

**Proposed `src/` Directory Structure**:
- `app/`: Next.js App Router (routes, layouts, server actions).
- `features/`: Modular functionality (e.g., `events/`, `auth/`, `chat/`, `gamification/`). Each feature contains its own components, hooks, and types.
- `components/`: Shared UI components (atomic design: `ui/`, `shared/`, `layout/`).
- `core/`: Global utilities, constants, and shared logic.
- `lib/`: Third-party library initializations (Prisma client, Stripe, Genkit).
- `types/`: Global TypeScript definitions.
