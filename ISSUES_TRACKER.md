# Eventra Issue Tracker

This file tracks the progress of functional fixes and feature implementations.

## 🔴 Critical & Non-Functional (High Priority)
- [ ] **External Broadcast System**: Integrate SendGrid/Twilio for real-time mobile/email alerts.
- [ ] **Sponsor Lead Retrieval**: Implement backend for sponsor scanning and lead management.
- [ ] **Social API Distribution**: Add real-time posting to X/LinkedIn/FB APIs.

## 🟡 Partially Functional (Medium Priority)
- [x] **Co-Organizer Identity Resolution**: Resolve IDs into names/avatars in the team manager. (Fixed - Added getUsersByIds)
- [x] **Selective Waitlist Promotion**: Allow promoting specific users instead of just "next-in-line". (Fixed - Updated autoPromoteFromWaitlist)
- [x] **Real-time Reconnection Logic**: Add heartbeat/retry to Supabase Realtime channels. (Fixed - Added reconnection handling in chat client)
- [ ] **AI Recommendation Logic**: Move from mock data to real interaction-based collaborative filtering.

## 🛠️ Optimizations & Technical Debt (Low Priority)
- [x] **Admin Server-Side Pagination**: Add skip/take to user management lists. (Fixed - Implemented offset pagination)
- [ ] **AI Type-Safety**: Implement Zod validation for all LLM return objects.
- [ ] **UI Polish**: Audit all placeholder text and replace with final copy.

---
*Last Updated: 2026-06-14*
