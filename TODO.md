# Eventra Project TODO - Master Implementation List

This list contains all tasks required for full feature parity and production readiness, merged from the project audit and your specific feature requirements.

---

## 1. QR Code & Check-in Lifecycle (Advanced Ticketing)
*   **Current Status:** The tickets table has a `qrCode` field; `check-in-scanner` route exists; database schema is ready.
*   **What's Missing / Missing Pieces:**
    - [x] **State Machine:** Implement the full lifecycle for tickets (Active → Scanned → Expired).
    - [x] **Anti-Fraud Logic:** Prevent spoofing and multiple check-ins with the same QR code.
    - [x] **Verify API:** Replace the current skeleton with a robust API using role-based scanning permissions.
    - [x] **Offline Mode:** Allow scanners to cache data and sync when the connection returns.
    - [x] **Ticket Status Engine:** Automated transitions from Confirmed → Checked-in → Expired.

## 2. Certificate Generation & Distribution (Export Engine)
*   **Current Status:** A `certificates.ts` action and a dedicated UI route exist; basic routes and PDF libraries are installed.
*   **What's Missing / Missing Pieces:**
    - [x] **Template Editor / Builder:** A UI for organizers to design layouts and drag-and-drop text/images onto certificates.
    - [x] **Bulk Distribution:** Logic to generate 500+ certificates and email them all at once.
    - [x] **Packaging:** Implement ZIP packaging for bulk certificates and PDF/DOCX exports via jsPDF.
    - [x] **Production Readiness:** Transition from the current system to a full production-grade engine.

## 3. Feedback & Analytics System (Interactive & NPS)
*   **Current Status:** A basic `event_feedback` table exists for ratings/comments; basic fields exist in the schema.
*   **What's Missing / Missing Pieces:**
    - [ ] **Template System:** Implement the "Template System" in Drizzle to allow custom questions per event.
    - [ ] **Custom Questionnaires:** Enable organizers to create their own feedback forms (e.g., "How was the food?").
    - [ ] **NPS & Analytics:** Automated calculation of Net Promoter Score (NPS) and satisfaction trends across events.
    - [ ] **Auto-Dispatch:** Logic for automated feedback email dispatch after events.

## 4. Event Analytics & AI Insights (AI Operational Tools)
*   **Current Status:** `analytics.ts` and `event-insights.ts` actions are present; Vector-based discovery is active.
*   **What's Missing / Missing Pieces:**
    - [ ] **AI-Synthesized Reports:** Merge financial, attendee, and feedback data into downloadable PDF/DOCX.
    - [ ] **AI Task Generation:** A tool that reads an event description and automatically generates a "To-Do" list for the organizer.
    - [ ] **Automated Summaries:** Generating professional "After Action Reports" based on event data.
    - [ ] **Data Expansion:** Move beyond basic fetching to deep insights for organizers.

## 5. Role-Based Collaboration (RBAC & Event-Level)
*   **Current Status:** Global roles (Admin/Organizer/Attendee) and basic auth guards exist.
*   **What's Missing / Missing Pieces:**
    - [ ] **Event-Specific Staffing:** Ability to assign "Volunteer" or "Speaker" roles for a single event without changing global account roles.
    - [ ] **Granular Permissions:** Implement event-level permission logic (currently more global-role oriented).
    - [ ] **Stakeholder Imports:** Port the bulk import logic for guest lists (from the original XLSX requirement) to Postgres.

## 6. Automated Waitlist Management (Recovery Logic)
*   **Current Status:** A `waitlist` table is in place; toggle exists in the event creation form.
*   **What's Missing / Missing Pieces:**
    - [ ] **Auto-Promotion Flow:** Logic to automatically notify the first person on the waitlist when a ticket is cancelled.
    - [ ] **Reservation Logic:** Automatically reserve a spot for the promoted user.
    - [ ] **Expiration Window:** Implement a 24-hour expiration window for waitlist claims.

## 7. Media Gallery & Management (Social Assets)
*   **Current Status:** Simple image URL support for events and social posts; management is currently manual.
*   **What's Missing / Missing Pieces:**
    - [ ] **Centralized Gallery:** A dedicated page for event attendees to upload photos and for organizers to moderate/approve them.
    - [ ] **ImageKit/Cloudinary Workflow:** Implement metadata editing (captions/tags), cropping, and resizing.
    - [ ] **Visibility Controls:** Public/private visibility toggles for event media.
    - [ ] **Tracking:** View and download count tracking for event media.

## 8. Gamification Triggers (Engagement Logic)
*   **Current Status:** The `badges`, `points`, and `user_badges` tables are defined; `awardXP` works.
*   **What's Missing / Missing Pieces:**
    - [ ] **Automated Criteria Engine:** Background logic to check milestones (e.g., "Attended 5 Tech Events") and grant badges automatically.
    - [ ] **Activity Feed Wiring:** Fully wire the achievement logic into the live activity feed.
    - [ ] **Milestone Tracking:** Real-time intervention-free badge awarding system.

---

## 🛠️ Additional Infrastructure Tasks
- [ ] **Stripe Webhook Lifecycle:** Complete handlers for Refunds and Chargebacks.
- [ ] **SMS Integration:** Twilio support for critical event alerts.
- [ ] **UX Polish:** Audit every "Empty State" and "Error Boundary".
- [ ] **Admin Branding:** Multi-tenant configuration for organization-specific styling.
