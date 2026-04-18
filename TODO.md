# Eventra TODO (Phase 2 Remediation Plan)

Last updated: 2026-04-18  
Source: AUDIT-REPORT-2026-04-18.md

This TODO replaces older status-only checklists with an execution-first plan aligned to current audit findings.

---

## P0 - Critical Flow Repairs

- [ ] Fix ticketing success fulfillment verification (do not trust query params alone; validate checkout session/webhook-backed fulfillment state).
- [x] Remove legacy /signup dead-path handling in middleware and keep auth-page redirect logic aligned with active routes only.
- [x] Decide and implement auth provider strategy (re-enable OAuth safely or remove related UI paths until ready).
- [ ] Add regression checks for ticket purchase -> success confirmation path.
- [ ] Add a negative regression check: success page must not show confirmed state when Stripe session/webhook verification fails.

## P1 - Data Model and API Consistency

- [ ] Standardize id vs _id handling across types, actions, and features.
- [ ] Add a temporary compatibility adapter layer where required to prevent breakage during normalization.
- [ ] Remove duplicated fallback logic once id normalization is complete.
- [ ] Reconcile and document schema table-count expectation (audit found 27 vs earlier 26 expectation).

## P1 - Replace TODO/No-Op Feature Mutations

### Admin
- [x] Replace TODO/no-op in admin user management.
- [x] Replace TODO/no-op in system settings.
- [x] Replace TODO/no-op in event moderation.
- [ ] Fix admin analytics component defect (Loader2 missing import + unreachable loading branch logic).

### Organizer
- [x] Wire announcement manager to real actions.
- [x] Wire webhook manager to real actions.
- [ ] Validate co-organizer manager data flow against normalized IDs.
- [ ] Wire revenue dashboard to real aggregates.

### Networking and Ticketing
- [x] Implement connection request/accept/decline/remove mutations.
- [x] Replace ticketing booking TODO path with real registration/payment mutation.

### Community, Feed, Events, Gamification
- [x] Replace community list/detail TODO placeholders with real data calls.
- [x] Replace feed post/comment TODO placeholders with real actions.
- [x] Wire event discussion and polls fully.
- [ ] Replace event reactions no-op mutation with real action wiring.
- [x] Wire gamification challenge join/progress paths.

## P2 - Route UX Hardening

- [ ] Add loading.tsx and/or error.tsx coverage for high-traffic app routes lacking both.
- [ ] Review nested segment directories that currently have no page/layout/loading/error files and document intent (route container vs missing implementation).
- [ ] Add coverage for newly identified organizer/certificates subroutes lacking both loading.tsx and error.tsx.
- [ ] Verify not-found and global-error behavior for key user journeys.
- [ ] Link each route UX task to the explicit audited route list in AUDIT-REPORT-2026-04-18.md section 5.

## P2 - i18n Practical Coverage

- [ ] Replace hardcoded strings in major feature screens with translation keys.
- [ ] Add a lint/check script for untranslated UI literals in src/features and src/app.
- [ ] Validate EN/ES rendering in auth, ticketing, organizer, admin, and events flows.

## P2 - Error Handling and Observability

- [ ] Reduce console-only error paths by mapping server errors to user-facing toasts/messages.
- [ ] Standardize action error envelopes (success/error/message/data shape).
- [ ] Ensure critical flows emit structured server logs for support/debugging.

## P2 - Dead Code and Import Hygiene

- [ ] Run targeted lint/type diagnostics to surface orphaned imports and dead symbols in src/features and src/app.
- [ ] Remove orphaned imports and unreachable code paths found by diagnostics.
- [ ] Add a short "cleanup delta" section to progress.md after each cleanup batch.

## P3 - Configuration and Environment Safety

- [ ] Add startup env validation for required secrets and service keys.
- [ ] Document all required env vars and expected defaults in a single source.
- [ ] Verify staging parity for DB, Supabase, email, and payment integrations.
- [ ] Add explicit preflight checks for GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to avoid silent OAuth provider disablement.

## Verification Gates

- [x] npm run typecheck passes for touched modules.
- [x] npm run lint passes for touched modules.
- [ ] Add explicit smoke path: Stripe webhook fulfilled -> ticket created -> success page shows confirmed.
- [ ] Manual smoke test passes for: login/register, create event, register ticket, ticket success page, organizer tools, networking request flow.
- [ ] Update progress.md with objective completion state after each P0/P1 batch.
- [ ] Add requirements traceability check: each audit requirement must map to a completed TODO item or explicit defer note.

## Working Notes

- Current scan totals in src: TODO/FIXME=38, console.error=146, throw new Error=97.
- i18n key parity is currently clean (261 EN keys, 261 ES keys, no missing keys either side).
- Schema snapshot: 27 tables with 13 explicit relation blocks currently declared in src/lib/db/schema/index.ts.

