# Eventra — PRD & Progress Ledger

## Original problem statement (summarized)
Full-stack Eventra platform (Next.js 15, TS5, Drizzle, Auth.js, Stripe, Twilio, Resend,
Genkit, next-intl). User request in this session:

> "complete UI and frontend redesign"
> "mock/stub integration keys for now and focus on UI + type correctness"
> "don't start from scratch — edit the existing GitHub code"

## Architecture
- `eventra-webapp/` — Next.js App Router app (TS strict)
- `src/app` — routes, layouts, api, actions
- `src/features/*` — 25 feature modules
- `src/components/ui` — design primitives (Radix + cva)
- `src/components/layout` — shell (header, sidebar)
- `src/lib/db` — Drizzle schema, postgres client
- `src/auth.ts` + `src/middleware.ts` — Auth.js v5 + RBAC middleware

## What was done in this session (UI redesign — Apr 17, 2026)
- Rebuilt **design system** in `globals.css`: slate/navy surfaces + violet (#7C3AED)
  accent, full **light & dark mode** with semantic HSL tokens
  (`background`, `card`, `primary`, `muted`, `success`, etc.).
- Rewrote `tailwind.config.ts`: new font stack (Inter + Space Grotesk + JetBrains Mono),
  semantic colors, animation keyframes, container padding scale.
- Swapped default fonts to **Inter (body) + Space Grotesk (display) + JetBrains Mono**
  via `next/font`.
- `providers.tsx` now uses `next-themes` with `defaultTheme="dark"` + `enableSystem`
  + `disableTransitionOnChange`.
- **UI primitives** rebuilt with class-variance-authority:
  - `Button` — 10 variants (default, outline, ghost, link, destructive, gradient,
    glow, soft, subtle, secondary), 6 sizes, polished focus rings.
  - `Card` — 5 variants (default, glass, elevated, gradient, outline), uses semantic
    tokens for full light/dark parity.
  - `Badge` — 18 variants including semantic aliases (success/warning/info) and
    legacy color names (red/blue/cyan) mapped to tokens.
  - `Input` — clean single-border, ring-on-focus, works in both themes.
  - `Skeleton` — new shimmer loader.
  - `EmptyState` — redesigned with primary-tinted icon chip, test-ids.
- **Shell redesigned**:
  - `Header` — sticky, transparent→blurred on scroll, logo with gradient icon,
    centered nav pills, search button, theme toggle, notification bell, avatar
    dropdown, full mobile drawer via framer-motion AnimatePresence.
  - `OrganizerSidebar` — grouped nav with labels, animated active indicator
    (violet accent bar), collapsible to 68px, help link in footer.
  - `(app)/layout.tsx` + `(auth)/layout.tsx` + loading/error — all rebuilt.
- **Landing page** completely redesigned (`features/home/landing-page.tsx`):
  hero with aurora + grid bg, pill CTAs, stats tri-panel, animated search with
  category filters, featured events grid with hero event, features grid (8 items),
  metrics strip, gradient CTA card, structured footer.
- **Attendee dashboard & Organizer dashboard** redesigned to use semantic tokens,
  KPI cards with trend badges, Tabs with Linear-style pill list, EmptyState
  consistency, Skeleton loaders during fetch.
- **Color sweep**: ran find+sed across ~160 TSX files, converted 99 files worth of
  hardcoded `bg-[#0a0b14]`, `bg-white/10`, `text-gray-400`, `cyan-500`, `#0f172a`
  etc. to semantic tokens (`bg-background`, `bg-muted`, `text-muted-foreground`,
  `text-primary`, `bg-card`). Now features inherit the new design automatically.
- `.env` seeded with stub values (per user instruction) so Next.js boots without
  real Supabase/Stripe/Twilio/Resend/Google credentials.

## Verification
- `npx tsc --noEmit` — **0 errors**.
- Routes tested: `/` 200, `/login` 200, `/register` 200, `/explore` 200,
  `/tickets` 200, `/check-in-scanner` 200, `/notifications` 200.
  `/events/create`, `/organizer`, `/admin` correctly 307-redirect when unauthenticated
  (RBAC intact).
- Screenshots captured for landing (hero, featured events, features section),
  auth (login), and **light-mode** variant — all render cleanly with full design
  consistency.
- Only runtime noise: Postgres `ECONNREFUSED` (expected — DB is stubbed).

## Data-testid coverage (new/updated)
`header-logo`, `app-header`, `theme-toggle`, `header-search-btn`,
`header-user-menu`, `header-signin`, `header-signup`, `mobile-menu-toggle`,
`nav-link-*`, `hero-cta-primary`, `hero-cta-secondary`, `hero-search-input`,
`hero-search-btn`, `landing-view-all`, `cta-register`, `cta-explore`,
`event-card`, `empty-state`, `empty-state-action`, `attendee-dashboard`,
`organizer-dashboard`, `dashboard-create-event`, `dashboard-scanner`,
`organizer-search-input`, `event-row-*`, `sidebar-*`, `error-retry`, `menu-*`.

## What's NOT in scope for this session (backlog)
- Per-feature deep redesign for each of the 25 modules (they now inherit tokens
  but individual layouts could be polished further).
- Real Stripe/Twilio/Resend/Google OAuth/Supabase integration.
- Genkit/AI path rewiring.
- Translation key expansion (current `en.json` / `es.json` cover only
  `Common` + `Dashboard` + `Events`).
- Full `next lint` sweep of leftover unused imports.
- Offline check-in flow retest under the new UI.

## Next actions (prioritized)
**P0** — Wire real env vars + DB for organizer/admin flows; seed initial data; full
QA pass across authenticated routes.
**P1** — Finish redesign of the following feature surfaces with the new tokens so
they look first-class: ticketing detail, certificates builder, feedback NPS
dashboard, gamification leaderboard, chat, community feed, AI marketing copilot.
**P2** — Expand i18n keys to 100% coverage in both `en` and `es`; add remaining
feature-level `loading.tsx` + `error.tsx` boundaries; next lint to 0 warnings.

## Design tokens (reference)
| Token              | Light              | Dark               |
|--------------------|--------------------|--------------------|
| background         | hsl(220 30% 98%)   | hsl(222 47% 6%)    |
| foreground         | hsl(222 47% 11%)   | hsl(210 40% 98%)   |
| card               | hsl(0 0% 100%)     | hsl(222 40% 9%)    |
| muted              | hsl(220 14% 96%)   | hsl(222 28% 14%)   |
| border             | hsl(220 13% 90%)   | hsl(222 28% 18%)   |
| primary (violet)   | hsl(262 83% 58%)   | hsl(262 83% 66%)   |
| success            | hsl(160 84% 39%)   | hsl(160 75% 48%)   |
| warning            | hsl(38 92% 50%)    | hsl(38 92% 58%)    |
| info               | hsl(217 91% 60%)   | hsl(217 91% 65%)   |
| destructive        | hsl(0 72% 51%)     | hsl(0 72% 58%)     |

Dev command: `cd eventra-webapp && yarn dev` (port 9002).
