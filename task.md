# Eventra Recovery and Deployment Task Plan

Last updated: 2026-03-29
Owner: Engineering
Status: In progress

## Goal
Stabilize the codebase, replace migration leftovers, complete core product flows, and deploy safely with CI/CD and monitoring.

## Phase 0 - Stabilize the Base (Critical)

### 0.1 Local Build and Tooling Baseline
- [ ] Install dependencies and verify lockfile integrity.
- [ ] Pin Node.js runtime version and document it in project docs.
- [ ] Ensure these commands run successfully locally:
  - [ ] npm run lint
  - [ ] npm run typecheck
  - [ ] npm run build

### 0.2 Build Safety Controls
- [ ] Remove TypeScript build bypass in [next.config.ts](next.config.ts).
- [ ] Remove ESLint build bypass in [next.config.ts](next.config.ts).
- [ ] Treat type and lint failures as blocking for merges.

### 0.3 Broken Import and Path Drift Cleanup
- [ ] Fix route/page imports that reference missing component paths.
- [ ] Align all app route imports to actual module locations under src/features and src/components.
- [ ] Remove dead imports and unused files left by migration.

### 0.4 Compilation Integrity
- [ ] Resolve unresolved symbols and commented-out dependency remnants in feature modules.
- [ ] Ensure app compiles with zero TypeScript errors.

Definition of done:
- [ ] Clean local build with no type errors and no lint errors.

---

## Phase 1 - Real Authentication and Authorization

### 1.1 Auth Architecture Decision
- [ ] Finalize production auth stack (Auth.js/NextAuth or equivalent).
- [ ] Document session model, token policy, and cookie strategy.

### 1.2 Replace Mock Auth
- [ ] Remove mock behavior in [src/hooks/use-auth.ts](src/hooks/use-auth.ts).
- [ ] Implement real login/logout/session refresh.
- [ ] Implement role-aware user retrieval from backend.

### 1.3 Route and API Protection
- [ ] Replace fragile cookie-only role assumptions in [src/middleware.ts](src/middleware.ts).
- [ ] Enforce role checks server-side for admin/organizer actions.
- [ ] Add authorization guards for all write operations.

Definition of done:
- [ ] Login/logout/protected routes work with real sessions and enforced roles.

---

## Phase 2 - Data Layer and Core Product Flows

### 2.1 Finalize Data Layer
- [ ] Confirm backend persistence architecture and schema ownership.
- [ ] Create or restore missing server actions referenced by UI.
- [ ] Remove stale/legacy data placeholders from [src/core/data/data.ts](src/core/data/data.ts).

### 2.2 Events Core
- [ ] Wire events list/detail/create/edit/delete end-to-end with real persistence.
- [ ] Enforce server-side validation and permission checks on event mutations.

### 2.3 Ticketing Core
- [ ] Complete ticket purchase and registration flow.
- [ ] Complete cancel/refund/check-in flow with backend truth.
- [ ] Verify QR generation and scanner handling against real data.

### 2.4 Social and Engagement Core
- [ ] Complete chat room/message persistence.
- [ ] Complete notifications storage and delivery.
- [ ] Validate feed/community actions with membership/role checks.

Definition of done:
- [ ] All primary attendee and organizer journeys run without mock fallbacks.

---

## Phase 3 - Integrations and Config Hardening

### 3.1 Environment Variable Standardization
- [ ] Align environment names between [src/core/config/env-config.ts](src/core/config/env-config.ts) and [.env.example](.env.example).
- [ ] Add strict startup validation for required secrets by environment.

### 3.2 Email and External Services
- [ ] Repair and verify provider logic in [src/app/api/send-email/route.ts](src/app/api/send-email/route.ts).
- [ ] Add robust error handling, retries, and logging for email sends.

### 3.3 Payments and AI Controls
- [ ] Validate Stripe keys and webhook flow in staging.
- [ ] Gate AI features with clear feature flags and plan checks.
- [ ] Apply API rate limits and abuse controls on public endpoints.

Definition of done:
- [ ] Integrations pass staging smoke tests with observable logs.

---

## Phase 4 - Testing and CI/CD

### 4.1 Minimum Test Coverage
- [ ] Add unit tests for auth, permissions, events, and ticketing.
- [ ] Add integration tests for critical server actions.
- [ ] Add E2E smoke tests for:
  - [ ] Sign in
  - [ ] Create event
  - [ ] Register/purchase ticket
  - [ ] Check-in

### 4.2 CI Pipelines
- [ ] Create GitHub Actions workflows in .github/workflows for:
  - [ ] Install + cache
  - [ ] Lint
  - [ ] Typecheck
  - [ ] Test
  - [ ] Build
- [ ] Block merges unless required checks pass.

Definition of done:
- [ ] Every PR is validated automatically before merge.

---

## Phase 5 - Deployment and Production Readiness

### 5.1 Environments and Secrets
- [ ] Set up staging and production environments.
- [ ] Configure all required secrets for each environment.
- [ ] Verify public URLs and callback URLs for auth providers.

### 5.2 Release Safety
- [ ] Add migration and rollback procedure.
- [ ] Add release checklist and ownership for deploy approval.
- [ ] Run post-deploy smoke tests.

### 5.3 Monitoring and Operations
- [ ] Add error tracking and alerting.
- [ ] Add uptime and API health checks.
- [ ] Add incident response runbook.

Definition of done:
- [ ] Repeatable production deployment with rollback and monitoring.

---

## Cross-Cutting Cleanups
- [ ] Reconcile contradictory planning docs ([TODO.md](TODO.md) vs [progress.md](progress.md)).
- [ ] Keep one canonical source of truth for roadmap/status.
- [ ] Document architecture decisions and update onboarding instructions.

## Suggested Execution Order (Short)
1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5

## Final Exit Criteria
- [ ] No mock auth, no placeholder core flows.
- [ ] Lint, typecheck, test, and build all passing in CI.
- [ ] Staging validated with production-like data and secrets.
- [ ] Production deployment completed with monitoring and rollback path.
