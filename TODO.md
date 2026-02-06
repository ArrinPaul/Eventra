# Eventra Migration Plan (Firebase -> Convex + Vercel)

## Phase 1: Remove Firebase & Cleanup ✅
- [x] **Uninstall Firebase SDKs**: Removed `firebase`, `firebase-admin`.
- [x] **Delete Config**: Removed `src/core/config/firebase.ts`.
- [x] **Remove Legacy Services**: Deleted `src/core/services/firestore-services.ts`.
- [x] **Clean Imports**: All major components migrated to Convex hooks.

## Phase 2: Convex Database & Auth Implementation ✅
- [x] **Schema Finalization**: `convex/schema.ts` expanded with all tables.
- [x] **Auth Configuration**: `convex/auth.ts` verified for Google/OAuth.
- [x] **Backend Functions**: All CRUD operations implemented.

## Phase 3: Service Layer & Component Refactor ✅
- [x] **Create Convex Hooks**: Replaced direct service calls with `useQuery` and `useMutation`.
    - [x] `OrganizerDashboard`
    - [x] `useAuth` hook
    - [x] `EventsClient`
    - [x] `Ticketing` (My Tickets)
    - [x] `Agenda`
    - [x] `Check-in Scanner`
- [x] **Update Validation**: Fixed Zod schemas in `auth.ts`.
- [x] **Fix Types**: Core types updated to support Convex `_id` and timestamps.

## Phase 4: Storage (Convex Storage) ✅
- [x] **Setup Storage**: Use Convex's built-in file storage for efficiency.
- [x] **Replace Image Uploads**: `useStorage` hook implemented.

## Phase 5: Deployment & Verification 🚀
- [ ] **Environment Variables**: Setup `.env.local`.
- [ ] **Build Check**: Run `npm run build` and `npm run typecheck`.
- [ ] **Deploy**: Deploy to Vercel.
