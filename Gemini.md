# Eventra Project Status - March 29, 2026

## 1. Project Overview
**Eventra** is an event management and attendee engagement platform currently undergoing a major rework. 

## 2. Recent Actions
- Removed all **Convex** dependencies, configuration, and server-side logic.
- Removed all **Vercel** configuration and deployment metadata.
- Cleaned up **Firebase** legacy references.
- Removed **E2E tests** and **unit tests** that were tied to the previous stack.
- Reset **package.json** to a clean state with essential UI and AI (Genkit) dependencies.

## 3. Current Focus
- Identifying a new backend/database architecture.
- Cleaning up UI components from old backend hooks.
- Fixing all TypeScript issues and build errors.

## 4. Tech Stack (Simplified)
- **Framework:** Next.js 15 (App Router)
- **UI/UX:** Tailwind CSS, Radix UI, Lucide Icons, Framer Motion.
- **AI:** Genkit (Google AI) - *Base setup remains*.
- **State Management:** TanStack Query - *Remains for future data fetching*.
