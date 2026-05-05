# Eventra - Comprehensive Gap Analysis & Remediation Plan

## 1. Executive Summary
Following a deep-dive architectural scan, it is clear that Eventra is in a "functional but compromised" state. The removal of authentication and payments stabilized the build but introduced severe security vulnerabilities at the server-action level and left behind substantial technical debt.

## 2. Critical Bugs & Security Issues
- **Broken Server Authorization (Critical Security Hole):** The `validateRole` and `validateEventOwnership` functions in `src/lib/auth-utils.ts` are completely stubbed out. They return the user object but perform *zero* role checking. Any user can theoretically hit admin or organizer server actions.
- **Auth System Gutted:** NextAuth is gone. The app is hardcoded to a `guest-user` identity. Frontend checks for `user.role === 'admin'` fail silently because the guest is an 'attendee', locking out intended UI flows.
- **Stubbed Feature Data:** Critical admin features (e.g., `src/features/admin/admin-dashboard.tsx`) use hardcoded empty arrays (`const allUsersRaw: any[] = [];`) instead of fetching real data.
- **Payments Removed:** Stripe was purged; the app now operates as a free-only platform. 

## 3. Technical Debt & UI Gaps
- **The `id` vs `_id` Crisis:** There is a pervasive schema mismatch where Drizzle strictly uses `id`, but frontend components and types (e.g., `src/types/index.ts`) expect `_id` (likely a relic of a Convex/MongoDB migration). This forces dangerous `u._id || u.id` fallbacks.
- **Improper Error Handling:** Over 240 instances of `console.error` and `throw new Error` exist across the codebase instead of utilizing proper error boundaries or standard API `{ success: false, error: string }` envelopes.
- **Missing Route Boundaries:** Many nested routes lack granular `loading.tsx` and `error.tsx` states.
- **Incomplete Internationalization (i18n):** `next-intl` is configured, but newer feature components render hardcoded English strings instead of using translation keys.

## 4. Phased Remediation Plan

### Phase 1: Security Patching & Tech Debt Cleanup
1. **Fix Server Authorization:** Immediately repair `src/lib/auth-utils.ts` to actually validate roles against the user's database record to secure server actions.
2. **Global ID Refactor:** Eliminate all `_id` references. Update `src/types/index.ts` and all frontend components to strictly use `id` as a string.
3. **Remove Stubs:** Replace hardcoded empty arrays in admin and networking modules with real data-fetching actions.

### Phase 2: Restoring Core Functionality
1. **Re-implement Authentication:** Re-install Auth.js (NextAuth v5). Configure OAuth correctly (fixing the original Google `redirect_uri` mismatch) and restore session management.
2. **Re-integrate Payments:** Re-add Stripe to enable paid ticketing tiers.
3. **Standardize Error Handling:** Convert raw `throw new Error` calls in server actions to return structured error envelopes. Replace `console.error` with a centralized logging utility.

### Phase 3: UI Polish & Launch Readiness
1. **Complete i18n:** Audit all UI components and replace hardcoded text with `t()` translation keys.
2. **Route Boundaries:** Add `loading.tsx` and `error.tsx` to all dynamic and nested routes.
3. **Automate Testing:** Formalize the existing `scripts/seed-smoke.cjs` into the `package.json` test scripts and integrate with CI/CD.
