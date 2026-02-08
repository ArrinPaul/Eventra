# Eventra — Comprehensive Roadmap & Audit

> Last audited: February 8, 2026

---

## Completed Phases

### Phase 1: Removal & Cleanup ✅
- [x] **Zero Firebase Policy**: Removed all SDKs, configs, and service workers.
- [x] **Broken Import Cleanup**: Fixed all references to deleted firestore-services.
- [x] **Page Audit**: Deleted broken/legacy routes.

### Phase 2: Convex Backend Core ✅
- [x] **Unified Schema**: 13+ tables defined in `convex/schema.ts`.
- [x] **Convex Auth**: Google OAuth integration complete.
- [x] **Core Logic**: Events, Tickets, Chat, and Notifications in Convex.

### Phase 3: Engagement & Gamification ✅
- [x] **Gamification System**: Points (XP) and Badge logic implemented.
- [x] **Social Hub**: Community and Feed logic implemented.
- [x] **Ticketing**: QR-native ticketing system functional.

### Phase 4: Storage & Assets ✅
- [x] **Convex Storage**: `useStorage` hook functional.
- [x] **Onboarding**: Profile photo upload integrated with storage.

### Phase 5: AI & Intelligence ✅
- [x] **AI Recommendations**: Connected `ai-recommendations.ts` action to Convex `events` query.
- [x] **Genkit Wiring**: Wired Genkit flows (Recommendations, Chatbot, Matchmaking, Planner) to Convex data.
- [x] **Chatbot Enhancement**: Upgraded AI Bot to answer questions about specific events using Convex data.
- [x] **AI Event Planner**: Added "AI Assist" in event creation to generate agendas and descriptions.

### Phase 6: Advanced Features ✅
- [x] **Matchmaking**: AI-driven user networking recommendations implemented.
- [x] **Certificate Engine**: AI-powered certificate issuance and verification system.
- [x] **Analytics Deep-Dive**: Advanced aggregation queries and AI insights for organizers.
- [x] **Smart Notifications**: AI-driven personalized event reminders and engagement picks.
- [x] **Feedback Analysis**: Real-time AI sentiment analysis for event reviews.

---

## Phase 7: Deployment 🏁
- [x] **Build Verification**: `npm run typecheck` passing.
- [x] **Structure Cleanup**: Removed legacy `.idx`, `.orchids`, and `scripts` directories.
- [x] **Create `.env.example`**: Document all required environment variables for onboarding.
- [ ] **Vercel Deployment**: Final deployment and environment verification.
- [ ] **Convex Production**: Sync production schema and environment variables.

---

## Phase 8: Critical Bug Fixes & Completion Gaps ✅

> Features that exist but are broken or have critical logic errors.

### 8.1 Events — Core Gaps
- [x] **Capacity enforcement on registration**: `registrations.register` now checks `event.capacity` — throws "Event is at full capacity" when full. Supports waitlist auto-promote.
- [x] **Event update mutation is incomplete**: Now supports all 15+ fields including `category`, `type`, `capacity`, `imageUrl`, `isPaid`, `price`, `currency`, `targetAudience`, `agenda`, `speakers`, `waitlistEnabled`, `tags`.
- [x] **Cascading deletes**: `deleteEvent` now cascades to registrations, tickets, reviews, and certificates.
- [x] **Event status lifecycle**: Added `cancelEvent`, `completeEvent`, `publishEvent` mutations with attendee notifications.
- [ ] **Orphaned wizard components**: `wizard/step-1-basic-info.tsx`, `wizard/step-2-date-location.tsx`, and `wizard/types.ts` define a comprehensive schema but are not used by the actual `event-creation-wizard.tsx`. Consolidate or remove.
- [x] **Event creation form hardcodes**: `event-form.tsx` now exposes `capacity`, `status`, and `type` as user inputs with full validation.

### 8.2 Check-In — QR Format Mismatch ✅
- [x] **QR data format conflict**: `/check-in` now encodes plain `ticketNumber` string (matching scanner expectation). Unified format.
- [x] **Attendee self check-in is broken**: Removed broken `checkInUser()` call. Check-in page now shows real ticket data from Convex.
- [x] **Scanner scopes to selected event**: `checkInTicket` mutation now accepts optional `eventId` and validates ticket belongs to that event.

### 8.3 Certificates — Unreachable Features
- [x] **No UI trigger for certificate issuance**: Added `bulkIssue` mutation for organizers. Certificate `issue` prevents duplicates and sends notifications.
- [x] **Verification portal**: Added `verify` query by certificate number. Certificate client now has working Verify dialog.
- [x] **Download button**: Certificate listing page now has working download handler (generates text certificate).
- [ ] **Certificate Manager is a placeholder**: Shows "being migrated to our new system."
- [ ] **`CertificateViewer` / `CertificatePreview` components never rendered**: Built but not mounted anywhere.

### 8.4 Feed/Posts — Broken Community Scoping ✅
- [x] **`posts.create` hardcodes `communityId: "temp" as any`**: Fixed — now requires real `communityId: v.id("communities")`.
- [x] **Author info not shown**: `posts.list` and `posts.listByCommunity` now return `authorName`, `authorImage`, `authorRole`.
- [x] **Infinite likes**: Added `post_likes` table with per-user tracking. Like/unlike toggle implemented.

### 8.5 AI Features — Dead Wiring
- [ ] **AI Chatbot (`ai-chatbot.tsx`) calls `/api/ai-chatbot/sessions`**: This API endpoint does not exist. Session persistence fails.
- [ ] **Recommendation Dashboard uses hardcoded mock data**: Imports AI functions but `loadRecommendations()` returns static data. Wire to real AI flows.
- [ ] **AI Insights Widget uses local logic**: Not connected to the actual `analytics-insights.ts` AI flow.
- [ ] **Broadcast Email flow only simulates**: `console.log` instead of real email sending.

### 8.6 Type Safety ✅
- [x] **Remove `any` types from all Convex functions**: All 13 Convex files now use properly typed `ctx` and `args` (no more `ctx: any`).
- [x] **`attendeeName`/`attendeeEmail` mismatch**: Made optional in schema, populated from user data during registration.
- [x] **Legacy type aliases cleaned**: Removed `uid`, `photoURL`, `image` (on Event), `LegacyEvent`, `registeredUsers`, `attendees` from `types/index.ts`. Fixed all frontend references.
- [x] **Auth context cleaned**: Removed placeholder functions (`login`, `addEventToUser`, `removeEventFromUser`, `refreshUser`) from `auth-context.tsx`.
- [ ] **Replace `v.any()` in schema**: `location` and `agenda` fields in `events` table still use `v.any()`. Define proper typed schemas.

---

## Phase 9: Feature Completion — Partially Implemented ⚠️

> Features with UI or backend started but not fully wired end-to-end.

### 9.1 Events
- [ ] **Server-side pagination**: All queries use `.collect()` — switch to `.paginate()` for events, notifications, messages.
- [x] **Server-side search & filtering**: Added `getByStatus`, `getByOrganizer`, `getPublished` queries using schema indexes.
- [ ] **Dedicated event edit page**: No `/events/[id]/edit` route exists. Editing only works via inline dialog.
- [ ] **Event image upload**: No image upload flow in creation. `imageUrl` field is never populated from UI.
- [x] **Waitlist system**: Backend fully implemented — capacity check + waitlist auto-promote on cancellation.
- [ ] **Auto-complete past events**: No cron/scheduled function to mark past events as `completed`.
- [ ] **Capacity progress indicator**: Detail page shows `registeredCount` but never `capacity` or remaining spots.

### 9.2 Ticketing
- [ ] **Payment integration**: `isPaid` and `price` displayed but no Stripe/payment flow. "Book Now" on paid events creates free tickets.
- [ ] **Ticket types/tiers**: `ticketTypeId` field in schema never used. No multi-tier (VIP, Early Bird) support.
- [ ] **Ticket PDF download**: No PDF generation library. "Download" is a dead link.
- [x] **Ticket cancellation/refund UI**: Backend `cancelTicket` mutation added. Frontend integration pending.
- [ ] **Email confirmation on registration**: Email templates exist but are never triggered during registration.

### 9.3 Chat
- [ ] **Direct messaging**: No user picker/search to start 1:1 conversations.
- [x] **Read receipts**: `markMessagesRead` mutation added. Schema tracks `readBy` per user.
- [x] **Message sender info**: Messages now enriched with `senderName`, `senderImage`.
- [ ] **Message timestamps**: Not displayed in UI.
- [x] **Event-scoped chat rooms**: `createEventChatRoom` mutation added — creates room with all registered attendees.
- [ ] **File/image sharing in chat**.

### 9.4 Community ✅
- [x] **Leave community mutation**: Added `leave` mutation with member count update.
- [x] **Edit/delete community**: Added `update` and `deleteCommunity` mutations with ownership checks.
- [x] **Member list**: Added `getMembers` query with user info enrichment.
- [x] **Private community access control**: `join` now checks `isPrivate` flag and rejects non-admin joins.

### 9.5 Notifications
- [ ] **Click-through navigation**: Schema has `link` field but clicking a notification does nothing.
- [ ] **Push notifications / browser Notification API**: No service worker or Web Push.
- [x] **Notification preferences**: Backend supports per-type opt-out via `notificationPreferences` on user. `notifications.create` checks preferences before inserting.
- [ ] **Real-time toast on new notification**: No subscription/watcher pattern.
- [x] **Unread count query**: Added `getUnreadCount` query using compound `by_user_read` index.
- [x] **Clear all notifications**: Added `clearAll` mutation.

### 9.6 Gamification ✅
- [x] **Points awarding mutation**: Added standalone `addPoints` mutation with XP tracking.
- [x] **Automatic badge triggers**: `checkBadgeTriggers` auto-awards badges for points milestones (100/500/1000) and attendance counts (1/5/10 events).
- [x] **Level-up logic**: XP-to-level formula implemented (`Math.floor(points / 500) + 1`).
- [x] **Challenges system**: Added `challenges` + `user_challenges` tables, `getChallenges`, `getUserChallenges`, `joinChallenge`, `updateChallengeProgress` mutations.
- [ ] **Badge Showcase**: Has props interface but renders "being migrated" placeholder.
- [x] **Leaderboard query**: Fixed client to use clean data (removed `photoURL` legacy). Server-side `getLeaderboard` query added.

### 9.7 Networking/Matchmaking
- [ ] **Connections persistence**: "Connect" button shows a toast only — no `connections` table usage from frontend.
- [ ] **"Discover All" tab**: Placeholder ("coming soon").
- [ ] **"My Connections" tab**: Placeholder ("coming soon").
- [ ] **`/matchmaking` route**: Directory exists but has no page file.

### 9.8 Analytics
- [ ] **Comprehensive dashboard is a stub**: `comprehensive-analytics-dashboard.tsx` shows hardcoded "12 events" and "450 users". Wire to real data.
- [ ] **Admin analytics growth/engagement tabs**: Empty placeholders.
- [ ] **Stakeholder sharing**: "Coming soon" placeholder.

### 9.9 Admin ✅
- [x] **Event moderation**: Added `getEventsForModeration` query and `moderateEvent` mutation (approve/reject/suspend with notifications).
- [x] **System settings persistence**: Added `system_settings` table with `getSettings`/`updateSetting` mutations.
- [x] **Audit logging**: Added `audit_log` table with `logAuditAction` helper. All admin mutations log actions.
- [x] **Dashboard stats**: Added `getDashboardStats` query returning real user/event/registration counts and breakdowns.

### 9.10 Other Pages
- [x] **Calendar page**: Created full calendar page at `src/app/(app)/calendar/page.tsx` with monthly grid view and event detail sidebar.
- [x] **Search component**: Created `GlobalSearch` at `src/components/search/global-search.tsx` with Ctrl+K shortcut, live search, and event results.
- [ ] **Export functionality**: Shows "Coming Soon" stub.
- [ ] **User preferences**: Minimal toggle UI, save writes only a timestamp. No real preference persistence.
- [ ] **Speaker dashboard (main)**: Uses hardcoded mock data instead of Convex queries.
- [ ] **n8n Automation**: 832 lines of UI with all local state — no backend persistence or real n8n integration.

---

## Phase 10: Code Quality & Architecture Improvements 🔧

### 10.1 Type Safety
- [x] Remove all `any` casts in Convex function handlers — use typed `ctx` and `args`.
- [ ] Define proper Zod schemas for `location`, `agenda`, and `eventRatings` instead of `v.any()`.
- [x] Clean up legacy type aliases (`uid`, `photoURL`, `date`, `time`) in `types/index.ts`.
- [x] Remove placeholder functions in `auth-context.tsx` (`login`, `addEventToUser`, `removeEventFromUser`).

### 10.2 Performance
- [ ] Fix N+1 queries: `gamification.ts getUserBadges` and `events.ts getAttendees` fetch records in loops.
- [ ] Add pagination to all `.collect()` queries that can return unbounded results.
- [ ] Add missing database indexes: `chat_rooms.participants`, `notifications` compound `userId+read`.
- [ ] Dynamic imports for heavy libraries: `recharts`, `googleapis`, `cheerio`, `html5-qrcode`.
- [ ] Audit and remove unused dependencies from `package.json`.

### 10.3 Error Handling & UX ✅
- [x] Add `error.tsx` files to app route segments for graceful error recovery.
- [x] Add `loading.tsx` files with skeleton UIs for proper Suspense boundaries.
- [ ] Add React Error Boundaries for client component crash isolation.

### 10.4 Security
- [ ] Middleware auth validation: Currently only checks cookie existence, not token validity.
- [ ] Rate limiting: In-memory store won't work in serverless. Migrate to Redis or Upstash.
- [ ] Input validation on Convex mutations beyond type checking (business rule validation).
- [ ] Add CSRF protection for server actions.

### 10.5 Code Cleanup
- [x] Normalize `convex/schema.ts` formatting (inconsistent blank lines cleaned up).
- [ ] Remove empty directories: `src/components/organizer/`, `src/components/matchmaking/`, `src/features/ticketing/`.
- [ ] Remove or implement `forgot-password/` route (N/A for OAuth-only).

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
- [ ] **Multi-language / i18n support**: Internationalize UI strings.
- [ ] **Event templates**: Pre-built templates for workshops, conferences, hackathons.
- [ ] **Recurring events**: Weekly/monthly repeat patterns.
- [ ] **Co-organizer support**: Multiple organizers per event with shared management.
- [x] **Event cloning**: `cloneEvent` mutation implemented for quick re-creation.
- [x] **Waitlist with auto-promotion**: Implemented — auto-promotes from waitlist on cancellation.
- [ ] **Event discussion/Q&A board**: Per-event discussion threads.
- [ ] **Live polling during events**: Real-time audience polls.
- [ ] **Event photo gallery**: Post-event photo sharing.

### 11.2 Payments & Monetization
- [ ] **Stripe integration**: Full payment flow for paid events.
- [ ] **Refund management**: Automated and manual refund workflows.
- [ ] **Discount/promo codes**: Coupon system for event registration.
- [ ] **Revenue dashboard**: Financial analytics for organizers.
- [ ] **Invoice generation**: Automatic invoices for paid tickets.

### 11.3 Social & Engagement
- [ ] **User profiles (public)**: Dedicated profile pages with activity, badges, events attended.
- [ ] **Follow system**: Follow users/organizers for updates.
- [x] **Comment system on posts**: Added `addComment`/`getComments` mutations with author enrichment.
- [ ] **Event reactions/emojis**: React to event updates.
- [ ] **Referral system**: Invite friends, earn XP.
- [ ] **Activity feed**: Timeline of user actions (attended, earned badge, posted, etc.).

### 11.4 Communication
- [ ] **Email notifications on key events**: Registration confirmation, event reminders, certificate ready.
- [ ] **In-app announcement banners**: Organizer broadcasts visible to all attendees.
- [ ] **SMS notifications** (via Twilio): For critical reminders.
- [ ] **Push notifications**: Web Push via service worker.

### 11.5 Analytics & Insights
- [ ] **Real-time check-in dashboard**: Live attendee count, check-in rate, heatmap.
- [ ] **Feedback collection forms**: Custom post-event surveys.
- [ ] **Engagement scoring**: Per-user engagement metrics across events.
- [ ] **Export reports as PDF/CSV**: Downloadable analytics reports.
- [ ] **A/B testing for event descriptions**: AI-powered variant testing.

### 11.6 Platform & Infrastructure
- [ ] **PWA enhancements**: Offline support, install prompt, background sync.
- [ ] **Webhook system**: Notify external systems on events (registration, check-in).
- [ ] **API rate limiting (production)**: Redis-backed via Upstash.
- [ ] **Multi-tenant / white-label**: Organization-scoped branding.
- [x] **Audit log**: `audit_log` table tracks all admin actions with user attribution.
- [ ] **GDPR compliance**: Data export, account deletion, consent management.
- [ ] **Accessibility audit**: WCAG 2.1 AA compliance (ARIA labels, keyboard nav, screen reader).

### 11.7 AI Enhancements
- [ ] **AI-powered event summarization**: Auto-generate post-event summaries.
- [ ] **Smart scheduling**: AI suggests optimal event times based on audience availability.
- [ ] **Chatbot memory**: Persist conversation context across sessions.
- [ ] **AI moderation**: Auto-flag inappropriate content in community posts.
- [ ] **Predictive attendance**: ML-based prediction of event attendance rates.
- [ ] **AI-generated social media posts**: Auto-create promotional content for events.