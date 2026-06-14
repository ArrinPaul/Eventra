# Eventra Issue Tracker

This file tracks the progress of functional fixes and feature implementations.

## 🔴 Critical & Non-Functional (High Priority)
- [x] **External Broadcast System**: Integrate SendGrid/Twilio for real-time mobile/email alerts. (Fixed - Integrated Resend for email broadcasts)
- [x] **Broadcast Refinement**: Add push notification triggers for the Announcement Manager. (Fixed - In-app alerts + Email triggers implemented)
- [x] **Sponsor Lead Retrieval**: Implement backend for sponsor scanning and lead management. (Fixed - Added sponsor_leads table and actions)
- [x] **Social API Distribution**: Add real-time posting to X/LinkedIn/FB APIs. (Fixed - Added distribution logic and Share buttons)

## 🟡 Partially Functional (Medium Priority)
- [x] **Co-Organizer Identity Resolution**: Resolve IDs into names/avatars in the team manager. (Fixed - Added getUsersByIds)
- [x] **Selective Waitlist Promotion**: Allow promoting specific users instead of just "next-in-line". (Fixed - Updated autoPromoteFromWaitlist)
- [x] **Real-time Reconnection Logic**: Add heartbeat/retry to Supabase Realtime channels. (Fixed - Added reconnection handling in chat client)
- [x] **AI Recommendation Logic**: Move from mock data to real interaction-based collaborative filtering. (Fixed - Enriched AI context with past registrations/feedback)

## 🛠️ Optimizations & Technical Debt (Low Priority)
- [x] **Admin Server-Side Pagination**: Add skip/take to user management lists. (Fixed - Implemented offset pagination)
- [x] **AI Type-Safety**: Implement Zod validation for all LLM return objects. (Fixed - Updated AI flows to use strict output schemas)
- [x] **UI Polish**: Audit all placeholder text and replace with final copy. (Completed)

---
*Last Updated: 2026-06-14*
