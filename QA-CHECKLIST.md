# Eventra Comprehensive QA Checklist

Date: 2026-04-17
Mode: Browser-driven exploratory + route verification
Scope: Entire user-facing application (public, auth, protected, organizer, admin, event workflows)

## 1. Environment and Boot
- [ ] App starts on localhost without runtime crash
- [ ] Landing page renders without hydration/runtime errors
- [ ] Global header links are visible and clickable
- [ ] Theme toggle controls function
- [ ] Notification/chat quick-action buttons in header behave correctly

## 2. Public and Auth Entry
- [ ] / (guest) renders landing page sections
- [ ] Hero CTAs navigate correctly
- [ ] /login renders and sign-in controls behave correctly
- [ ] /register renders full register wizard
- [ ] Register wizard: all steps can proceed/back
- [ ] Register wizard: validation errors are accurate and recoverable
- [ ] Auth route guards redirect guests from protected routes to /login

## 3. Navigation and Layout Integrity
- [ ] Header nav links (Home, Explore, Sign In, Sign Up) work
- [ ] Mobile menu opens/closes and links work
- [ ] Footer links (if present) are valid
- [ ] No broken internal links in primary navigation
- [ ] Loading and error boundaries render friendly fallback UI

## 4. Core Event Discovery and Participation
- [ ] /explore loads discover feed
- [ ] /events list renders cards and filters
- [ ] /events/[id] opens event details
- [ ] Event details CTA buttons (register/share/wishlist/etc.) respond
- [ ] /my-events renders registered/past/wishlist sections
- [ ] /calendar renders month grid and day selection
- [ ] /agenda renders schedule and controls
- [ ] /search renders query UI and result states
- [ ] /map renders interactive campus map and controls

## 5. Community and Networking
- [ ] /community loads community list
- [ ] /community/[id] opens community detail
- [ ] /networking loads matchmaking/network area
- [ ] /matchmaking loads matching UI and actions
- [ ] /feed loads social activity feed
- [ ] /chat loads chat module and message input
- [ ] /profile/[id] renders profile data and controls

## 6. Tickets, Check-In, and Certificates
- [ ] /ticketing renders purchase/tiers flow
- [ ] /ticketing/success handles query params and completion states
- [ ] /tickets shows user tickets list and actions
- [ ] /check-in renders QR/check-in module
- [ ] /check-in-scanner opens scanner UI and fallback states
- [ ] /certificates user certificate area loads

## 7. Preferences, Notifications, and Personalization
- [ ] /preferences renders and saves settings
- [ ] /notifications center renders list and actions
- [ ] /ai-recommendations renders recommendation dashboard
- [ ] /leaderboard renders ranking cards
- [ ] /gamification renders points/badges/progress

## 8. Organizer Workspace
- [ ] /organizer access control works by role
- [ ] Organizer dashboard widgets load
- [ ] /organizer/analytics charts render
- [ ] /organizer/certificates list/builder/distribution flow works
- [ ] /organizer/feedback list and builder flow works
- [ ] /organizer/ai-insights event selection and insights render
- [ ] /organizer/media/[eventId] moderation UI renders
- [ ] /events/[id]/edit management page works end-to-end
- [ ] /events/[id]/feedback submission flow works
- [ ] /events/[id]/claim-spot waitlist claim flow works

## 9. Admin and Governance
- [ ] /admin role guard and dashboard behavior
- [ ] Admin management tables/actions function
- [ ] Admin error states are handled gracefully

## 10. Export, Analytics, and Reporting
- [ ] /analytics loads dashboard panels
- [ ] /export loads export functionality and controls
- [ ] Export actions produce valid output/download behavior

## 11. API and Error Handling UX (User-visible)
- [ ] All tested pages avoid unhandled exceptions in UI
- [ ] Empty states are meaningful
- [ ] Retry paths exist after recoverable errors
- [ ] Toasts/alerts use clear actionable messages

## 12. Accessibility and UX Quality
- [ ] Keyboard tab navigation across key pages
- [ ] Focus states visible on interactive controls
- [ ] Buttons/links have clear labels and states
- [ ] Disabled states are understandable
- [ ] Color contrast acceptable on critical text/actions

## 13. Responsive and Device Checks
- [ ] Desktop layout (>=1280) stable
- [ ] Tablet layout (~768-1024) stable
- [ ] Mobile layout (<768) usable and unclipped

## 14. Performance Smoke
- [ ] First-load of landing/login/register acceptable
- [ ] Heavy pages (analytics/map/chat) render within acceptable time
- [ ] No obvious browser freeze on navigation

## 15. Security and Data Integrity Smoke
- [ ] Protected routes reject unauthenticated access
- [ ] Role restricted pages block unauthorized users
- [ ] Sensitive actions require valid context/session

---

## Execution Status Legend
- NOT RUN
- PASS
- FAIL
- BLOCKED

Current status: Checklist created, execution in progress.
