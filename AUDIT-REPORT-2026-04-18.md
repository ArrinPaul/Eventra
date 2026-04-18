# Eventra Codebase Audit Report

Date: 2026-04-18  
Scope: Read-only analysis of Eventra web app source, focusing on architecture, feature completeness, route health, auth/RBAC, i18n parity, schema integrity, and defect hotspots.

---

## 1) Executive Summary

This audit confirms that the project has substantial implementation coverage but also contains a high number of partially wired feature paths and placeholder TODO-backed flows. The biggest risks are:

1. Ticketing success page trusts query params only and does not verify checkout fulfillment state.
2. Auth provider availability is environment-gated; auth UX remains exposed even when providers resolve to empty.
3. Broad id vs _id shape drift causing brittle runtime assumptions across UI/features.
4. Multiple feature modules still using no-op mutations and hardcoded empty datasets.

Overall conclusion: the repository is structurally rich and close to production intent, but still requires a focused hardening pass before full production reliability.

---

## 2) Audit Scope and Method

### Included Directories and Files

- eventra-webapp/src/app
- eventra-webapp/src/features
- eventra-webapp/src/components
- eventra-webapp/src/core
- eventra-webapp/src/lib
- eventra-webapp/src/i18n
- eventra-webapp/src/types
- eventra-webapp/src/middleware.ts
- eventra-webapp/src/auth.ts
- eventra-webapp/src/lib/db/schema/index.ts
- eventra-webapp/messages/en.json
- eventra-webapp/messages/es.json
- eventra-webapp/package.json

### Evidence Collection

1. File inventory and route shape mapping.
2. Feature-level read pass for all requested modules.
3. Schema and relation extraction from Drizzle schema index.
4. Auth and middleware control-flow analysis.
5. i18n key parity analysis.
6. Pattern scans for TODO/FIXME, console.error, throw new Error.

---

## 3) Inventory Snapshot

- src/app: 94 files
- src/features: 90 files
- src/components: 35 files
- src/core: 8 files
- src/lib: 7 files
- src/i18n: 1 file
- src/types: 1 file

Feature modules analyzed:

admin, agenda, ai, analytics, auth, certificates, chat, check-in, community, dashboard, events, export, feed, feedback, gamification, home, leaderboard, map, matchmaking, networking, notifications, organizer, preferences, ticketing

---

## 4) Critical and High-Severity Broken Features

### Critical

1. Ticketing success verification gap  
   Root cause: success page marks registration as confirmed based only on URL params, without validating Stripe session or webhook fulfillment state.  
   Impact: users can see false-positive purchase confirmation when fulfillment fails.

2. Admin module mutation placeholders  
   - Root cause: user/setting/moderation actions left as TODO/no-op in UI flow.  
   - Impact: admin controls appear available but are functionally incomplete.

3. Organizer webhook/announcement management placeholders  
   - Root cause: backend wiring intentionally stubbed in key organizer tools.  
   - Impact: organizer operations fail silently or do not persist.

4. Networking connect/respond/remove placeholders  
   - Root cause: TODO mutation stubs in networking client flow.  
   - Impact: connection lifecycle is non-functional.

### High
1. OAuth providers are conditional on env vars; when vars are missing, providers array resolves empty while auth journey remains visible.
2. Community and feed write paths partially stubbed.
3. Gamification challenge and dashboard data paths still TODO-backed.
4. Event discussions/polls/my-events still include backend TODO gaps.

---

## 5) Missing or Incomplete UI Pages (Route Health)

### A) Segment directories with layout/loading/error but no page

- src/app/(app)
- src/app/(auth)

### B) Directories with page.tsx but missing both loading.tsx and error.tsx

- src/app/(app)/admin
- src/app/(app)/agenda
- src/app/(app)/ai-recommendations
- src/app/(app)/analytics
- src/app/(app)/calendar
- src/app/(app)/certificates
- src/app/(app)/check-in
- src/app/(app)/check-in-scanner
- src/app/(app)/events/create
- src/app/(app)/explore
- src/app/(app)/export
- src/app/(app)/feed
- src/app/(app)/gamification
- src/app/(app)/leaderboard
- src/app/(app)/map
- src/app/(app)/matchmaking
- src/app/(app)/my-events
- src/app/(app)/networking
- src/app/(app)/notifications
- src/app/(app)/organizer
- src/app/(app)/preferences
- src/app/(app)/profile
- src/app/(app)/search
- src/app/(app)/settings
- src/app/(app)/ticketing
- src/app/(app)/ticketing/success
- src/app/(app)/tickets
- src/app/(app)/certificates/verify
- src/app/(app)/organizer/ai-insights
- src/app/(app)/organizer/analytics
- src/app/(app)/organizer/certificates
- src/app/(app)/organizer/feedback
- src/app/(auth)/login
- src/app/(auth)/onboarding
- src/app/(auth)/register
- src/app/offline

### C) Segment directories with none of page/layout/loading/error

- src/app/(app)/community/[id]
- src/app/(app)/events/[id]
- src/app/(app)/events/[id]/claim-spot
- src/app/(app)/events/[id]/edit
- src/app/(app)/events/[id]/feedback
- src/app/(app)/feedback
- src/app/(app)/feedback/[eventId]
- src/app/(app)/organizer/collab
- src/app/(app)/organizer/collab/[eventId]
- src/app/(app)/organizer/feedback/[eventId]
- src/app/(app)/organizer/media
- src/app/(app)/organizer/media/[eventId]
- src/app/(app)/profile/[id]

Note: not every nested directory requires all route files, but these are strong UX consistency gaps and maintenance hotspots.

Additional note: directories such as src/app/actions and src/app/api intentionally behave as non-page route handlers and should not be treated as missing UI pages.

---

## 6) DB / Schema Mismatches

### Table Count

- Requested expectation in task: 26 tables
- Actual tables found in schema: 27

Observed tables:

users, account, session, events, ticket_tiers, tickets, waitlist, communities, community_members, posts, comments, badges, user_badges, notifications, follows, chat_rooms, chat_participants, chat_messages, ai_chat_sessions, ai_chat_messages, feedback_templates, certificate_templates, event_feedback, event_staff, sponsors, activity_feed, event_media

### Data Shape Drift

- Schema primarily uses id (text/uuid primary keys).
- Frontend/types frequently support or prefer _id.
- This mixed usage appears throughout features and routes, creating repeated fallback logic and higher risk for edge-case bugs.

### Relation Map Snapshot

Core relation blocks declared in schema currently include:

1. certificateTemplates -> events (eventId)
2. eventMedia -> events (eventId), users (authorId)
3. events -> ticketTiers, tickets, waitlist, chatRooms, aiChatSessions, eventFeedback, certificateTemplates, eventStaff, sponsors, eventMedia, feedbackTemplates
4. sponsors -> events
5. eventStaff -> events, users
6. feedbackTemplates -> events (one + many relationship exposure)
7. ticketTiers -> events
8. tickets -> events, users, ticketTiers
9. users -> tickets, communities, communityMembers, posts, comments, notifications, userBadges, aiChatSessions, eventFeedback, activityFeed, eventStaff
10. communities -> users (creator), communityMembers, posts
11. communityMembers -> communities, users
12. posts -> users (author), communities, comments
13. comments -> users (author), posts

Observation: relation coverage is partial for some tables (for example notifications/follows/chat relation symmetry is not fully modeled bidirectionally), which is valid but should remain intentional and documented.

---

## 7) Auth / RBAC Issues

1. Middleware auth-page guard includes /signup, /register, and /login. /signup appears unused and should be treated as redundant dead-path handling rather than a route mismatch bug.
2. Providers array in auth configuration is conditional; if GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are absent, OAuth login remains unavailable.
3. Middleware role requirements are narrow and prefix-based; deeper protection still depends on server action-level checks.
4. Server-side role and ownership validation helpers exist and are generally solid, but they are unevenly reflected in placeholder-heavy UI modules.

---

## 8) i18n Gaps

### Key Parity

- en.json total keys: 261
- es.json total keys: 261
- Missing keys in en: 0
- Missing keys in es: 0
- Empty-string values: 0 in both files

### Practical Coverage Gap

Many feature components still render hardcoded English text instead of consistently using translation keys.

---

## 9) Dead Code / Orphaned Imports / Stub Signals

### Pattern Scan Totals (src scope)

- TODO/FIXME matches: 38
- console.error matches: 146
- throw new Error matches: 97

Interpretation:

1. Placeholder implementation density remains high in critical product modules.
2. Error handling is present but often heavily console-driven.
3. Throw-heavy server paths need consistent user-facing error mapping and boundary handling.

---

## 10) Package, Scripts, and Dependency Notes

Scripts are generally coherent for Next + Drizzle workflow. Notable risk points:

1. next-auth beta version in production-sensitive auth surface.
2. Many env-dependent integrations use non-null assertion access patterns (for example Stripe initialization), increasing startup/runtime fragility when env setup is incomplete.
3. Package script surface is minimal (8 scripts) and lacks explicit test/smoke script enforcement for critical checkout and auth paths.

---

## 11) Environment and Config Risk Notes

Key env-sensitive surfaces include:

- DATABASE_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY
- TWILIO_*
- JWT_SECRET / AUTH_SECRET

Missing values on these paths can cause hard runtime failures or silently degraded features.

---

## 12) Recommended Remediation Order

1. Fix ticketing success fulfillment verification (server-side session/webhook verification before showing confirmed state).
2. Finalize provider strategy and remove legacy auth dead-path handling.
3. Normalize id vs _id access strategy (types + adapters + component usage).
4. Replace critical TODO/no-op mutations in admin, organizer, networking, ticketing.
5. Fill route-level loading/error coverage for high-traffic pages.
6. Convert hardcoded strings in key features to i18n usage.
7. Reduce console-only handling and standardize error UX.

---

## 13) Completion Criteria for Phase 2

1. Critical flows repaired (ticketing, auth redirects/providers).
2. All critical placeholder mutations replaced with real server actions.
3. id/_id compatibility layer standardized and tested.
4. Route UX consistency improved (error/loading on high-impact pages).
5. No regressions in typecheck/build for touched modules.

---

## 14) Notes About Existing Project Docs

Existing root docs currently contain conflicting status narratives (for example, "100% complete" vs "core flows pending"). This report should be treated as the latest audit source-of-truth for technical state as of 2026-04-18.

---

## 15) Requirements Traceability Matrix

This matrix maps the original audit request to concrete sections in this report.

1. Broken features list with feature/path/root cause/severity  
   - Covered by sections 4 and 16.
2. Missing or incomplete UI pages  
   - Covered by section 5.
3. DB/schema mismatches  
   - Covered by section 6.
4. Auth/RBAC issues  
   - Covered by section 7.
5. i18n gaps  
   - Covered by section 8.
6. Dead code/orphaned imports  
   - Covered by section 9 and section 17.
7. Full task context and analysis evidence  
   - Covered by sections 2, 3, 9, 10, 11.

---

## 16) Broken Features Table (Feature, Path, Root Cause, Severity)

| Feature | Path | Root Cause | Severity |
|---|---|---|---|
| Ticketing success confirmation | src/app/actions/payments.ts + src/app/(app)/ticketing/success/page.tsx | Success page trusts query params only; no authoritative fulfillment check | critical |
| Auth provider login | src/auth.ts | Provider registration depends on GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET; empty provider set if missing | high |
| Auth page redirect guard | src/middleware.ts | Includes legacy /signup check (redundant dead-path) while real auth routes are /login and /register | low |
| Admin user operations | src/features/admin/user-management.tsx | TODO/no-op mutation paths | critical |
| Admin settings operations | src/features/admin/system-settings.tsx | TODO/no-op mutation paths | critical |
| Admin moderation | src/features/admin/event-moderation.tsx | TODO/no-op moderation and pagination path | critical |
| Organizer announcements | src/features/organizer/announcement-manager.tsx | TODO/no-op action wiring | high |
| Organizer webhooks | src/features/organizer/webhook-manager.tsx | TODO/no-op action wiring | high |
| Networking requests | src/features/networking/networking-client.tsx | TODO/no-op connect/respond/remove paths | high |
| Ticket booking path | src/features/ticketing/ticketing-client.tsx | TODO/no-op registration mutation | high |
| Community list | src/features/community/community-list.tsx | TODO/no backend data source | high |
| Community detail actions | src/features/community/community-detail.tsx | TODO/no-op write/read backend wiring | high |
| Event discussions | src/features/events/event-discussion-board.tsx | TODO/no-op backend path | high |
| Event polls | src/features/events/event-polls.tsx | TODO/no-op backend path | high |
| Gamification challenges | src/features/gamification/challenges-hub.tsx | TODO/no-op challenge-join wiring | high |
| Admin analytics loading UI | src/features/admin/admin-analytics-overview.tsx | Loader2 is referenced but not imported; loading branch is currently unreachable due static initialized state | medium |

---

## 17) Dead Code / Orphaned Imports Clarification

Orphaned imports cannot be asserted exhaustively from static grep alone without a full lint/type diagnostic policy run per touched module. Current evidence indicates:

1. No immediate compile-detected errors were returned in the workspace-wide problem snapshot during this audit.
2. Placeholder and dead-path signals are primarily TODO/no-op flows, hardcoded empty datasets, and duplicated id compatibility branches.

Actionable follow-up is tracked in TODO.md under dedicated cleanup and verification items.

---

## 18) Feature Module Coverage Matrix (25 Modules)

This section summarizes the required per-module read pass over src/features with render intent, action/API usage, schema touchpoints, and hotspot notes.

| Module | What it renders / does | Server actions / APIs observed | DB tables / schema touchpoints (direct or implied) | Risk snapshot |
|---|---|---|---|---|
| admin | User management, moderation, system settings, platform analytics | Mostly TODO/no-op placeholders, no real action wiring in key admin surfaces | users, events, platform settings concepts | critical: control surfaces visible but mutations inert |
| agenda | User agenda/session planning with recommendation flow | getRecommendedSessions, updateUser | events/sessions-like agenda data, user profile | low |
| ai | Recommendations, organizer insights, event chatbot | getAIRecommendations, getAIContentRecommendations, getAIConnectionRecommendations, generate* AI helpers | events, recommendation/insight datasets | medium: mixed real/stub enrichment |
| analytics | Platform and organizer analytics dashboards | limited action usage, major mocked data paths | events/users/registrations analytics aggregates | medium |
| auth | Login/register/onboarding UX | useAuth-backed flows; OAuth via NextAuth pages | users/session | low-medium: provider availability env-gated |
| certificates | Template builder, bulk issue/distribution, certificate card | upsertCertificateTemplate, sendCertificateEmail | certificate_templates, users/attendee data | medium |
| chat | Real-time chat and AI chat widget | getChatRooms/getChatMessages/sendMessage/createChatRoom/searchUsers | chat_rooms, chat_messages, users | medium |
| check-in | QR/manual check-in scanner with attendance controls | getScannerEvents, checkInTicket, getAttendeeList, finalizeEvent | tickets, events | low |
| community | Community listing/detail/feed interactions | moderateContent appears, core CRUD paths are stubbed | communities, community_members, posts, comments | critical |
| dashboard | Attendee/organizer dashboards and engagement widgets | getUserRegistrations, getEvents, deleteEvent, cloneEvent | users, events, tickets/registrations | medium |
| events | Event cards/details/discussion/polls/gallery/forms/wizard paths | mix of real actions (CRUD/register/checkout/media/feedback) and stubbed discussion/poll/reaction paths | events, ticket_tiers, tickets, feedback templates, event_media | medium-high |
| export | Data export utilities | mostly client-side export (CSV/JSON) | events/tickets datasets | low |
| feed | Activity feed and social posting/commenting | post/comment mutation paths largely stubbed | activity_feed, posts, comments | critical |
| feedback | Feedback submission and analytics views | submit/analytics helper actions present in parts, some views data-dependent | event_feedback, feedback_templates | medium |
| gamification | Badge showcase and challenges hub | getUserBadges, join challenge path stubbed | badges, user_badges | medium |
| home | Landing/marketing surface | none (static UI) | none | low |
| leaderboard | Ranking/leaderboard UI | limited/no direct action fetch in current client | users (points/level/xp concepts) | medium |
| map | Campus/event map and map data model | none | event location metadata | low |
| matchmaking | Matchmaking wrapper/view | depends on matchmaking action flow in networking/AI integrations | user profiling/match result datasets | low-medium |
| networking | Connections, requests, matchmaking views | connection request/respond/remove paths stubbed | users/connections concepts | critical |
| notifications | Notification center/watcher with realtime integration | getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification | notifications | medium |
| organizer | Announcements, webhooks, sponsor tools, revenue/insights | mixed: some real actions (sponsors/insights), key areas (announcements/webhooks) still TODO stubs | events, sponsors, analytics/revenue, announcement/webhook concepts | high |
| preferences | User notification/preferences panel | updateUser | users | low |
| ticketing | Ticket browse/book/my tickets | booking mutation path stubbed in ticketing-client; cancellation path exists in payments action | tickets, events, ticket_tiers | high |

Notes:
1. The “module matrix” above is scoped to src/features as requested.
2. Several modules are structurally present but still intentionally placeholder-backed.
3. A full per-file ledger can be generated on request as a separate appendix if needed for handoff/compliance tracking.

---

## 19) Delta Corrections Applied After Verification Pass

This section tracks changes made after a second read-only verification pass so downstream execution work uses corrected assumptions.

1. Ticketing issue reframed from redirect parameter mismatch to success-state verification gap.
2. Auth guard issue reframed from route mismatch to legacy dead-path handling for /signup.
3. src/app inventory corrected to 94 files.
4. Route list expanded with additional page directories lacking both loading.tsx and error.tsx under certificates/organizer subpaths.
5. Pattern counts refreshed to TODO/FIXME=38, console.error=146, throw new Error=97.
6. Added module-level defect entry for admin analytics Loader2 usage without import and unreachable loading branch behavior.

---

## 20) Completed Fixes (Post-Audit Remediation)

This section tracks items from this audit that have been implemented and validated in the current codebase.

Date verified: 2026-04-18

### P0 / Auth hardening completed

1. Middleware auth dead-path cleanup completed.
   - Status: done
   - Evidence: auth-page redirect logic aligned to active routes (/login, /register), legacy /signup handling removed.
   - File: src/middleware.ts

2. OAuth provider strategy implemented safely.
   - Status: done
   - Evidence: Google provider wiring enabled only when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are present.
   - Files: src/auth.ts, src/hooks/use-auth.ts

3. Ticketing success fulfillment verification implemented.
   - Status: done
   - Evidence: success page now verifies checkout session + metadata + confirmed ticket fulfillment state via server action before showing confirmed UI; includes retry window for webhook propagation lag and explicit failed state.
   - Files: src/app/actions/payments.ts, src/app/(app)/ticketing/success/page.tsx

### P1 / Critical placeholder replacement completed

1. Admin TODO/no-op flows replaced.
   - Status: done
   - Evidence: real server actions and UI wiring for user management, system settings, and event moderation.
   - Files: src/app/actions/admin.ts, src/features/admin/user-management.tsx, src/features/admin/system-settings.tsx, src/features/admin/event-moderation.tsx

2. Organizer announcement and webhook tools wired.
   - Status: done
   - Evidence: real action layer and UI integration for list/create/update/deactivate announcement and list/create/delete webhooks.
   - Files: src/app/actions/organizer-tools.ts, src/features/organizer/announcement-manager.tsx, src/features/organizer/webhook-manager.tsx

3. Networking request lifecycle wired.
   - Status: done
   - Evidence: connect/respond/remove flow implemented through server actions and connected UI handlers.
   - Files: src/app/actions/networking.ts, src/features/networking/networking-client.tsx

4. Ticket booking path wired.
   - Status: done
   - Evidence: ticketing client now uses real event fetch + registration for free events + Stripe checkout session for paid events.
   - Files: src/features/ticketing/ticketing-client.tsx, src/app/actions/payments.ts

5. Community/feed/events/gamification placeholder rewires completed.
   - Status: done
   - Evidence: community list/detail, feed post/comment, event discussion/polls, and challenge join flows now call real actions.
   - Files: src/app/actions/communities.ts, src/app/actions/event-engagement.ts, src/app/actions/challenges.ts, src/features/community/community-list.tsx, src/features/community/community-detail.tsx, src/features/feed/feed-client.tsx, src/features/feed/comment-section.tsx, src/features/events/event-discussion-board.tsx, src/features/events/event-polls.tsx, src/features/gamification/challenges-hub.tsx

6. Event reactions no-op replaced with persisted reactions.
   - Status: done
   - Evidence: event reaction fetch + toggle actions implemented and wired in UI.
   - Files: src/app/actions/event-engagement.ts, src/features/events/event-reactions.tsx

7. Organizer revenue dashboard wired to real aggregates.
   - Status: done
   - Evidence: revenue/ticket trends, per-event revenue, daily revenue, and tier splits now sourced from organizer analytics server action.
   - Files: src/app/actions/analytics.ts, src/features/organizer/revenue-dashboard.tsx

8. Admin analytics defect fixed.
   - Status: done
   - Evidence: Loader spinner import conflict and unreachable loading branch corrected.
   - File: src/features/admin/admin-analytics-overview.tsx

### Verification status for completed items

1. Type safety verification: pass
   - Command: npx tsc --noEmit
   - Result: clean (exit code 0)

2. Lint verification: pass (warnings present)
   - Command: npm run lint
   - Result: 0 lint errors; warnings remain

3. Production build verification: pass (warnings present)
   - Command: npm run build
   - Result: build completed successfully

### Still open from this audit

1. Remaining open items are primarily non-blocking hardening tasks (route UX coverage, i18n practical coverage, hook dependency warning cleanup, and broader smoke/regression automation).

