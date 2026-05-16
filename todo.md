# Eventra - Master Execution Plan (TODO.md)

This document tracks the remaining work required to bring Eventra to a production-ready state.

---

## 🏗️ Phase 1: Security, Stability & Technical Debt
*Goal: Secure the platform, clean up legacy data models, and remove hardcoded stubs.*

### **1.1 Security Hardening (P0)**
- [x] **Repair `src/lib/auth-utils.ts`**: Re-implemented role checking against the database. (DONE)
- [x] **Secure Admin Actions**: Audited all admin actions to ensure validation is called. (DONE)

### **1.2 Global ID Refactor (P1)**
- [x] **Standardize Types**: Removed `_id` and standardized on `id: string`. (DONE)
- [x] **Refactor Component References**: Replaced `u._id || u.id` patterns. (DONE)
- [x] **Refactor Server Actions**: Drizzle queries standardized on `id`. (DONE)

### **1.3 Remove Hardcoded Data Stubs (P1)**
- [x] **Admin Dashboard**: Connected to `listAdminUsers` server action. (DONE)
- [x] **Networking Module**: Integrated with real matchmaking flow. (DONE)

---

## 🔐 Phase 2: Core Feature Restoration & Refinement
*Goal: Finalize core systems and refine existing functionality.*

### **2.1 Authentication Restoration (P0)**
- [x] **Integrate Clerk**: Successfully replaced the legacy NextAuth system with Clerk. (DONE)
- [x] **Clerk-Supabase Webhook**: Implemented user synchronization logic. (DONE)
- [x] **Enforce Middleware**: Middleware updated to handle Clerk sessions and route protection. (DONE)

### **2.2 Ticketing & Free-Only Model (P1)**
- [x] **Advanced Ticketing Logic**: Free and waitlist tiers are functional. (DONE)
- [x] **Remove Payment System**: All Stripe-related logic and tasks have been removed. (DONE)

### **2.3 Standardized Error Handling (P2)**
- [ ] **Server Action Envelopes**: Convert raw `throw new Error` calls to return structured `{ success, error }` objects.
- [ ] **Centralized Logger**: Create `src/lib/logger.ts` for unified error tracking.

---

## 🚀 Phase 3: UX Polish & Production Hardening
*Goal: Finalize i18n, optimize for mass traffic, and verify end-to-end resilience.*

### **3.1 Scalability & Performance (P1)**
- [x] **Database Connection Pooling**: Configured for Supabase Transaction Pooler (6543). (DONE)
- [x] **AI Response Caching**: Database-backed vector cache implemented. (DONE)
- [x] **Image Optimization**: Migrated to `next/image`. (DONE)

### **3.2 Production Resilience & Security (P1)**
- [x] **Rate Limiting**: Implemented for critical API routes and server actions. (DONE)
- [ ] **Manual UAT**: Execute the full checklist for Admin/Organizer/Attendee journeys.

### **3.3 Internationalization (i18n) Completion (P2)**
- [ ] **Module Audit**: Scan for remaining hardcoded English strings.
- [ ] **Dictionary Expansion**: Complete `messages/en.json` and `messages/es.json`.

---

## 🌐 Phase 4: Data Integration & Real-time
*Goal: Replace high-fidelity mockups with real application data.*

### **4.1 Real-time Features (P1)**
- [ ] **Supabase Realtime**: Implement live updates for notifications and chat.
- [ ] **Landing Page Data**: Connect hero sections and telemetry cards to real database metrics.

---

## 📈 Current Progress Tracker
- **Phase 1**: [x] 100%
- **Phase 2**: [x] 80% (Pending Error Standard)
- **Phase 3**: [ ] 50% (Pending i18n & UAT)
- **Phase 4**: [ ] 10%
- **Overall**: [ ] 65%
