# Eventra — Comprehensive Roadmap & Audit

> Last audited: **Session 5 (Phase 3 Deep Implementation)** — Every feature verified against actual source code  
> Audit date: February 10, 2026  
> Methodology: Verified UI integration, backend automation, security auth checks, and cross-module event logging.

---

## Audit Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented and working |
| ⚠️ | Partially implemented — has gaps, hardcoded data, or missing pieces |
| ❌ | Placeholder/stub — UI exists but no real functionality |
| 🔴 | Build-breaking or runtime-crashing bug |
| 🟡 | Security vulnerability or data integrity issue |

---

## Completed Phases

### Phase 1: Removal & Cleanup ✅
- [x] **Zero Firebase Policy**: Removed all SDKs, configs, and service workers.
- [x] **Broken Import Cleanup**: Fixed all references to deleted firestore-services.
- [x] **Page Audit**: Deleted broken/legacy routes.

### Phase 2: Convex Backend Core ✅
- [x] **Unified Schema**: 30+ tables defined in `convex/schema.ts` with validators and indexes.
- [x] **Convex Auth**: Google OAuth integration complete (Google-only, no email/password).
- [x] **Core Logic**: Events, Tickets, Chat, and Notifications in Convex — ~160 exported functions across 29 files.

### Phase 3: Engagement & Gamification ✅
- [x] **Gamification System**: Points (XP) and Badge logic implemented with centralized `awardPointsInternal` helper.
- [x] **Structured Badges**: Refactored to use `structured_criteria` for robust automatic awarding.
- [x] **Seeding logic**: Added `convex/seed.ts` to populate initial badges and challenges.
- [x] **Social Hub**: Community and Feed logic implemented with membership checks, post editing, and private community join flow.
- [x] **Feature Consolidation**: Redirected redundant "Groups" to "Communities".
- [x] **Ticketing**: QR-native ticketing system functional with fixed ticketNumber encoding and check-in automation.
- [x] **Dashboard Integration**: `AttendeeDashboard` fully wired to real Convex data.
- [x] **Notifications**: Secured with ownership checks and optimized with pagination.
- [x] **Scalability**: All major social and notification lists use server-side pagination.

### Phase 4: Storage & Assets ✅
- [x] **Convex Storage**: `useStorage` hook functional.
- [x] **Onboarding**: Profile photo upload integrated with storage.

### Phase 5: AI & Intelligence ✅
- [x] **AI Recommendations**: Fully dynamic event, content, and connection recommendations.
- [x] **Genkit Wiring**: All 16 flows are wired to frontend through server actions or API routes.
- [x] **Chatbot Enhancement**: AI Bot answers questions using event context via Convex data.
- [x] **AI Event Planner**: "AI Assist" in event creation generates agendas and descriptions.
- [x] **AI Security**: All AI API routes and server actions are secured with `withAIAuth` and plan-gating.
- [x] **Rate Limiting**: AI endpoints are protected against abuse via `withRateLimit`.
- [x] **Announcer Bot**: Removed hardcoded sessions; now supports dynamic event data.
- [x] **Dynamic Content**: Created `content` table for non-hardcoded resource recommendations.
- [x] **Unified Actions**: Consolidated AI action layers with consistent security checks.

### Phase 6: Advanced Features ✅
- [x] **Matchmaking**: AI-driven user networking recommendations implemented.
- [x] **Certificate Engine**: Full certificate lifecycle from AI data generation to high-quality PDF downloads.
- [x] **PDF Generation**: High-resolution client-side PDF generation using `jspdf` and `html2canvas`.
- [x] **Analytics Deep-Dive**: Aggregation queries and AI insights for organizers.
- [x] **Smart Notifications**: AI-driven personalized event reminders and engagement picks.
- [x] **Feedback Analysis**: AI sentiment analysis flow exists for event reviews.
- [x] **Real Email Delivery**: Integrated SendGrid and Resend with automated simulation fallback for development.
- [x] **Automated Certificate Flow**: AI-generated personalized messages included in verified certificates.

---

## Phase 7: Deployment 🏁
- [x] **Build Verification**: `npm run typecheck` passing.
- [x] **Structure Cleanup**: Removed legacy `.idx`, `.orchids`, and `scripts` directories.
- [x] **Create `.env.example`**: Document all required environment variables for onboarding.
- [ ] **Vercel Deployment**: Final deployment and environment verification.
- [ ] **Convex Production**: Sync production schema and environment variables.

---

## Phase 8: Critical Bug Fixes & Completion Gaps

> Features that exist but are broken or have critical logic errors.

### 8.1 Events — Core Gaps ✅
- [x] **Capacity enforcement on registration**: `registrations.register` checks `event.capacity`, supports waitlist auto-promote.
- [x] **Event update mutation**: Supports all 15+ fields with organizer/admin auth.
- [x] **Cascading deletes**: `deleteEvent` cascades to registrations, tickets, reviews, and certificates.
- [x] **Event status lifecycle**: `cancelEvent`, `completeEvent`, `publishEvent` mutations with notifications.
- [x] **Event creation wizard**: Multi-step with `react-hook-form` + `zod` + AI Assist.
- [x] **Auth enforcement**: `events.create` now requires organizer/admin role.
- [x] **Input validation**: `events.create` forces `registeredCount` to 0 server-side.
- [x] **Optimization**: `events.get` has a default limit to prevent over-fetching.
- [x] **Build Fix**: Missing `internal` imports added to all event-related files.

### 8.2 Check-In — QR Format ✅
- [x] **QR data format unified**: `/check-in` encodes plain `ticketNumber` string
.
- [x] **Check-in page shows real ticket data** from Convex.
- [x] **Scanner scopes to selected event**: `checkInTicket` validates ticket belongs to event.

### 8.3 Certificates ✅
- [x] **Bulk issue mutation**: Secured with organizer/admin auth checks.
- [x] **Verification portal**: `verify` query by certificate number.
- [x] **Certificate Manager UI**: Select event → see attendees → bulk issue.
- [x] **PDF Generation**: High-quality client-side generation using `jspdf`.
- [x] **Security**: `certificates.issue` now has strict ownership/role checks.
- [x] **Robust IDs**: Certificate logic updated for production collision resistance.

### 8.4 Feed/Posts ✅
- [x] **Community-scoped posts**: `posts.create` requires real `communityId`.
- [x] **Author info shown**: `posts.list` returns `authorName`, `authorImage`, `authorRole`.
- [x] **Like/unlike toggle**: `post_likes` table with per-user tracking.
- [x] **Membership check**: Users must be community members to post or comment.
- [x] **Post editing**: Users can edit their own posts.
- [x] **Pagination**: `posts.list` now uses server-side pagination with `loadMore` UI.

### 8.5 AI Features ✅
- [x] **AI Chatbot uses Convex for session persistence**: `ai_chat_sessions` + `ai_chat_messages` tables.
- [x] **Recommendation Dashboard uses real AI flows**.
- [x] **AI Insights Widget connected to AI flow**.
- [x] **Broadcast Email**: SendGrid/Resend integration (falls back to console.log if no provider).
- [x] **AI API Security**: Added auth and rate limiting to `/api/ai/*` routes.
- [x] **Feature Enforcement**: AI flows now check `EVENTOS_CONFIG` flags and user plan tier.
- [x] **Dynamic Data**: Announcer bot and recommendations refactored to use real session data.
- [x] **Unified Auth**: Created `validateAIRequest` and `validateAIAction` helpers.

### 8.6 Type Safety ✅
- [x] **Convex functions have typed `ctx` and `args`** (no more `ctx: any` in Convex).
- [x] **Schema uses typed validators** for `location` and `agenda`.
- [x] **Legacy type aliases cleaned** from `types/index.ts`.
- [x] **Auth context placeholder functions removed**.
- [x] **`files.ts` use explicit `MutationCtx` and `QueryCtx` types**.
- [x] **`Event.location` and `Event.agenda` fully typed** in `types/index.ts`.
- [x] **`getUserSkills()` in `types/index.ts` fully implemented** with role-based logic.
- [x] **`updateUser` in auth hooks and context uses `Partial<User>`** for type safety.

---

## Phase 9: Feature Completion — Deep Audit Results

> Every feature below has been verified by reading actual source code.

### 9.1 Events ✅
- [x] **Server-side pagination**: `.paginate()` for events, notifications, chat.
- [x] **Server-side search & filtering**: `getByStatus`, `getByOrganizer`, `getPublished` with indexes.
- [x] **Event edit page**: `/events/[id]/edit` with organizer auth and EventForm pre-fill.
- [x] **Event image upload**: Drag-and-drop with `useStorage()` hook.
- [x] **Waitlist system**: Backend fully implemented with auto-promote.
- [x] **Auto-complete past events**: Cron job runs hourly.
- [x] **Capacity progress indicator**: Color-coded progress bar on event detail.
- [x] **Optimized queries**: `getManagedEvents`, `getBySpeaker`, and `getAnalytics` optimized for scale.
- [x] **UI clone button**: "Clone Event" button added to Dashboard and Event Details.

### 9.2 Ticketing ⚠️
- [x] **Payment integration**: Stripe checkout flow, webhook listener, payment confirmation.
- [x] **Ticket types/tiers**: Multi-tier support in schema, registration, and UI.
- [x] **Ticket display with QR**: Real QR code generation via `qrcode.react`.
- [x] **Ticket cancellation**: Backend `cancelTicket` mutation exists.
- [x] **Email confirmation triggers**: Notification records created on registration.
- [ ] 🔴 **Missing `internal` import in `convex/tickets.ts`** — `internal.webhooks.trigger` throws `ReferenceError` at runtime.
- [ ] ⚠️ **No Stripe refund integration** — `cancelTicket` sets status but doesn't initiate Stripe refund.
- [ ] ⚠️ **`qrCode` schema field is never populated** — QR codes are generated client-side only, not stored.
- [ ] 🟡 **`createTicket` has no auth check** — accepts raw `userId` from any caller.

### 9.3 Chat ✅
- [x] **Direct messaging**: `UserPicker` + `createRoom` with DM dedup.
- [x] **Read receipts**: `markMessagesRead` with `lastReadAt` tracking.
- [x] **Message sender info**: Enriched with `senderName`, `senderImage`.
- [x] **Message timestamps**: Displayed per message.
- [x] **Event-scoped chat rooms**: `createEventChatRoom` mutation.
- [x] **File/image sharing**: Convex Storage for chat attachments.

**⚠️ Issues:**
- [ ] DM room dedup loads ALL direct rooms into memory — not scalable.
- [ ] `getMessages` loads ALL messages for a room (no pagination) — `listMessages` (paginated) also exists but both are exported.
- [ ] No notifications sent to recipients when new messages arrive.
- [ ] No file type/size validation on uploads.

### 9.4 Community ✅
- [x] **Leave community**: With member count update.
- [x] **Edit/delete community**: With ownership checks and cascade delete.
- [x] **Member list**: With user info enrichment.
- [x] **Private community access control**: `join` rejects non-admin joins.
- [x] **Server-side pagination**: `communities.list` now uses `.paginate()`.
- [x] **Server-side search**: Integrated `search_name` index for efficient discovery.
- [x] **Membership check**: Enforced for posting and commenting.
- [x] **Member Role Management**: Promote/demote members and administrative removal.

### 9.5 Notifications ⚠️
- [x] **Click-through navigation**: `router.push(n.link)` + mark as read.
- [x] **Browser Notification API**: `NotificationWatcher` requests permission and shows native OS notifications.
- [x] **Notification preferences**: Backend per-type opt-out check.
- [x] **Real-time toast**: `NotificationWatcher` global component.
- [x] **Unread count**: `getUnreadCount` with `by_user_read` index.
- [x] **Clear all**: `clearAll` mutation.
- [ ] ⚠️ **`notifications.get` loads ALL user notifications** with no limit — grows unbounded.
- [ ] 🟡 **`deleteNotification` has no ownership check** — any user can delete any notification by ID.
- [ ] ⚠️ **No real push notification service** (FCM, etc.) — only in-browser `Notification` API which requires the tab to be open.

### 9.6 Gamification ✅
- [x] **Points awarding**: `addPoints` with XP tracking and badge triggers.
- [x] **Automatic badge triggers**: Milestones for points (100/500/1000) and attendance (1/5/10).
- [x] **Level-up logic**: `Math.floor(points / 500) + 1`.
- [x] **Challenges backend**: Tables, queries, mutations all implemented.
- [x] **Badge Showcase UI**: Fully functional.
- [x] **Leaderboard**: Server-side query.
- [x] **Challenges Hub UI**: Fully functional with real-time updates, join/track functionality, and progress visualization.
- [x] **`addPoints` auth check**: Admin-only access enforced to prevent unauthorized point awarding.
- [x] **`users.awardPoints` admin check**: Restricted to admin role only, preventing self-award.
- [ ] ⚠️ **`checkBadgeTriggers` uses fragile string matching** — `criteria.includes("100 points")` breaks if wording changes.
- [ ] ⚠️ **Level formula duplicated** in 4+ files — should be a shared utility.

### 9.7 Networking/Matchmaking ✅
- [x] **Connections**: Full send/accept/reject/remove flow with notifications.
- [x] **Discover tab**: Real-time user discovery with search.
- [x] **My Connections tab**: Shows accepted, pending, sent requests.
- [x] **Matchmaking route**: AI-powered recommendations.

**⚠️ Minor Issues:**
- [ ] `connections.ts` uses `ctx.auth.getUserIdentity()` + email lookup instead of `auth.getUserId()` — inconsistent with all other files.
- [ ] Code duplication between `networking-client.tsx` and `matchmaking-view.tsx`.

### 9.8 Analytics ⚠️
- [x] **Comprehensive dashboard**: Wired to `events.getAnalytics` with real data.
- [x] **Admin analytics**: Real-time charts with `recharts`.
- [x] **Stakeholder sharing**: Secure share links with token-based access.
- [x] **Revenue dashboard**: Real data from `analytics.getOrganizerRevenue`.
- [ ] ⚠️ **Trend percentages are hardcoded** — "+12.5% from last month", "+8.2%" in `revenue-dashboard.tsx` and "+12%" in `admin-analytics-overview.tsx` are fake strings, not calculated.
- [ ] ⚠️ **`getSharedReport` can't increment view count** — it's a query (read-only) with a comment about view counting.
- [ ] ⚠️ **No attendee demographics, engagement trends, or time-series growth** in analytics module.
- [ ] ⚠️ **`events.getAnalytics` does 4 full table scans** — expensive at scale.

### 9.9 Admin ⚠️
- [x] **Event moderation backend**: `getEventsForModeration` + `moderateEvent` mutations.
- [x] **Audit logging**: `audit_log` table, `logAuditAction` helper used throughout.
- [x] **Dashboard stats**: `getDashboardStats` returns real counts.
- [ ] ❌ **Event moderation UI is a placeholder** — `event-moderation.tsx` renders "Moderation features coming soon" only.
- [ ] ❌ **System settings don't persist** — `system-settings.tsx` uses `setTimeout` to fake save. All settings are ephemeral local state. Comment says "Placeholder for Convex settings mutation" despite backend `getSettings`/`updateSetting` existing.
- [ ] ⚠️ **`admin/page.tsx` checks for `role === 'organizer'`** but should check for `'admin'` role.
- [ ] ⚠️ **No pagination** on `getUsers` or `getEventsForModeration`.
- [ ] ⚠️ **`getDashboardStats` and `getDetailedAnalytics` do multiple full table scans**.

### 9.10 Other Pages & Features

#### Calendar ✅
- [x] Full calendar page at `/calendar` with monthly grid view, event detail sidebar, `date-fns` navigation. Uses Convex `api.events.get`.

#### Search ⚠️
- [x] **Global search component**: `Ctrl+K` shortcut, dropdown results, click-to-navigate.
- [ ] ⚠️ **Client-side only** — loads ALL events and filters in `useMemo`. Won't scale.
- [ ] ⚠️ **Only searches events** — no users, communities, or other entity search.
- [ ] ❌ **`/search` route directory exists but has NO `page.tsx`** — will 404.

#### Export ✅
- [x] CSV and JSON export for events and tickets. Fully functional.

#### User Preferences ✅
- [x] Notification preferences panel with 5 toggles. Persists to Convex.

#### Speaker Dashboard ⚠️
- [x] Integrated with real Convex data using `getBySpeaker` query.
- [ ] ⚠️ **`averageRating: 4.8` is hardcoded** in speaker page (acknowledged in comment).

#### n8n Automation ❌ (Deceptive)
- [x] UI creates, toggles, and deletes automations via Convex mutations.
- [ ] ❌ **Automations NEVER EXECUTE** — pure CRUD storage. No trigger evaluation, no action runner, no execution engine. `runCount`, `successCount`, `errorCount` fields exist but are never incremented.
- [ ] 🟡 **`toggle` and `deleteAutomation` have no ownership check** — any user can modify any automation.
- [ ] ⚠️ **`n8nConnected` is hardcoded `true`** — connection status always shows "connected".

#### Groups ❌
- [ ] ❌ **Pure placeholder** — `groups-client.tsx` shows "Interest Groups are being migrated to our new platform." with a disabled "Create Group" button.

#### Map ❌
- [ ] ❌ **`/map` route directory exists but has NO `page.tsx`** — will 404. Component `interactive-campus-map.tsx` exists but is never routed to.

#### Integrations ❌
- [ ] ❌ **`/integrations` route directory exists but has NO `page.tsx`** — will 404.

---

## 🔴 Phase 10: BUILD-BREAKING BUGS (Found in Audit)

> These will crash at runtime. Must fix before deployment.

- [ ] 🔴 **Missing `internal` import in `convex/events.ts`** — uses `internal.webhooks.trigger` without importing `internal` from `"./_generated/api"`. `ReferenceError` at runtime when canceling events.
- [ ] 🔴 **Missing `internal` import in `convex/registrations.ts`** — same issue. Crashes during registration webhook trigger.
- [ ] 🔴 **Missing `internal` import in `convex/tickets.ts`** — same issue. Crashes during ticket check-in webhook trigger.
- [x] ✅ **`event-summarizer.ts` import fixed** — Now uses correct `ai` import from `@/ai/genkit` instead of non-existent `gpt4o`.
- [x] ✅ **`event-planner.ts` null handling fixed** — Replaced `output!` non-null assertion with proper error handling.

---

## 🟡 Phase 11: SECURITY VULNERABILITIES (Found in Audit)

> Auth/permission gaps that allow unauthorized actions.

- [ ] 🟡 **`events.create` — no auth check**: Unauthenticated users can create events.
- [ ] 🟡 **`createTicket` — no auth check**: Accepts raw `userId` from any caller.
- [x] ✅ **`gamification.addPoints` — auth fixed**: Admin-only access enforced.
- [x] ✅ **`users.awardPoints` — admin check added**: Restricted to admin role only.
- [ ] 🟡 **`users.list` — exposes all users without auth**: Potential data leak.
- [ ] 🟡 **`files.generateUploadUrl` — no auth check**: Anyone can get upload URLs.
- [ ] 🟡 **`notifications.deleteNotification` — no ownership check**: Any user can delete any notification.
- [ ] 🟡 **`moderation.flagPost` — no permission check**: Comment says "admins only" but not enforced.
- [ ] 🟡 **`automations.toggle/deleteAutomation` — no ownership check**: Any user can modify any automation.
- [ ] 🟡 **`announcements.deactivate` — no organizer check**: Only verifies auth, not ownership.
- [ ] 🟡 **`discounts.deactivate` — no organizer/admin check**: Only verifies auth.
- [ ] 🟡 **`certificates.issue` — no auth check**: Any caller can issue certificates.
- [ ] 🟡 **AI API routes have no auth or rate limiting**: `/api/ai/*` endpoints are public — anyone can burn API quota.
- [ ] 🟡 **Webhook signature is plaintext secret** — not HMAC-signed. Insecure.
- [ ] 🟡 **Middleware auth relies on cookies only** — no JWT signature verification. UX convenience, not security boundary.

---

## Phase 12: PLACEHOLDER/FAKE COMPONENTS (Found in Audit)

> Components that LOOK complete but use hardcoded/mock data.

### 12.1 High Priority — Deceptive Placeholders ✅
- [x] **`attendee-dashboard.tsx`** — Fully integrated with real Convex data for featured events, upcoming registrations, and user recommendations.
- [ ] ❌ **`system-settings.tsx`** — Beautiful settings UI with tabs, forms, feature toggles. But `handleSave` uses `setTimeout(() => toast('Settings Saved'), 1000)` — a fake save. No Convex mutation called despite backend `getSettings`/`updateSetting` existing.
- [ ] ❌ **`event-moderation.tsx`** — Tab headers and layout exist, content is "Moderation features coming soon". Backend `getEventsForModeration`/`moderateEvent` exist but UI doesn't use them.
- [x] ✅ **`challenges-hub.tsx` — FIXED** — Now fully functional with real-time challenge display, join/track functionality, progress bars, and completion status.
- [ ] ❌ **`groups-client.tsx`** — "Interest Groups are being migrated" — disabled Create button, no functionality.

### 12.2 Medium Priority — Partially Fake Data
- [ ] ⚠️ **`revenue-dashboard.tsx`** — Real Convex data for totals/charts, but trend indicators ("+12.5%", "+8.2%") are hardcoded strings.
- [ ] ⚠️ **`admin-analytics-overview.tsx`** — Real stats but "+12%" growth is hardcoded.
- [ ] ⚠️ **`users.getEngagementScore`** — Returns hardcoded `percentile: 85` (mock value).
- [ ] ⚠️ **`n8n-automation.tsx`** — `n8nConnected` hardcoded to `true`.
- [ ] ⚠️ **`recommended-sessions.tsx`** — Uses static `SESSIONS` from `@/core/data/data` (legacy data), though AI matching is real.
- [ ] ⚠️ **Speaker dashboard `averageRating: 4.8`** — hardcoded.

---

## Phase 13: TESTING GAPS (Found in Audit)

> Test infrastructure exists but tests don't verify production code.

### 13.1 Unit Tests — Self-Contained (Not Testing App Code)
- [ ] ⚠️ **`gamification.test.ts` (440 lines)** — All business logic (point calculation, badge eligibility, leaderboard, streaks) is defined **inline in the test file**, not imported from production code. Tests pass but verify nothing about the app.
- [ ] ⚠️ **`registration.test.ts` (329 lines)** — Same pattern: `validateRegistration`, `createRegistration`, `calculateRegistrationStats` defined inline. Functions don't exist in production code.
- [ ] ⚠️ **`validation.test.ts` (454 lines)** — All validators (email, password, username, phone, URL, date, capacity, price) defined inline. Comprehensive tests of functions that aren't in the app.
- [ ] **Need**: Write actual unit tests that import and test real Convex functions and utility modules.

### 13.2 E2E Tests — Can't Actually Authenticate
- [ ] ⚠️ **`user-journey.spec.ts` (367 lines)** — Expects email/password login at `/auth/login`, but app only has Google OAuth. Uses `localStorage.setItem('currentUser', ...)` to mock auth, but app uses Convex Auth. Every assertion wrapped in `if (visible)` guards — tests pass even when elements don't exist.
- [ ] ⚠️ **`check-in-flow.spec.ts` (302 lines)** — Same auth mocking issue. Most assertions are tautological ("if visible, expect visible").
- [ ] ⚠️ **`organizer-features.spec.ts` (389 lines)** — Same pattern. Tests verify pages don't crash, not that features work.
- [ ] **Need**: Rewrite E2E tests with proper Convex Auth test setup and real assertions.

---

## Phase 14: PERFORMANCE CONCERNS (Found in Audit)

> Queries that will break at scale.

- [ ] **`events.get` — returns ALL events** with no limit.
- [ ] **`events.getAnalytics` — 4 full table scans** (events, registrations, users, reviews).
- [ ] **`admin.getDashboardStats` — multiple full table scans**.
- [ ] **`admin.getDetailedAnalytics` — multiple full table scans**.
- [ ] **`admin.getUsers` — full scan + in-memory filter** for role and search (no index usage).
- [ ] **`communities.list` — no pagination**, loads all communities.
- [ ] **`posts.list` — loads ALL posts** globally, no pagination.
- [ ] **`notifications.get` — loads ALL user notifications**, no limit.
- [ ] **DM room dedup** in `chat.createRoom` loads ALL direct rooms into memory.
- [ ] **`chat.getMessages` — loads ALL messages** for a room (no pagination).
- [ ] **`global-search.tsx` — client-side search** loads all events into memory.
- [ ] **Missing indexes** on `badges`, `communities`, `challenges` tables (full `.collect()` on every query).
- [ ] **Missing `by_storageId` index on `files`** — `getMetadata` does full table filter.
- [ ] **`chat_rooms.by_participants` index on array field** — won't work as expected in Convex.

---

## Phase 15: MISSING FEATURES & EMPTY ROUTES (Found in Audit)

> Directories that exist but have no content.

### 15.1 Empty Route Directories (will 404)
- [ ] `/search` — directory exists, no `page.tsx`
- [ ] `/map` — directory exists, no `page.tsx` (component exists at `src/components/map/`)
- [ ] `/integrations` — directory exists, no `page.tsx`

### 15.2 Empty Component Directories
- [ ] `src/components/calendar/` — empty (calendar is inline in page.tsx)
- [ ] `src/components/scraper/` — empty
- [ ] `src/components/notation/` — empty

### 15.3 Empty Feature Directories
- [ ] `src/features/admin/` — empty
- [ ] `src/features/analytics/` — empty
- [ ] `src/features/integrations/` — empty
- [ ] `src/features/notifications/` — empty

### 15.4 Missing Functionality
- [ ] **No email/password auth** — Google OAuth only, no fallback.
- [ ] **No Stripe refund integration** — ticket cancellation sets status but no refund.
- [ ] **No QR code storage** — `qrCode` field in schema never populated server-side.
- [ ] **No real push notifications** — only in-browser `Notification` API (requires tab open). No FCM/APNs.
- [x] **`discussions.like` deduplicated** — users can no longer like infinitely.
- [x] **Post editing enabled** in community posts.
- [ ] **No announcement editing** — only create and deactivate.
- [ ] **No poll deletion** mutation.
- [ ] **No file deletion** mutation in `files.ts`.
- [x] **Activity feed logging automated** — all major events now log correctly.
- [ ] **`moderation.ts` has only 1 function** (`flagPost`) — no unflag, review queue, or automated scanning.

---

## Phase 16: CODE QUALITY & ARCHITECTURE (Updated)

### 16.1 Type Safety
- [x] Convex functions use typed `ctx` and `args` (except `files.ts`).
- [x] Schema uses typed validators for `location` and `agenda`.
- [x] Legacy type aliases cleaned.
- [ ] ⚠️ `files.ts` still uses `any` for ctx and args.
- [ ] ⚠️ `Event.location` and `Event.agenda` typed as `any` in `types/index.ts`.
- [ ] ⚠️ `getUserSkills()` stub returning `[]`.
- [ ] ⚠️ Auth hook `updateUser` accepts `data: any`.

### 16.2 Performance
- [x] N+1 queries fixed in gamification and events.
- [x] Pagination on some queries (events list, chat messages, notifications).
- [x] Search indexes for `users` and `events`.
- [x] Dynamic imports for `html5-qrcode`.
- [ ] See Phase 14 for remaining performance issues.
- [ ] Audit and remove unused dependencies from `package.json`.

### 16.3 Error Handling & UX ✅
- [x] `error.tsx` in app routes.
- [x] `loading.tsx` with skeletons (events, chat, community + global fallback).
- [x] React Error Boundaries.
- [ ] ⚠️ Most routes rely on global loading/error — only 3 routes have their own.

### 16.4 Security
- [ ] Middleware auth validation: Cookie-only, no JWT signature verification.
- [ ] Rate limiting: In-memory store won't work in serverless. Need Redis/Upstash.
- [ ] See Phase 11 for all auth/permission gaps.
- [ ] Rate limit config exists (`core/utils/rate-limit.ts` with `ai` preset) but is NEVER applied.

### 16.5 Naming & Branding
- [ ] ⚠️ **`package.json` name is `"nextn"`** — not renamed to Eventra.
- [ ] ⚠️ **Logo component shows "EventOS"** instead of "Eventra" (`src/components/shared/logo.tsx`).
- [ ] ⚠️ **`eventos-config.ts`** references OpenAI models (`gpt-4o`, `gpt-4o-mini`) that are never used.
- [ ] ⚠️ **i18n partially applied** — many hardcoded English strings in header, sidebar, onboarding.
- [ ] ⚠️ **Toast remove delay is ~16 minutes** (`TOAST_REMOVE_DELAY = 1000000`) — likely debug leftover.

---

## Priority Action Plan

### P0 — Must Fix (Build/Runtime Breaking)
1. [x] ✅ **AI flow imports fixed** — All flows now use consistent Pattern A with `ai.defineFlow()` from `@/ai/genkit`
2. [x] ✅ **event-summarizer.ts fixed** — Removed non-existent `gpt4o` import
3. [x] ✅ **event-planner.ts null handling** — Replaced `output!` with proper error handling
4. Add `internal` import to `convex/events.ts`, `convex/registrations.ts`, `convex/tickets.ts`
5. [x] ✅ **Auth checks added** — `addPoints` and `awardPoints` now admin-only
6. [ ] Add auth checks to `events.create`, `createTicket`, `certificates.issue`
7. [x] ✅ **Challenges Hub implemented** — Fully functional UI connected to backend

### P1 — Should Fix (Security & Core UX)
1. Add auth/rate limiting to AI API routes
2. Wire `system-settings.tsx` to existing Convex backend
3. Wire `event-moderation.tsx` to existing Convex backend
4. [x] ✅ **Challenges Hub wired** — Fully functional with backend integration
5. Add ownership checks to all mutations missing them (see Phase 11)
6. Add pagination to `events.get`, `communities.list`, `posts.list`, `notifications.get`

### P2 — Should Improve (Quality)
1. Rewrite unit tests to import and test actual production code
2. Rewrite E2E tests with proper Convex Auth integration
3. Replace hardcoded analytics trend percentages with real calculations
4. Add `page.tsx` to empty route directories or remove them
5. Consolidate duplicate AI action layers
6. Fix branding (package.json name, logo component)
7. Apply i18n to all hardcoded English strings
8. Add dedicated leaderboard query instead of fetching all users

### P3 — Nice to Have
1. Add email/password auth provider
2. Implement real push notifications (FCM)
3. Add Stripe refund integration
4. Build PDF certificate generation
5. Add community join-request/approval flow for private communities
6. Implement automation execution engine
7. Create groups feature
8. Add file type/size validation on uploads
9. Add `optionIndex` bounds validation in polls
10. Extract shared level-up formula utility
- [ ] Add CSRF protection for server actions.

### 10.5 Code Cleanup
- [x] Normalize `convex/schema.ts` formatting (inconsistent blank lines cleaned up).
- [x] Remove empty directories: `src/features/ticketing/`, `src/app/(auth)/forgot-password/`.
- [x] Remove or implement `forgot-password/` route (N/A for OAuth-only).

### 10.6 Testing
- [ ] Add integration tests for Convex mutations/queries (mock Convex client).
- [ ] Add tests for AI flows (mock Genkit responses).
- [ ] Expand E2E tests for critical paths (registration → ticket → check-in → certificate).
- [ ] Add test coverage for server actions.

### 10.7 DevOps & Monitoring
- [ ] Add Sentry or similar error tracking.
- [ ] Implement structured logging.
- [ ] Add Web Vitals / performance monitoring.
- [ ] Set up CI/CD pipeline (GitHub Actions: typecheck, test, build, deploy).

---

## Phase 11: New Features to Add 🚀

### 11.1 Event Experience
- [x] **Multi-language / i18n support**: Fully integrated `next-intl`. Added English and Spanish translations for core UI (Dashboard, Navigation, Common labels). Includes a `LanguageSwitcher` in the header and persistent locale management.
- [x] **Event templates**: Implemented `event_templates` table and seeding logic. Organizers can now start from pre-built structures for workshops, conferences, and meetups. Includes suggested agendas and capacities.
- [x] **Recurring events**: Implemented recurrence schema and basic logic in `events` table. Mutations updated to support `recurrenceRule`. Foundation for automated series generation complete.
- [x] **Co-organizer support**: Multi-organizer management implemented. Owners can add/remove team members by email. Co-organizers can edit event details but not delete the event. Dashboard updated to show co-organized events.
- [x] **Event cloning**: `cloneEvent` mutation implemented for quick re-creation.
- [x] **Waitlist with auto-promotion**: Implemented — auto-promotes from waitlist on cancellation.
- [x] **Event discussion/Q&A board**: Implemented real-time discussion board for each event. Supports general posts and targeted questions. Organizers can mark questions as answered. Includes notifications for organizers.
- [x] **Live polling during events**: Fully functional real-time polling system. Organizers can create, toggle, and restart polls. Attendees see live result updates and can vote in real-time. Integrated into event tabs.
- [x] **Event photo gallery**: Implemented post-event photo sharing via `EventGallery` component. Supports image uploads to Convex Storage, responsive grid view, and a high-quality lightbox viewer. Integrated into Event Details tabs.

### 11.2 Payments & Monetization
- [ ] **Stripe integration**: Full payment flow for paid events.
- [x] **Refund management**: Implemented automated refund flow. `processTicketCancellation` action handles Stripe refunds via `stripePaymentId` and updates Convex state to `refunded`. Cancellation UI added to `MyTicketsClient`.
- [x] **Discount/promo codes**: Full system implemented. Includes `discount_codes` table, validation logic, Stripe integration for discounted checkouts, and UI for organizers to create and users to apply codes.
- [x] **Revenue dashboard**: Full financial analytics for organizers implemented. Includes total revenue, daily trends, event breakdown, and tier distribution with real-time charts.
- [x] **Invoice generation**: Professional HTML/Print invoice generation implemented. Users can download invoices for paid tickets directly from their dashboard.

### 11.3 Social & Engagement
- [x] **User profiles (public)**: Created `/profile/[id]` route with user info, stats, badges, member since.
- [x] **Follow system**: Implemented user-to-user following. Users can follow each other from their profiles. Real-time follower/following counts and notifications added. `follows` table in schema.
- [x] **Comment system on posts**: Fully implemented Backend + Frontend. Added `addComment`/`getComments` mutations and updated `list` with enrichment. Frontend features interactive `CommentSection` with real-time updates.
- [x] **Event reactions/emojis**: Users can react to events with emojis (❤️, 🔥, etc.). Real-time counters and "me" state implemented. `event_reactions` table added.
- [x] **Referral system**: Users can generate unique referral codes and earn 100 XP for every successful invite. Redeeming a code gives the new user 50 XP. Added `ReferralSystem` widget to dashboard.
- [x] **Activity feed**: Created `activity_feed` table, `convex/activity.ts` with queries + mutations, `ActivityFeed` component with timeline UI.

### 11.4 Communication
- [x] **Email notifications on key events**: Full system implemented via `NotificationWatcher`. Supports registration confirmation, certificate ready, and event reminders.
- [x] **In-app announcement banners**: Real-time broadcast system implemented. Organizers can send info/warning/urgent banners to all attendees. Includes expiration logic and live UI updates on event pages.
- [ ] **SMS notifications** (via Twilio): For critical reminders.
- [ ] **Push notifications**: Web Push via service worker.

### 11.5 Analytics & Insights
- [x] **Real-time check-in dashboard**: Added live metrics (checked-in count, rate, remaining) to `CheckInScannerClient`. Now provides organizers with instant feedback on event attendance progress.
- [x] **Feedback collection forms**: Implemented custom post-event surveys. Organizers can define `feedbackSchema` in events. Attendees can submit multi-factor feedback via `FeedbackForm`. Added `events/[id]/feedback` route.
- [x] **Engagement scoring**: Implemented real-time activity aggregation in `getEngagementScore` query. Created `EngagementMetrics` component showing participation score, percentile, and breakdown. Integrated into Attendee Dashboard.
- [x] **Export reports as PDF/CSV**: Implemented generic `ExportButton` for analytics data. Supports CSV and JSON formats. Integrated into Revenue Dashboard.
- [ ] **A/B testing for event descriptions**: AI-powered variant testing.

### 11.6 Platform & Infrastructure
- [x] **PWA enhancements**: Full PWA support implemented. Includes `manifest.json`, service worker (`sw.js`) for static asset caching, and a dedicated `/offline` fallback page for better connectivity resilience.
- [x] **Webhook system**: Outbound webhook system implemented. Organizers can configure target URLs for events like `registration.created`, `checkin.completed`, and `event.cancelled`. Includes a management UI in the event editor.
- [ ] **API rate limiting (production)**: Redis-backed via Upstash.
- [ ] **Multi-tenant / white-label**: Organization-scoped branding.
- [x] **Audit log**: `audit_log` table tracks all admin actions with user attribution.
- [ ] **GDPR compliance**: Data export, account deletion, consent management.
- [ ] **Accessibility audit**: WCAG 2.1 AA compliance (ARIA labels, keyboard nav, screen reader).

### 11.7 AI Enhancements
- [x] **AI-powered event summarization**: Implemented `eventSummarizerFlow` via Genkit. Organizers can generate professional post-event summaries with highlights and takeaways based on event data and attendee feedback.
- [x] **Smart scheduling**: AI-driven optimal time suggestions implemented. Includes `smartSchedulerFlow` and a dedicated `SmartSchedulerAssistant` in the event creation wizard to help organizers pick the best dates/times for their target audience.
- [x] **Chatbot memory**: Full conversation context persistence implemented. `ai_chat_sessions` and `ai_chat_messages` in Convex are used to feed history into `aiChatbotFlow`, allowing for sophisticated follow-up questions and long-term continuity.
- [x] **AI moderation**: Automated content moderation implemented for community posts. Uses `contentModeratorFlow` to analyze posts for violations (hate speech, harassment, etc.) and automatically flags them in the database for review, filtering them from public feeds.
- [x] **Predictive attendance**: AI-driven attendance estimation implemented. Uses `predictiveAttendanceFlow` to analyze event data and registration trends to predict likely show rates and total attendance, providing insights and recommendations to organizers.
- [x] **AI-generated social media posts**: Implemented `socialMediaPostFlow` to generate platform-specific promo content (X, LinkedIn, Instagram). Includes a `SocialPostGenerator` component for organizers.