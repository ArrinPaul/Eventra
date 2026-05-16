# Eventra - Project Status (Latest)
*Date: May 17, 2026*

## Overview
Eventra is a Next.js 15 App Router project using Drizzle ORM and Supabase Postgres. 
It has successfully transitioned to **Clerk Authentication** and operates as a **Free-Only Platform** following the removal of all payment processing systems.

**Current Assessment:** Production-Stable Core. The platform is secure, with functional role-based access control (RBAC) and a simplified model focused on free community events and registrations.

## Core Architecture
- **Framework:** Next.js 15 (App Router), TypeScript 5.
- **Project Structure:** Modular feature-first architecture (25 feature modules).
- **Database:** Supabase PostgreSQL + Drizzle ORM (25 tables).
- **Authentication:** **Clerk** (Integrated with Supabase via Webhooks).
- **Authorization:** Server-side RBAC validation in `auth-utils.ts` (Fully functional).
- **Ticketing:** Free registration and waitlist management (Paid ticketing removed).
- **UI System:** Tailwind CSS, Radix UI, Framer Motion.
- **State:** React Query (Client), Server Actions (Mutations).
- **i18n:** `next-intl` (English and Spanish supported).

## Essential Scripts
| Command | Purpose |
| :--- | :--- |
| `npm run build` | Create optimized production build. |
| `npm run db:push` | Apply schema changes to the target database. |
| `npm run env:check`| Validate environment variables. |
| `npm run test:smoke`| Seed and validate critical smoke-flow chains. |

## System Health
- **Build:** SUCCESS
- **Authentication:** SECURE (Clerk)
- **Authorization:** SECURE (RBAC verified)
- **Payments:** REMOVED (Project scope limited to free events)
- **Tech Debt:** Moderate (Ongoing i18n cleanup and error handling standardization).


