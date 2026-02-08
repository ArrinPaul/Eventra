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

## Phase 5: AI & Intelligence 🛠️ (Current)
- [ ] **AI Recommendations**: Connect `ai-recommendations.ts` action to Convex `events` query.
- [ ] **Genkit Wiring**: Wire Genkit flows to the live Convex database.
- [ ] **Chatbot Enhancement**: Upgrade AI Bot to answer questions about specific events.

## Phase 6: Advanced Features 🚀
- [ ] **Matchmaking**: AI-driven user networking recommendations.
- [ ] **Certificate Engine**: Server-side PDF generation for attendance.
- [ ] **Analytics Deep-Dive**: Advanced aggregation queries for organizers.

## Phase 7: Deployment & Verification 🏁
- [x] **Build Verification**: `npm run typecheck` passing.
- [ ] **Vercel Deployment**: Final deployment and environment verification.