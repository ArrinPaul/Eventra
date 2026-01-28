# EventOS Master Implementation Todo List

This document provides a granular, step-by-step checklist for building EventOS, merging features from the Eventra base and Eventtts competitive analysis.

**Last Updated:** January 29, 2026

---

## 🏗 Phase 1: Foundation & Authentication ✅ COMPLETE

### 1.1 Project Setup & Configuration ✅
- [x] Initialize Next.js 15 Environment
- [x] Configure `tailwind.config.ts` with custom brand colors
- [x] Install Shadcn UI base components
- [x] Firebase Integration (`lib/firebase.ts`)
- [x] Configure `firebase.json` for Hosting and Functions
- [x] State Management: AuthProvider + TanStack Query

### 1.2 Authentication & User Profiles ✅
- [x] **Login Interface (`/auth/login`):**
    - [x] Student/Organizer toggle UI
    - [x] Google OAuth provider logic
    - [x] Email/Password authentication
    - [x] Password reset flow link
- [x] **Role-Based Routing:**
    - [x] `middleware.ts` protecting routes by role
    - [x] Role hierarchy (admin > organizer > attendee)
    - [x] Redirect logic based on user role
- [x] **Onboarding Wizard (`/auth/onboarding`):**
    - [x] Step 1: Profile Details (Photo upload, Name, Bio)
    - [x] Step 2: Student Specifics (Department, Year, Interests)
    - [x] Step 2 (alt): Organizer Specifics (Org Name, Designation)
    - [x] Step 3: Confirmation & Profile Summary
    - [x] Write to Firestore with `onboardingCompleted: true`

---

## 🚀 Phase 2: Core Event Management 🔄 IN PROGRESS

### 2.1 Landing & Marketing Module (`/`)
- [ ] **Hero Section:**
    - [ ] Dynamic headline with value props
    - [ ] Dual CTA: "Create Event" (Organizer) vs "Explore Events" (Student)
- [ ] **Stats Ticker:**
    - [ ] Animated counters (Events Created, Success Rate, Active Users)
    - [ ] Firestore-backed real stats
- [ ] **Feature Showcase:**
    - [ ] Auto-scrolling carousel of features
    - [ ] "AI Analytics", "QR Ticketing", "Certificates" highlights
- [ ] **Live Preview Section:**
    - [ ] Dashboard/Feed mockup in device frame
- [ ] **Testimonials Grid:**
    - [ ] Masonry layout of user reviews

### 2.2 Organizer Dashboard (`/organizer`)
- [ ] **Dashboard Layout:**
    - [ ] Sidebar navigation (Overview, My Events, Analytics, Settings)
    - [ ] Top stats cards (Total Events, Attendees, Revenue)
    - [ ] "Create Event" floating action button
- [ ] **Event Management:**
    - [ ] Events list with status filters (Draft, Published, Completed)
    - [ ] Quick actions (Edit, Duplicate, Delete, View Analytics)

### 2.3 Event Creation Wizard (`/organizer/create`)
- [ ] **Step 1: Basic Info**
    - [ ] Title input
    - [ ] Rich text description editor
    - [ ] Banner image upload (drag & drop with crop)
    - [ ] Category selection
    - [ ] Tags input
- [ ] **Step 2: Logistics**
    - [ ] Date/Time picker (Start & End)
    - [ ] Location selection (Campus presets or custom)
    - [ ] Capacity limit input
    - [ ] Venue details
- [ ] **Step 3: AI Planner (Magic Button)** ✨
    - [ ] Prompt input: "Tech hackathon for 100 students"
    - [ ] Genkit integration for auto-generation
    - [ ] Auto-fill: Description, Agenda items, Checklist
    - [ ] Edit generated content before applying
- [ ] **Step 4: Ticketing**
    - [ ] Free/Paid toggle
    - [ ] Ticket tiers (Free, Early Bird, VIP)
    - [ ] Custom registration fields (T-shirt size, Dietary)
    - [ ] Waitlist option
- [ ] **Step 5: Preview & Publish**
    - [ ] Full event preview
    - [ ] Save as Draft / Publish options

### 2.4 Discovery & Explore Engine (`/explore`)
- [ ] **Search & Filters:**
    - [ ] Keyword search (Fuse.js/Algolia)
    - [ ] Category filter pills
    - [ ] Date range picker (Today, This Week, Weekend, Custom)
    - [ ] Location filter (Campus buildings)
- [ ] **Event Grid/List:**
    - [ ] Infinite scroll with React Query `useInfiniteQuery`
    - [ ] Toggle: Grid view / List view
- [ ] **Event Card Component:**
    - [ ] Banner thumbnail (16:9 aspect)
    - [ ] Title (2-line truncate)
    - [ ] Date & Time formatted ("Fri, Oct 24 • 10:00 AM")
    - [ ] Location with icon
    - [ ] "Interested" heart button (optimistic UI)
    - [ ] Attendees avatar stack preview
    - [ ] Quick register button
- [ ] **AI Recommendations:**
    - [ ] "For You" section based on interests
    - [ ] Score boost for interest/department match

### 2.5 Event Details Page (`/events/[id]`)
- [ ] **Hero Section:**
    - [ ] Full-width banner image
    - [ ] Event title, date, time, location
    - [ ] Organizer info with avatar
    - [ ] Share button (copy link, social)
- [ ] **Content Tabs:**
    - [ ] About (full description)
    - [ ] Agenda/Schedule
    - [ ] Speakers/Hosts
    - [ ] Location (map embed)
    - [ ] FAQ
- [ ] **Action Sidebar:**
    - [ ] "Register" / "Interested" buttons
    - [ ] Ticket type selection (if multiple)
    - [ ] Capacity counter ("12 spots left")
    - [ ] Price display
- [ ] **Social Proof:**
    - [ ] Attendees list preview
    - [ ] "Friends attending" highlight

### 2.6 Event Tracking & Wishlist (`/track`)
- [ ] **Tab: "Going" (Registered)**
    - [ ] List of confirmed registrations
    - [ ] Live status: "Starts in 2h", "Live Now" 🔴, "Ended"
    - [ ] Quick actions: View Ticket (QR), Get Directions
- [ ] **Tab: "Wishlist" (Interested)**
    - [ ] Saved events list
    - [ ] CTA: "Register Now" on each card
    - [ ] Remove from wishlist action
- [ ] **Tab: "Past Events"**
    - [ ] History of attended events
    - [ ] Actions: Download Certificate, Rate Event, View Photos

---

## 🎫 Phase 3: Ticketing & Check-in

### 3.1 Registration Flow
- [ ] **Server Action: `registerForEvent`**
    - [ ] Firestore transaction:
        - [ ] Check if `capacity > registeredCount`
        - [ ] Create document in `tickets` collection
        - [ ] Add user ID to `events/{id}/attendees`
        - [ ] Increment `registeredCount`
    - [ ] Generate unique ticket UUID
    - [ ] Send confirmation email

### 3.2 My Tickets (`/my-events` or `/tickets`)
- [ ] **Ticket Card:**
    - [ ] QR Code display (using `qrcode.react`)
    - [ ] Event details summary
    - [ ] "Add to Calendar" button
    - [ ] Ticket status badge
- [ ] **Download/Share:**
    - [ ] Save ticket as image/PDF
    - [ ] Share ticket link

### 3.3 Scanner App (`/check-in-scanner`)
- [ ] **Camera Integration:**
    - [ ] `html5-qrcode` library integration
    - [ ] Permission handling
- [ ] **Scan Flow:**
    - [ ] Scan QR → API validation
    - [ ] Success: Green screen + beep sound
    - [ ] Failure: Red screen + error message
    - [ ] Update `scannedAt` timestamp
- [ ] **Manual Search:**
    - [ ] Search by name/email fallback
    - [ ] Manual check-in button
- [ ] **Stats Dashboard:**
    - [ ] Real-time check-in counter
    - [ ] Check-in rate percentage

---

## 🤖 Phase 4: AI & Advanced Features

### 4.1 AI Event Planner (Genkit)
- [ ] **Setup:**
    - [ ] Genkit configuration with Gemini 1.5 Pro
    - [ ] Firebase Functions integration
- [ ] **"Magic Plan" Feature:**
    - [ ] Input: Event type + attendee count
    - [ ] Output JSON: `{ agenda: [], checklist: [], description: "" }`
    - [ ] Auto-fill form fields

### 4.2 AI Analytics & Insights
- [ ] **Data Aggregation:**
    - [ ] Scheduled Cloud Function for daily stats
    - [ ] Registration trends calculation
- [ ] **Visualizations:**
    - [ ] `RegistrationTrend`: Line chart (30 days)
    - [ ] `DepartmentPieChart`: Attendee breakdown
    - [ ] `CheckInGauge`: Real-time check-in rate
- [ ] **AI Insights Widget:**
    - [ ] Text analysis: "Your event is trending 20% higher..."
    - [ ] Actionable recommendations

### 4.3 AI Chatbot
- [ ] **Event Knowledge Bot:**
    - [ ] Answer questions about event agenda
    - [ ] Integration with event data context
- [ ] **Smart Recommendations:**
    - [ ] Suggest events based on preferences
    - [ ] Networking recommendations

### 4.4 Automated Certification
- [ ] **Trigger Logic:**
    - [ ] Event ends + User checked-in
    - [ ] Manual "Release Certificates" button
- [ ] **Generation Pipeline:**
    - [ ] HTML template with dynamic fields
    - [ ] PDF generation (Puppeteer or pdf-lib)
    - [ ] Upload to Firebase Storage
    - [ ] Email download link to user
- [ ] **Certificate Customization:**
    - [ ] Multiple templates
    - [ ] Organizer branding options

---

## 👥 Phase 5: Community & Networking

### 5.1 Community Hub (`/community`)
- [ ] Communities list with categories
- [ ] Community creation for organizers
- [ ] Posts/Discussions feed
- [ ] Member directory

### 5.2 Networking (`/networking`)
- [ ] User profile cards
- [ ] "Connect" request system
- [ ] Connection recommendations
- [ ] Messaging between connections

### 5.3 Matchmaking (`/matchmaking`)
- [ ] Interest-based matching algorithm
- [ ] "People you should meet" suggestions
- [ ] Meeting scheduler

### 5.4 Groups (`/groups`)
- [ ] Create/Join groups
- [ ] Group discussions
- [ ] Group events

---

## 🎮 Phase 6: Gamification & Engagement

### 6.1 Points System
- [ ] Points for actions (register, attend, connect)
- [ ] Points display on profile
- [ ] Transaction history

### 6.2 Leaderboard (`/leaderboard`)
- [ ] Rankings display
- [ ] Time filters (Weekly, Monthly, All-time)
- [ ] Department/Category filters

### 6.3 Badges & Achievements
- [ ] Badge definitions
- [ ] Auto-award logic
- [ ] Badge showcase on profile

### 6.4 Challenges
- [ ] Weekly/Event challenges
- [ ] Progress tracking
- [ ] Reward distribution

---

## 🗺 Phase 7: Campus Infrastructure

### 7.1 Interactive Campus Map (`/map`)
- [ ] **SVG/Leaflet Map Component:**
    - [ ] Clickable zones (Library, Halls, Labs)
    - [ ] Event pins with live events
- [ ] **Pathfinding:**
    - [ ] "Get Directions" from user location
    - [ ] Route highlighting
- [ ] **Integration:**
    - [ ] Link from event details page
    - [ ] Live event overlay

---

## 📊 Phase 8: Analytics & Reporting

### 8.1 Organizer Analytics (`/organizer/analytics`)
- [ ] Event performance dashboard
- [ ] Registration funnel analysis
- [ ] Demographic breakdowns
- [ ] Revenue tracking (for paid events)

### 8.2 Stakeholder View
- [ ] Public shareable link generation
- [ ] Read-only metrics view
- [ ] Anonymized demographics for sponsors

---

## 🔔 Phase 9: Notifications & Communication

### 9.1 In-App Notifications
- [ ] Notification bell with unread count
- [ ] Notification center/dropdown
- [ ] Mark as read functionality

### 9.2 Email Notifications
- [ ] Registration confirmation
- [ ] Event reminders (24h, 1h before)
- [ ] Certificate available
- [ ] Networking request received

### 9.3 Push Notifications (Optional)
- [ ] Web push setup
- [ ] Mobile push (if PWA)

---

## 🔧 Phase 10: Settings & Admin

### 10.1 User Preferences (`/preferences`)
- [ ] Profile editing
- [ ] Notification settings
- [ ] Privacy controls
- [ ] Theme selection

### 10.2 Admin Panel (`/admin`)
- [ ] User management
- [ ] Event moderation
- [ ] System settings
- [ ] Analytics overview

---

## 🧪 Phase 11: Testing & Deployment

### 11.1 Quality Assurance
- [ ] Unit tests for registration transaction
- [ ] E2E tests (Signup → Register → Check-in flow)
- [ ] Lighthouse performance audit

### 11.2 Security
- [ ] Finalize Firestore security rules
- [ ] API rate limiting
- [ ] Input validation

### 11.3 Launch Prep
- [ ] SEO metadata for all pages
- [ ] OpenGraph images
- [ ] Deploy to Vercel/Firebase Hosting
- [ ] Domain configuration

---

## 📋 Technical Debt & Cleanup

- [x] Remove unused files (enhanced-registration-form.tsx, eventos-registration-form.tsx, firebase.mock.ts)
- [x] Update branding from "IPX Hub" to "EventOS"
- [ ] Migrate auth from LocalStorage to Firebase `onAuthStateChanged`
- [ ] Fix ESLint configuration for CI
- [ ] Remove hardcoded mock states in Dashboard

---

## 🗂 API Routes Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET | Paginated events (query: category, date) |
| `/api/events/[id]` | GET | Single event details |
| `/api/events/register` | POST | Register for event (transaction) |
| `/api/ai/generate-plan` | POST | AI event planning (protected) |
| `/api/tickets/scan` | POST | Validate & burn QR token (admin) |
| `/api/users/[id]` | GET/PUT | User profile operations |
| `/api/analytics/[eventId]` | GET | Event analytics (organizer) |

---

## 📁 Files Removed (Cleanup)

- `src/components/auth/enhanced-registration-form.tsx` - Unused duplicate
- `src/components/auth/eventos-registration-form.tsx` - Unused duplicate  
- `src/lib/firebase.mock.ts` - Replaced by real Firebase config
