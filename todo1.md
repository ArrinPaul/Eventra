# Eventra Production Feature Restoration Roadmap

This document tracks the systematic restoration of high-level features from the original vision into the new Supabase + Next.js 15 architecture.

## 1. Role-Based Access Control (RBAC) & Security 🔐
- [x] **Server-side Middleware Guards**: Protect routes based on session roles (e.g., `/admin/*`, `/organizer/*`).
- [x] **Action Authorization Utility**: Created `validateRole` helper for Server Actions.
- [x] **Owner-only Protection**: Implemented `validateEventOwnership`.

## 2. Event Engine Completion 🎫
- [x] **Event Cloning**: Restored the `cloneEvent` capability with deep copy of metadata.
- [ ] **Recurring Events**: Implement the recurrence logic (Daily, Weekly, Monthly).
- [ ] **Waitlist Logic**: Re-implement the auto-promotion logic when tickets are cancelled.
- [ ] **Stripe Payments**: Replace the "Free" stub with real Stripe Checkout sessions and Webhook handling.

## 3. AI Intelligence (Genkit Re-Wiring) 🤖
- [ ] **Data Contextualization**: Update all 16 Genkit flows to query Supabase instead of Convex.
- [ ] **AI Event Planner**: Re-wire the description and agenda generator.
- [ ] **Chatbot Memory**: Use the new `ai_chat_sessions` table for persistent AI context.
- [ ] **Recommendations**: Use SQL similarity or AI embeddings for "Top Picks".

## 4. Social Hub & Real-time Chat 💬
- [ ] **Social Actions**: Implement `createPost`, `deletePost`, and `likePost`.
- [ ] **Community Management**: Implement `joinCommunity`, `leaveCommunity`, and member role management.
- [ ] **Real-time Engine**: Activate Supabase Realtime for the `enhanced-chat-client.tsx`.
- [ ] **Feed Aggregation**: Build a global activity feed pulling from events, posts, and registrations.

## 5. Gamification Engine 🏆
- [ ] **XP Tracking**: Automated XP awarding on event registration, check-in, and social posting.
- [ ] **Badge Logic**: Create a background service (or edge function) to award badges when criteria are met.
- [ ] **Leaderboard**: Finalize the SQL query for the global and community-specific leaderboards.

## 6. Communication & Notifications 🔔
- [ ] **In-app Notifications**: Connect the `notifications` table to the UI with real-time updates.
- [ ] **Email Delivery**: Re-integrate Resend/SendGrid for ticket confirmations.
