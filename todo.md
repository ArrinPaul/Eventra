# Eventra - Master Execution Plan (TODO.md)

This document tracks the remaining work required to bring Eventra to a production-ready state. It is based on the deep-dive gap analysis performed on May 5, 2026.

---

## 🏗️ Phase 1: Security, Stability & Technical Debt
*Goal: Secure the platform, clean up legacy data models, and remove hardcoded stubs.*

### **1.1 Security Hardening (P0)**
- [x] **Repair `src/lib/auth-utils.ts`**: Currently, `validateRole` and `validateEventOwnership` are non-functional stubs.
  - *Task*: Re-implement role checking against the database. (DONE)
  - *Task*: Ensure `validateRole(['admin'])` actually blocks non-admins from sensitive server actions. (VERIFIED)
- [x] **Secure Admin Actions**: Audit all files in `src/app/actions/admin.ts` to ensure the repaired validation functions are called. (DONE)

### **1.2 Global ID Refactor (P1)**
- [ ] **Standardize Types**: Update `src/types/index.ts` to remove `_id` and strictly use `id: string`.
- [ ] **Refactor Component References**: Scan and replace all `u._id || u.id` patterns with `u.id`.
  - *Targets*: `src/features/admin/*`, `src/features/events/*`, `src/features/community/*`.
- [ ] **Refactor Server Actions**: Ensure all Drizzle queries and mutations use the `id` field exclusively.

### **1.3 Remove Hardcoded Data Stubs (P1)**
- [ ] **Admin Dashboard**: Replace `const allUsersRaw: any[] = [];` in `src/features/admin/admin-dashboard.tsx` with a call to the `listAdminUsers` server action.
- [ ] **Networking Module**: Verify that networking suggestions are hitting the `matchmakingFlow` instead of returning static placeholders.

---

## 🔐 Phase 2: Core Feature Restoration
*Goal: Re-integrate the vital systems that were removed during "stabilization."*

### **2.1 Authentication Restoration (P0)**
- [ ] **Re-install Auth.js (v5)**: Restore the `@auth/core` and `next-auth` dependencies.
- [ ] **Fix Google OAuth**: Correct the `redirect_uri` mismatch in the Google Cloud Console and update `.env.local`.
- [ ] **Restore Middleware**: Update `src/middleware.ts` to enforce route protection for `/admin` and `/organizer`.
- [ ] **Session Management**: Switch from the `guest-user` model back to real session-based identities in `src/auth.ts`.

### **2.2 Payment & Ticketing Re-integration (P1)**
- [ ] **Re-integrate Stripe**: Restore Stripe SDK and webhook handlers.
- [ ] **Paid Tier Logic**: Update `src/app/actions/tickets.ts` to handle Stripe checkout sessions for non-zero price tiers.
- [ ] **Payment Status Tracking**: Ensure ticket status updates to 'confirmed' only after successful payment webhook.

### **2.3 Standardized Error Handling (P2)**
- [ ] **Server Action Envelopes**: Convert all raw `throw new Error` calls in `src/app/actions/*` to return `{ success: false, error: "Friendly message" }`.
- [ ] **Centralized Logger**: Create `src/lib/logger.ts` and replace `console.error` calls with structured logging.

---

## 🚀 Phase 3: UX Polish & Production Hardening
*Goal: Finalize i18n, optimize for mass traffic, and verify end-to-end resilience.*

### **3.1 Scalability & Performance (P1)**
- [ ] **Database Connection Pooling**:
  - *Task*: Configure Drizzle to use the Supabase `transaction` mode port (6543) with PgBouncer to prevent "Too many connections" errors during mass traffic.
- [ ] **AI Response Caching (Vector Cache)**:
  - *Task*: Implement a database-backed cache for `ai-recommendations.ts` so common queries don't hit Gemini API rate limits.
- [ ] **Image Optimization**: Audit all `<img>` tags and replace them with `next/image` to reduce bandwidth during high crowds.

### **3.2 Production Resilience & Security (P1)**
- [ ] **Rate Limiting**:
  - *Task*: Implement `upstash/ratelimit` or a similar middleware to prevent API abuse and "crowd-spamming" of server actions.
- [ ] **Environment Parity**: Complete the "Staging Parity" check mentioned in PROJECT-STATUS.md for DB, Supabase, and email integrations.

### **3.3 Internationalization (i18n) Completion (P2)**
- [ ] **Module Audit**: Scan for hardcoded English strings in `src/features/`.
- [ ] **Dictionary Expansion**: Add missing keys to `messages/en.json` and `messages/es.json`.
- [ ] **Component Integration**: Wrap literals in `t('key')` calls.

### **3.4 Final Validation (P0)**
- [ ] **Load Test Simulation**: Run a script to simulate 100+ concurrent registrations to verify connection pooling works.
- [ ] **Smoke Test Integration**: Update `package.json` with `npm run test:smoke` using `scripts/seed-smoke.cjs`.
- [ ] **Manual UAT**: Execute the full checklist in `PROJECT-STATUS.md` (Admin/Organizer/Attendee journeys).
- [ ] **CI/CD Pipeline**: Add a basic GitHub Action to run `lint`, `typecheck`, and `build` on every PR.

---


## 📈 Current Progress Tracker
- **Phase 1**: [ ] 20%
- **Phase 2**: [ ] 0%
- **Phase 3**: [ ] 0%
- **Overall**: [ ] 6%
