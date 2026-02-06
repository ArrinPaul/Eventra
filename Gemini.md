# Eventra Project Analysis - February 6, 2026

## 1. Project Overview
**Eventra** is a comprehensive, AI-powered event management and attendee engagement platform. Built with **Next.js 15** and **Convex**, it aims to provide a seamless experience for organizers to manage events and for attendees to discover, register, and engage with content.

The project is currently undergoing a major architectural shift, moving from a Firebase/Firestore backend to a **Convex**-native implementation.

---

## 2. Current Tech Stack
- **Framework:** Next.js 15 (App Router) with Turbopack.
- **Backend/Database:** Convex (Primary, in transition), Firestore (Legacy/Partial).
- **Authentication:** Convex Auth.
- **AI Integration:** Genkit (Google AI / OpenAI) for agenda planning and insights.
- **UI/UX:** Tailwind CSS, Radix UI, Lucide Icons, Framer Motion.
- **Analytics:** Recharts.
- **Testing:** Vitest (Unit/Integration), Playwright (E2E).

---

## 3. Feature Map & Implementation Status

### ✅ Core Features (Functionally Advanced)
- **Multi-Persona Support:** Specialized dashboards for Students, Professionals, Organizers, and Admins.
- **Event Discovery:** Browseable event lists with category and audience filtering.
- **Onboarding:** Detailed wizard for user profile setup based on role.
- **UI/UX Design:** Modern "Glass-effect" dark theme with a consistent color palette.

### ⚠️ In-Progress / Transitioning Features
- **Organizer Dashboard:** UI is polished but currently broken due to missing Firestore service references. Needs migration to Convex.
- **Ticketing System:** Logic exists in `ticketing-service.ts` but relies on missing Firebase configurations.
- **AI Flows:** Several Genkit flows (Agenda Recommendations, Planner, Bot) are scaffolded but require further integration with live event data.
- **Authentication:** Migration to Convex Auth is partially complete, but legacy Firestore auth checks may still exist.

### 🛠️ Incomplete / Shell Features (UI Only)
- **Gamification:** Points, Badges, and Leaderboards have UI components but lack a backend schema in Convex.
- **Certificates:** Basic structure exists, but the generation logic is not fully implemented.
- **Networking/Matchmaking:** Feature folders exist, but real-time matching logic is minimal.
- **File Storage:** User avatars and event images still have `TODO`s for Convex File Storage implementation.

---

## 4. Key Issues & Technical Debt
1. **Broken Imports:** Many components (e.g., `EventsClient`, `OrganizerDashboard`) attempt to import `firestore-services` which has been removed or refactored.
2. **Missing Backend Logic:** The `convex/schema.ts` only defines `users`, `events`, and `registrations`. Features like `chat`, `notifications`, `badges`, and `groups` lack database tables.
3. **TypeScript Errors:**
   - `src/components/dashboard/organizer-dashboard-client.tsx`: Errors related to missing `toDate()` methods on Date objects (legacy Firebase logic).
   - `src/core/utils/validation/auth.ts`: Zod refinement mismatches in registration schemas.
4. **Configuration Gaps:** `src/core/config/firebase.ts` is missing, breaking all legacy service dependencies.

---

## 5. Recommended Roadmap for Completion

### Phase 1: Stabilization (Immediate)
- [ ] **Fix Broken Imports:** Redirect or stub out missing service imports to prevent build failures.
- [ ] **Resolve TS Errors:** Fix the Zod validation logic in `auth.ts` and type mismatches in the dashboard.
- [ ] **Convex Schema Expansion:** Add tables for `tickets`, `notifications`, `messages`, `groups`, `badges`, and `points`.

### Phase 2: Feature Migration
- [ ] **Port Services:** Rewrite `ticketing-service.ts` and `event-service` to use Convex queries and mutations instead of Firestore.
- [ ] **Onboarding & Storage:** Implement Convex File Storage for profile and event image uploads.
- [ ] **Auth Cleanup:** Ensure all auth hooks (`useAuth`) are fully unified under Convex Auth.

### Phase 3: AI & Engagement
- [ ] **AI Integration:** Wire up Genkit flows to real-time data from the Convex database.
- [ ] **Live Features:** Implement real-time chat and notifications using Convex's reactive subscriptions.
- [ ] **Gamification Engine:** Build the logic to award points and badges based on user actions (check-ins, registrations).

---

## 6. Project Vision
Eventra is positioned to be a high-end "Community-as-a-Service" for event organizers, focusing on **AI-driven personalization** and **gamified engagement** to set it apart from standard ticketing platforms like Eventbrite.
