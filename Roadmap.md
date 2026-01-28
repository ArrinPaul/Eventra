# EventOS Master Technical Roadmap & Specification

## 1. Project Vision & Core Architecture
**EventOS** is an intelligent, multi-tenant SaaS event management platform designed for campus ecosystems. It bridges the gap between event organizers and participants using AI-driven automation, real-time engagement tools, and deep campus infrastructure integration.

**Tech Stack:**
- **Frontend:** Next.js 15 (App Router), Tailwind CSS, Shadcn UI, Framer Motion.
- **Backend:** Firebase (Firestore, Auth, Functions, Storage).
- **AI Engine:** Google Genkit + Gemini 1.5 Pro (Serverless AI).
- **State Management:** React Context + SWR/TanStack Query.

---

## 2. Detailed Feature Specifications

### 2.1. Landing & Marketing Module (`/`)
**Goal:** Convert visitors into Users (Participants) or Organizers.

*   **UI Components:**
    *   `HeroSection`: Large typography "Connecting People Through...", dynamic subtext, two primary CTA buttons ("Create Event" - variant: default, "Explore Events" - variant: outline).
    *   `StatsTicker`: An animated counter component showing:
        *   `events_created`: Integer (e.g., 500+)
        *   `success_rate`: Percentage (e.g., 98%)
        *   `active_users`: Integer (e.g., 12k+)
    *   `FeatureCarousel`: Auto-scrolling cards highlighting "AI Analytics", "QR Ticketing", "Certificates".
    *   `LivePreview`: A mock "phone" frame or "dashboard" tilt-view showing a screenshot of the app in action.
    *   `TestimonialGrid`: Masonry layout of user reviews.
*   **Data Requirements:**
    *   `cms_content` (Firestore): Collection to store editable landing page text/stats so a redeploy isn't needed for copy changes.

### 2.2. Authentication & Onboarding (`/auth`)
**Goal:** Secure, role-based entry.

*   **User Flow:**
    1.  User clicks "Login" or "Get Started".
    2.  Selects Role: "Student/Participant" or "Organizer/Admin".
    3.  Method: Google OAuth (preferred) or Email/Password.
    4.  **Onboarding Wizard (Post-Signup):**
        *   *Step 1:* Profile Photo upload.
        *   *Step 2 (Student):* Select Campus Department, Year of Study, Interests (Tags).
        *   *Step 3 (Organizer):* Organization Name, Verification Document Upload.
*   **Database Schema (`users` collection):**
    ```typescript
    interface UserProfile {
      uid: string;
      email: string;
      role: 'participant' | 'organizer' | 'admin';
      displayName: string;
      photoURL: string;
      onboardingCompleted: boolean;
      // Participant Specific
      department?: string;
      year?: string;
      interests?: string[]; // e.g., ['Coding', 'Music', 'Debate']
      wishlist?: string[]; // Array of Event IDs
      attending?: string[]; // Array of Event IDs
      // Organizer Specific
      organizationName?: string;
      isVerified?: boolean;
    }
    ```

### 2.3. Discovery & Explore Engine (`/explore`)
**Goal:** Personalized event finding.

*   **UI Layout:**
    *   **Sidebar/TopBar:** Filters.
        *   `DateRangePicker`: "Today", "This Week", "Weekend", Custom.
        *   `CategorySelect`: Multi-select (Workshop, Seminar, Cultural, Sports).
        *   `LocationDropdown`: Campus specific (Main Audi, Lab Block, Online).
    *   **Main Grid:** Infinite scroll of `EventCard` components.
    *   `EventCard` Details:
        *   Thumbnail Image (Aspect Ratio 16:9).
        *   Title (Truncated 2 lines).
        *   Date & Time (Formatted: "Fri, Oct 24 • 10:00 AM").
        *   Location Icon + Text.
        *   **Action Bar:**
            *   `HeartButton`: Toggles "Interested" (Add to Wishlist).
            *   `TicketButton`: Direct "Register" modal trigger.
            *   `AttendeesPreview`: "Avatar stack" of 3 friends attending + "+12 others".
*   **Search Algorithm:**
    *   **Keyword Search:** Fuse.js or Algolia (client-side if small dataset, server-side if large). matches Title, Description, Organizer.
    *   **Recommendation Logic:**
        *   IF `user.interests` overlaps `event.tags` -> Boost Score.
        *   IF `event.location` == `user.department` -> Boost Score.

### 2.4. Event Tracking & Wishlist (`/track`)
**Goal:** Retention and day-of-event utility.

*   **UI Tabs:**
    1.  **"Going" (Registered):**
        *   Shows confirmed tickets.
        *   **Live Status Indicator:** "Starts in 2h", "Live Now" (Blinking Red Dot), "Ended".
        *   **Quick Actions:** "View Ticket" (QR), "Map".
    2.  **"Wishlist" (Interested):**
        *   List of saved events.
        *   CTA: "Register Now" (Conversion driver).
    3.  **"Past Events":**
        *   History.
        *   Action: "Download Certificate", "Rate Event".

### 2.5. Organizer Command Center (`/dashboard`)
**Goal:** Manage the entire event lifecycle.

#### A. Create Event Wizard (`/dashboard/create`)
*   **Step 1: The Basics**
    *   Title, Description (Rich Text Editor).
    *   Banner Image (Drag & Drop with Crop).
*   **Step 2: Logistics**
    *   Date/Time (Start & End).
    *   Location (Google Maps Integration or Campus Presets).
    *   Capacity Limit.
*   **Step 3: AI Planner (The "Magic" Button)**
    *   **Input:** "Tech hackathon for 100 students."
    *   **Genkit Output:** Auto-fills Description, suggests "Agenda" items (Opening Ceremony, Hacking, Lunch, Demos), generates "Checklist" (Wifi, Power strips, Pizza).
*   **Step 4: Ticketing**
    *   Toggle: Free vs Paid.
    *   Custom Fields: "T-Shirt Size", "Dietary Restrictions".

#### B. Analytics Dashboard (`/dashboard/analytics`)
*   **Visualizations (Recharts/Chart.js):**
    *   `RegistrationTrend`: Line chart showing signups over time.
    *   `DepartmentPieChart`: Breakdown of attendees by department.
    *   `CheckInRealTime`: Gauge chart showing % of registered users currently checked in.
*   **AI Insights:**
    *   Text block: "Your event popularity is trending 20% higher than last month. Consider opening 50 more seats."

#### C. Stakeholder View**
*   **Description:** A read-only link generated for sponsors.
*   **Data:** Shows Impressions, Click-throughs, and Demographics (anonymized) but hides sensitive PII (Personally Identifiable Information).

### 2.6. Ticketing & Check-in System
**Goal:** Secure and fast entry.

*   **Ticket Generation:**
    *   On registration success -> Generate unique UUID.
    *   Create QR Code (using `qrcode.react`).
    *   Store in `tickets` collection: `{ eventId, userId, status: 'valid', scannedAt: null }`.
*   **Scanner App (Mobile View):**
    *   Uses device camera (`html5-qrcode` or similar).
    *   **Flow:** Scan -> API Check -> Beep Success/Fail -> Update UI ("Verified" Green Screen).
    *   **Offline Mode:** Cache ticket list locally if network is spotty, sync when back online.

### 2.7. Automated Certification
**Goal:** Reward participation.

*   **Trigger:** Event ends AND User `status == 'checked-in'`.
*   **Process:**
    1.  Organizer clicks "Release Certificates".
    2.  Cloud Function triggers.
    3.  Fetches HTML Template.
    4.  Injects User Name, Date, Event Title.
    5.  Generates PDF (using `puppeteer` or `pdf-lib`).
    6.  Stores in Storage bucket.
    7.  Updates User Profile with Download Link.

### 2.8. Campus Map & Infrastructure
**Goal:** Physical navigation.

*   **Component:** `InteractiveMap` (Leaflet or SVG based).
*   **Features:**
    *   Clickable Zones: "Library", "Cafeteria".
    *   Overlays: "Current Events" pin drops on the map.
    *   Pathfinding: "Draw path from Entrance A to Auditorium."

---

## 3. Implementation Phases (Step-by-Step)

### Phase 1: Foundation (Weeks 1-2) ✅ COMPLETE
- [x] **Setup:** Next.js 15, Firebase Config, Shadcn UI installation.
- [x] **Auth:** Complete Google Sign-in and Role-based Route Protection (`middleware.ts`).
- [x] **DB:** Initialize Firestore collections (`users`, `events`, `tickets`).
- [x] **TanStack Query:** Installed and configured for data fetching.
- [x] **Onboarding Wizard:** Multi-step wizard for new users (Profile, Student/Organizer specifics).

### Phase 2: Core Event Mechanics (Weeks 3-4) 🔄 IN PROGRESS
- [ ] **Create Event Form:** Basic fields + Image Upload.
- [ ] **Feed:** Infinite scroll of events.
- [ ] **Registration:** Transactional write to DB (decrement capacity, create ticket).
- [ ] **QR:** Display QR for user, Basic Scanner for admin.

### Phase 3: AI & Advanced Features (Weeks 5-6)
- [ ] **Genkit Integration:** "Generate Description" and "Plan Schedule" features.
- [ ] **Analytics:** Aggregation functions (count triggers).
- [ ] **Certificate Engine:** PDF generation pipeline.

### Phase 4: Polish & Growth (Weeks 7-8)
- [ ] **Wishlist/Track:** State persistence.
- [ ] **Notifications:** Email (Resend/SendGrid) on registration.
- [ ] **Map:** SVG Map integration.
- [ ] **Feedback Loop:** Post-event survey form + AI Sentiment Analysis.

---

## 4. API Routes & Server Actions Strategy

*   **`GET /api/events`**: Returns paginated events. Query params: `category`, `date`.
*   **`POST /api/events/register`**: Atomic transaction. Checks capacity -> Creates Ticket -> Updates User.
*   **`POST /api/ai/generate-plan`**: Protected. Calls Genkit flow.
*   **`POST /api/tickets/scan`**: Admin only. Validates and burns the QR token.

## 5. Security Rules (Firestore)
*   **Events:** Public Read. Create/Update: Organizer Only.
*   **Tickets:** Read: Owner or Organizer. Write: Server Only (via Actions).
*   **Users:** Read Profile: Public (limited fields). Write: Owner Only.