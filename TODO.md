# Eventra - Full Audit, Fix & Redesign Tasks

## Batch 1: Critical Infrastructure
- [x] Fix Twilio eager initialization crash
- [x] Setup Razorpay environment variables (.env.example)
- [x] Implement Razorpay Order creation in src/app/actions/payments.ts
- [x] Create Razorpay Webhook handler (idempotency + ticket creation)
- [x] Remove legacy Stripe code and routes

## Batch 2: Wire Mocked Features to Real Backends
- [x] Wire admin dashboard to real queries
- [x] Wire user management to real CRUD
- [x] Wire event moderation to real data
- [x] Wire admin analytics to real aggregates
- [x] Wire system settings
- [x] Wire networking/matchmaking
- [x] Wire gamification (client + challenges)
- [x] Wire community (list + detail)
- [x] Wire calendar page
- [x] Wire event discussions + polls
- [x] Wire my-events page
- [x] Wire organizer sub-features (announcements, co-organizers, revenue, webhooks)
- [x] Wire agenda page
- [x] Wire analytics dashboard
- [x] Wire ticketing client
- [x] Wire referral system
- [x] Implement follow button
- [x] Implement Razorpay signature verification
- [x] Implement Razorpay refund logic
- [x] Fix event edit page
- [x] Add /profile page
- [x] Add /settings page

## Batch 3: i18n Completion
- [x] Add 200+ keys to en.json
- [x] Add 200+ keys to es.json

## Batch 4: Design System Foundation
- [x] Redesign globals.css (Apple-inspired/Posh tokens, light+dark)
- [x] Update tailwind.config.ts (Apple shadows, DM Sans, polished palette)
- [x] Update root layout.tsx (DM Sans setup)
- [x] Redesign all 27 UI primitives in src/components/ui/ (Apple/Posh style)

## Batch 5: Layout Redesign
- [x] Redesign header.tsx (Minimal/Posh)
- [x] Redesign organizer-sidebar.tsx
- [x] Redesign (app)/layout.tsx (Clean/Posh)
- [x] Redesign (auth)/layout.tsx (Clean/Posh)
- [x] Add loading.tsx + error.tsx to all routes

## Batch 6: Feature Page Redesigns
- [x] Landing page (home) (Posh/Apple aesthetic)
- [x] Explore / event discovery (Wired to backend + Posh UI)
- [x] Event detail page
- [x] Event creation wizard
- [x] Dashboard (attendee + organizer) (Wired + Posh UI)
- [x] Admin panel (Wired + Posh UI)
- [x] Ticketing & check-in
- [x] Certificates
- [x] Feedback & NPS
- [x] Gamification & leaderboard
- [x] Community, chat, feed
- [x] AI tools
- [x] Notifications
- [x] Networking & matchmaking
- [x] Map, agenda, calendar
- [x] Profile page (New + Posh)
- [x] Search, preferences, settings (Wired + Posh)

## Batch 7: Final Verification
- [ ] npx tsc --noEmit → 0 errors
- [ ] next lint → 0 errors
- [ ] All routes render
- [ ] RBAC enforcement verified
- [ ] Schema alignment confirmed
- [ ] i18n 100% coverage confirmed
