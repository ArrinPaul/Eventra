# EventOS Project Roadmap

## Project Overview
**EventOS** (formerly Eventra/CIS-SAP) is an intelligent, multi-tenant SaaS event management platform. Built with **Next.js 15**, **Firebase**, and **Genkit AI**, it aims to provide a comprehensive solution for managing events, from ticketing and agendas to networking and AI-driven insights.

## Current Status
The project is in an **Advanced Prototype / Alpha** stage. Core architectural components (Auth, Firebase setup, Routing) are in place, and many UI shells exist. However, several key interactive features rely on mock data or are marked as "Coming Soon".

### ✅ Implemented Features
*   **Authentication & User Management**
    *   Multi-role support (Student, Professional, Organizer, etc.)
    *   Login and Registration flows (including enhanced registration with profile details)
    *   User Dashboards (Student, Professional, Admin)
*   **Event Management**
    *   Event Creation & Editing (`enhanced-event-management.tsx`)
    *   Agenda & Session Management
    *   Ticketing UI
*   **Core Functionality**
    *   QR Code Scanning for Check-in
    *   Basic Search Interface
    *   Admin Dashboard UI
*   **AI Foundation**
    *   AI Chatbot UI (Consolidated)
    *   Genkit configuration (`src/ai/genkit.ts`)
    *   Recommendation Engine UI

### 🚧 In Progress / Partial Implementation
*   **Social & Community**
    *   **Feed:** `feed-client.tsx` exists but contains significant placeholder content and "Coming Soon" badges.
    *   **Networking:** UI exists but relies on mock data matching.
    *   **Groups:** UI structure is present.
*   **Integrations**
    *   **Google Workspace:** `google-workspace-integration.tsx` is present but marked as "Coming Soon" in the UI.
    *   **Automation (n8n):** Component exists (`n8n-automation.tsx`) but needs backend verification.
    *   **Payments:** Stripe/Razorpay are configured in `eventos-config.ts` but full payment flow integration needs verification.

### ❌ Known Issues & Technical Debt
1.  **Missing Dependencies:** `node_modules` are not installed. `npm install` is required.
2.  **Placeholder Content:** Significant portions of the "Feed", "Networking", and "Integrations" pages use static placeholder text/images.
3.  **Mock vs. Real Data:** While the Firebase configuration has been standardized, many components still rely on local state or mock data arrays instead of fetching from Firestore.
4.  **Linting & Type Safety:** The codebase has not been verified with `npm run lint` due to missing dependencies.
5.  **Legacy Branding:** Deep-level integration documentation or variable names may still reference "CIS-SAP".

---

## Roadmap

### Phase 1: Stabilization & Setup (Immediate)
- [ ] **Dependency Installation:** Run `npm install` to ensure the environment is ready.
- [ ] **Linting & Code Quality:** Run `npm run lint` and fix high-priority type errors and unused imports.
- [ ] **Firebase Verification:** Connect the application to a live Firebase project and verify that `src/lib/firebase.ts` correctly initializes services.
- [ ] **Environment Configuration:** Ensure all `.env` variables (Firebase keys, Genkit keys) are documented and set up.

### Phase 2: Core Feature Completion (Short Term)
- [ ] **Data Layer Connection:** Refactor `Feed`, `Events`, and `Agenda` components to fetch real data from Firestore instead of using hardcoded mocks.
- [ ] **Feed Implementation:** Replace "Coming Soon" placeholders in the Feed with actual CRUD operations for posts (Create, Read, Update, Delete).
- [ ] **Networking Logic:** Implement the actual matching logic on the backend (or via Firebase Functions) to populate the Networking UI with real user matches.

### Phase 3: Advanced Integrations (Medium Term)
- [ ] **Google Workspace:** Finalize the OAuth flow and API connections for Google Docs/Sheets integration.
- [ ] **Payment Gateway:** Implement the actual Stripe/Razorpay checkout flows for ticketing.
- [ ] **AI Connection:** Ensure the AI Chatbot and Recommendation components are actually calling the Genkit endpoints (`src/ai/flows`) and not just simulating responses.

### Phase 4: Polish & Scale (Long Term)
- [ ] **Performance Optimization:** Analyze bundle size and optimize images/assets.
- [ ] **Testing:** Implement Unit Tests (Jest) and End-to-End Tests (Playwright/Cypress) for critical flows like Registration and Ticketing.
- [ ] **Multi-tenancy Verification:** rigorous testing of organization data isolation.

---

## Technical Stack
*   **Frontend:** Next.js 15 (App Router), Tailwind CSS, Lucide React, Radix UI
*   **Backend:** Firebase (Auth, Firestore, Functions, Storage)
*   **AI:** Google Genkit
*   **Language:** TypeScript
