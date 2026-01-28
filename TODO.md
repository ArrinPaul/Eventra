# EventOS Master Implementation Todo List

This document provides a granular, step-by-step checklist for building EventOS, merging features from the Eventra base and Eventtts competitive analysis.

---

## 🏗 Phase 1: Foundation & Authentication (Weeks 1-2)

### 1.1 Project Setup & Configuration
- [ ] **Initialize Next.js 15 Environment:**
    - [ ] Verify `app/` directory structure.
    - [ ] Configure `tailwind.config.ts` with custom brand colors (Christ University Blue & Sky Blue).
    - [ ] Install Shadcn UI base components (`button`, `input`, `card`, `dialog`, `toast`).
- [ ] **Firebase Integration:**
    - [ ] Verify `lib/firebase.ts` connects to the correct project.
    - [ ] Configure `firebase.json` for Hosting and Functions.
- [ ] **State Management Setup:**
    - [ ] Wrap root layout with `AuthProvider`.
    - [ ] Set up `TanStack Query` (React Query) provider for data fetching.

### 1.2 Authentication & User Profiles
- [ ] **Login Interface (`/auth/login`):**
    - [ ] Create UI with "Login as Student" and "Login as Organizer" toggle.
    - [ ] Implement Google OAuth provider logic.
    - [ ] Implement Email/Password fallback flow.
- [ ] **Role-Based Routing:**
    - [ ] Create `middleware.ts` to protect `/dashboard/*` (Organizer) and `/admin/*`.
    - [ ] Redirect logic: Organizers -> `/dashboard`, Students -> `/explore`.
- [ ] **Onboarding Wizard (`/auth/onboarding`):**
    - [ ] **Step 1: Profile Details** (Photo upload to Firebase Storage).
    - [ ] **Step 2: Student Specifics** (Department dropdown, Year, Interests tag selector).
    - [ ] **Step 3: Organizer Specifics** (Organization Name, Verification Doc upload).
    - [ ] **Submission:** Write to `users` collection in Firestore with `onboardingCompleted: true`.

---

## 🚀 Phase 2: Core Event Management (Weeks 3-4)

### 2.1 Organizer Dashboard - Basic
- [ ] **Dashboard Layout:**
    - [ ] Sidebar navigation (Overview, Events, Analytics, Settings).
    - [ ] "Create Event" floating action button.
- [ ] **Event Creation Wizard (Part 1 - CRUD):**
    - [ ] **Basic Info Form:** Title, Description (Rich Text), Banner Image Upload.
    - [ ] **Logistics Form:** Date/Time picker, Location (Campus Preset Dropdown).
    - [ ] **Settings:** Capacity limit, Ticket Price (Free/Paid toggle).
    - [ ] **Submit Action:** Write to `events` collection.

### 2.2 Discovery & Feed (Participant View)
- [ ] **Home Feed (`/explore`):**
    - [ ] Implement Infinite Scroll using React Query `useInfiniteQuery`.
    - [ ] **Event Card Component:**
        - [ ] Display Banner, Title, Date, Location.
        - [ ] "Interested" Heart icon (Optimistic UI update).
    - [ ] **Filters:** Implement Category pills and Date Range picker.
- [ ] **Event Details Page (`/events/[id]`):**
    - [ ] Fetch full event data (server component).
    - [ ] "Register" Button (Logic: Check capacity -> Transaction).

### 2.3 Ticketing & Registration Logic
- [ ] **Registration Flow:**
    - [ ] Create `registerForEvent` Server Action.
    - [ ] **Transaction:**
        - [ ] Check if `capacity > registeredCount`.
        - [ ] Create document in `tickets` collection.
        - [ ] Add user ID to `events/{id}/attendees`.
        - [ ] Increment `registeredCount` on event document.
- [ ] **My Tickets View:**
    - [ ] Render QR Code component (`qrcode.react`) using Ticket UUID.

---

## 🤖 Phase 3: AI & Advanced Organizer Tools (Weeks 5-6)

### 3.1 AI Planner Module (Genkit)
- [ ] **Setup Genkit:**
    - [ ] Initialize Genkit in Firebase Functions.
    - [ ] Configure Gemini 1.5 Pro model.
- [ ] **"Magic Plan" Feature:**
    - [ ] Create UI: "Generate Event Plan" button in Create Wizard.
    - [ ] **Backend Flow:**
        - [ ] Prompt: "Create a schedule and checklist for a [Type] event for [Count] people."
        - [ ] Return JSON: `{ agenda: [], checklist: [], description: "" }`.
    - [ ] **Frontend:** Auto-fill form fields with generated data.

### 3.2 Advanced Analytics Dashboard
- [ ] **Data Aggregation:**
    - [ ] Create Scheduled Function to calculate daily stats.
- [ ] **Visualization Components:**
    - [ ] `AttendanceChart`: Line graph of registrations over last 30 days.
    - [ ] `DemographicsPie`: Distribution by Department.
- [ ] **AI Insights Widget:**
    - [ ] Integrate Gemini to analyze registration trends and output text advice.

### 3.3 Stakeholder Dashboard
- [ ] **Public/Shared View:**
    - [ ] Generate unique hash link for events (e.g., `/dashboard/share/[hash]`).
    - [ ] Create Read-Only layout showing just key metrics (ROI, Headcount).

---

## 💎 Phase 4: Engagement & Polish (Weeks 7-8)

### 4.1 Wishlist & Tracking
- [ ] **Wishlist System:**
    - [ ] Create `wishlist` array in User profile.
    - [ ] Build `/track` page with tabs: "Going", "Saved", "Past".
- [ ] **Live Status:**
    - [ ] Implement logic to show "Live Now" badge if `currentTime` is within event window.

### 4.2 Scanner App & Check-in
- [ ] **Scanner Interface (`/admin/scan`):**
    - [ ] Integrate `html5-qrcode` library.
    - [ ] **Verification Logic:**
        - [ ] Query `tickets` by UUID.
        - [ ] Check if `scannedAt` is null.
        - [ ] If valid: Update `scannedAt` timestamp, beep success.
        - [ ] If invalid/duplicate: Show error alert.

### 4.3 Automated Certification
- [ ] **Certificate Generator:**
    - [ ] Design HTML template for certificate.
    - [ ] Create Cloud Function `generateCertificate`:
        - [ ] Trigger: Manual "Release" button or Event End time.
        - [ ] Logic: Loop through "checked-in" users -> Generate PDF -> Upload to Storage -> Email link.

### 4.4 Campus Infrastructure
- [ ] **Interactive Map:**
    - [ ] Create `CampusMap` component (SVG or Leaflet).
    - [ ] Map Event Locations to Map Coordinates.
    - [ ] "Get Directions" button on Event Details page.

---

## 🧪 Phase 5: Testing & Deployment

### 5.1 Quality Assurance
- [ ] **Unit Tests:** Write tests for Registration Transaction logic.
- [ ] **E2E Tests:** Use Playwright/Cypress for the "Signup -> Register -> Check-in" flow.
- [ ] **Performance:** Run Lighthouse audit on Landing Page.

### 5.2 Launch Prep
- [ ] **SEO:** Configure Metadata (OpenGraph images, Title tags) for all dynamic event pages.
- [ ] **Security Rules:** Finalize Firestore Security Rules (lock down writes).
- [ ] **Deployment:** Deploy `next.config.ts` changes and Firebase Functions.
