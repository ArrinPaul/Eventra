# Eventra - Project Status (Latest)
*Date: May 5, 2026*

## Overview
Eventra is a Next.js 15 App Router project using Drizzle ORM and Supabase Postgres. 
It has recently undergone a "forced stabilization" where Auth and Payments were removed to achieve a clean build. 

**Current Assessment:** Functional but highly compromised. It operates as a public, guest-only platform with several stubbed server validation checks that represent significant security vulnerabilities.

## Core Architecture
- **Framework:** Next.js 15 (App Router), TypeScript 5.
- **Project Structure:** `eventra-webapp/src` follows a modular feature-first architecture (25 feature modules).
- **Database:** Supabase PostgreSQL + Drizzle ORM (25 tables).
- **UI System:** Tailwind CSS, Radix UI, Framer Motion.
- **Design System:** Slate/Navy surfaces + Violet (#7C3AED) accent, full light/dark mode support via semantic HSL tokens.
- **Auth:** Currently hardcoded to `guest-user` (NextAuth removed). **Warning:** Server-side RBAC validation is currently stubbed and insecure.
- **State:** React Query for client state, Server Actions for mutations.
- **i18n:** `next-intl` (English and Spanish supported).

## Getting Started (Development)
1. **Directory:** `cd eventra-webapp`
2. **Install:** `npm install`
3. **Environment:** Copy `.env.example` to `.env`.
4. **Dev Server:** `npm run dev` (runs on http://localhost:9002)

## Essential Scripts
| Command | Purpose |
| :--- | :--- |
| `npm run build` | Create optimized production build. |
| `npm run db:push` | Apply schema changes to the target database. |
| `npm run env:check`| Validate environment variables. |
| `npm run test:smoke`| Seed and validate critical smoke-flow chains. |

## Design Tokens Reference
| Token | Light | Dark |
| :--- | :--- | :--- |
| background | hsl(220 30% 98%) | hsl(222 47% 6%) |
| foreground | hsl(222 47% 11%) | hsl(210 40% 98%) |
| card | hsl(0 0% 100%) | hsl(222 40% 9%) |
| primary | hsl(262 83% 58%) | hsl(262 83% 66%) |
| success | hsl(160 84% 39%) | hsl(160 75% 48%) |
| destructive | hsl(0 72% 51%) | hsl(0 72% 58%) |

## Recent UI Redesign Accomplishments (Apr 2026)
- **Global Design System:** Rebuilt `globals.css` with semantic tokens.
- **Shell Redesign:** Sticky blurred header, collapsible organizer sidebar, and polished layouts.
- **Landing Page:** Complete redesign with aurora hero, featured events grid, and metrics strip.
- **Component Sweep:** Standardized 99+ files to use semantic tokens (`bg-background`, `text-muted-foreground`, etc.).

## System Health
- **Build:** SUCCESS (Exit code 0)
- **Schema:** 100% migrated and stable.
- **Tech Debt:** High (pervasive `id` vs `_id` mismatches, missing error boundaries, hardcoded UI stubs).

## Documentation History
This document supersedes and consolidates the following legacy documents (which have been deleted):
- `AUDIT-REPORT-2026-04-18.md`
- `CORRECTIONS-2026-04-18.md`
- `PHASE-1-COMPLETION-REPORT.md`
- `REMEDIATION-ROADMAP.md`
- `QA-CHECKLIST.md`
- `QA-ERRORS.md`
- `TODO.md`
- `PRD.md`
- `README.md`


