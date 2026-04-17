# Eventra QA Error Log

Date: 2026-04-17
Environment: localhost (Next.js dev)
Testing mode: Browser-based exploratory checks

## Severity Guide
- Critical: Blocks core user flow or crashes app
- High: Core feature broken with no workaround
- Medium: Feature partially broken or major UX defect
- Low: Minor UX/copy/state issue

## Open Issues

### E-001
- Severity: High
- Area: Authentication / Google OAuth
- Route: /login -> Google sign-in
- Status: Mitigated for testing (OAuth temporarily disabled in app)
- Evidence: Google error 400 redirect_uri_mismatch
- Repro:
  1. Open /login
  2. Click Google sign-in
  3. Redirect to Google error page
- Expected: OAuth flow opens consent and returns to app callback
- Actual: Request blocked at Google with redirect_uri mismatch
- Temporary Mitigation: Google sign-in disabled in UI and provider list during project-wide testing
- Permanent Fix:
  1. Add exact callback URI(s) in Google Cloud OAuth client
  2. Re-enable provider and UI sign-in button

### E-002
- Severity: Medium
- Area: Auth entry UX
- Route: /login
- Status: Known by design (temporary)
- Evidence: Google sign-in button intentionally disabled with helper text
- Notes: Keep until OAuth config is corrected and regression-tested

---

## Resolved Issues
- None yet

---

## Blockers and Constraints
- OAuth disabled intentionally for broad non-auth testing.
- Protected role-based routes may be inaccessible without a seeded authenticated account.

---

## Testing Progress Notes
- Checklist and defect log initialized.
- Active execution ongoing; entries will be updated as defects are confirmed/fixed.
