# Eventra Auth Session Model (Phase 1)

## Architecture Decision
- Stack: custom signed JWT session cookies (HS256) with Next.js Route Handlers.
- Rationale: keeps current app flow unblocked while replacing client-side mock auth with server-verified sessions.
- Source of truth: `auth-token` JWT cookie (signed, httpOnly, sameSite=lax).

## Session Payload
- `sub`: user id
- `name`: display name
- `email`: user email
- `role`: user role (`student|professional|organizer|admin|speaker|attendee|vendor`)
- `image`: optional avatar URL
- `onboardingCompleted`: optional onboarding status
- `iat`: issued-at (unix seconds)
- `exp`: expiry (unix seconds)
- `iss`: issuer (`eventra`)

## Token Policy
- Algorithm: HMAC SHA-256 (`HS256`)
- Lifetime: 7 days
- Secret priority: `JWT_SECRET` -> `AUTH_SECRET`
- Development fallback: local dev-only fallback secret (disabled in production)

## Cookie Strategy
- Cookie: `auth-token`
- Attributes: `httpOnly`, `sameSite=lax`, `secure` in production, `path=/`, `maxAge=7d`
- Legacy compatibility cookies: `user-role`, `user-id` are still set during transition.
- Middleware authorization source: token payload role (cookie-only role is fallback for legacy sessions only).

## Endpoints
- `POST /api/auth/signin`:
  - Creates session user and issues signed cookies.
- `GET /api/auth/session`:
  - Validates token and returns `{ authenticated, user }`.
- `DELETE /api/auth/session`:
  - Clears auth cookies and logs user out.

## Current Scope
- Implemented: login session creation, session retrieval, logout, middleware role checks from signed token.
- Pending for full Phase 1 completion: provider OAuth integration, server-side authorization guards for all write mutations/actions, refresh/rotation policy hardening.
