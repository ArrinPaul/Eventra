# Eventra Roadmap (Post-Migration)

## Phase 1: Removal & Cleanup ✅
- [x] **Zero Firebase Policy**: Removed all SDKs, configs, and service workers.
- [x] **Broken Import Cleanup**: Fixed all references to deleted firestore-services.
- [x] **Page Audit**: Deleted broken/legacy routes (map, search, forgot-password).

## Phase 2: Convex Backend Core ✅
- [x] **Unified Schema**: 13 tables defined in `convex/schema.ts`.
- [x] **Convex Auth**: Google OAuth integration complete.
- [x] **Core Logic**: Events, Tickets, Chat, and Notifications fully functional in Convex.

## Phase 3: Engagement & Gamification ✅
- [x] **Gamification System**: Points (XP) and Badge logic implemented.
- [x] **Social Hub**: Community and Feed logic implemented.
- [x] **Ticketing**: QR-native ticketing system functional.

## Phase 4: Storage & Assets ✅
- [x] **Convex Storage**: `useStorage` hook functional.
- [x] **Onboarding**: Profile photo upload integrated with storage.

## Phase 5: AI & Intelligence ✅
- [x] **AI Recommendations**: Connected `ai-recommendations.ts` action to Convex `events` query.
- [x] **Genkit Wiring**: Wired Genkit flows (Recommendations, Chatbot, Matchmaking, Planner) to Convex data.
- [x] **Chatbot Enhancement**: Upgraded AI Bot to answer questions about specific events using Convex data.
- [x] **AI Event Planner**: Added "AI Assist" in event creation to generate agendas and descriptions.

## Phase 6: Advanced Features 🛠️ (Current)
- [x] **Matchmaking**: AI-driven user networking recommendations implemented.
- [ ] **Certificate Engine**: Server-side PDF generation for attendance.
- [ ] **Analytics Deep-Dive**: Advanced aggregation queries for organizers.
- [ ] **Smart Notifications**: AI-driven personalized event reminders.

## Phase 7: Deployment & Verification 🏁
- [x] **Build Verification**: `npm run typecheck` passing.
- [ ] **Vercel Deployment**: Final deployment and environment verification.