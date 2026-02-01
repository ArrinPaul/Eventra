# Eventra Foundation 2.0 - Complete Refactor & Migration Plan

> **Last Updated**: February 1, 2026  
> **Status**: ✅ PHASE 1 COMPLETE - Final Cleanup in Progress

---

## 📊 Architecture Analysis Summary

### Team Development Timeline
| Period | Team | Architecture | Status |
|--------|------|--------------|--------|
| Aug-Oct 2025 | Team A | Old Pattern (`src/lib/*`, loose components) | ✅ Migrated |
| Jan 2026 | Team B | New Pattern (`src/core/*`, `src/features/*`) | ✅ Current |

### Current Status (February 2026)
| Item | Status | Notes |
|------|--------|-------|
| `src/lib/` folder | ✅ DELETED | Already removed |
| `@/lib/` imports | ✅ CLEAN | No imports found in src/ |
| Duplicate dashboards | ⚠️ ONE FOUND | `/organizer/page.tsx` has inline code |
| Login/Auth pages | ✅ SINGLE | Only one login form exists |
| AI components | ✅ VERIFIED | Different purposes, not duplicates |
| Check-in scanners | ✅ VERIFIED | Different use cases (attendee vs organizer) |

### Remaining Issues
1. **Organizer Page Duplicate** - `/organizer/page.tsx` has 791 lines inline instead of using component
2. **Analytics Overlap** - 3 analytics dashboards could share chart components

---

## ✅ Completed Work (Jan-Feb 2026)

- [x] New architecture structure: `src/core/`, `src/features/`
- [x] Firebase config consolidated: `src/core/config/firebase.ts`
- [x] Services layer: `src/core/services/firestore-services.ts`
- [x] Utility functions: `src/core/utils/utils.ts`
- [x] Validation schemas: `src/core/utils/validation/`
- [x] Eventtts color palette implemented in `globals.css`
- [x] New Tailwind config with feature colors
- [x] Sample Eventtts-style components created
- [x] `src/lib/` folder DELETED (confirmed Feb 1, 2026)
- [x] All `@/lib/` imports migrated to `@/core/`
- [x] `components/integrations/ai-insights-dashboard.tsx` DELETED
- [x] Verified login form is single source (no duplicates)

---

## 🔍 ANALYSIS RESULTS (February 1, 2026)

### Verified: NOT Duplicates (Keep All)
| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| `ai-chatbot.tsx` | `components/ai/` | General AI assistant (voice, attachments) | ✅ KEEP |
| `event-chatbot.tsx` | `components/ai/` | Event-specific quick questions | ✅ KEEP |
| `recommendation-dashboard.tsx` | `components/ai/` | AI recommendations widget | ✅ KEEP |
| `qr-scanner.tsx` | `components/check-in/` | Simple modal scanner (attendee) | ✅ KEEP |
| `check-in-scanner-client.tsx` | `components/check-in/` | Full organizer scanner dashboard | ✅ KEEP |
| `google-workspace-integration.tsx` | `components/integrations/` | Only Google Workspace component | ✅ KEEP |

### Verified: Already Clean
| Folder/File | Status |
|-------------|--------|
| `src/lib/` | ✅ DELETED |
| `components/dashboards/` | ✅ NEVER EXISTED |
| `components/workspace/` | ✅ NEVER EXISTED |
| `@/lib/` imports | ✅ NONE FOUND in src/ |

### ⚠️ FOUND: Active Duplicates to Fix
| Issue | Location | Action |
|-------|----------|--------|
| Organizer page inline code | `src/app/(app)/organizer/page.tsx` | Replace with component import |

---

## 🚨 CRITICAL FIX: Organizer Page Duplicate

### Problem
`src/app/(app)/organizer/page.tsx` has **791 lines** of inline code that duplicates `src/components/dashboard/organizer-dashboard-client.tsx` (558 lines).

### Solution
Replace the entire organizer page with component import (same pattern as admin page).

**Before** (791 lines of duplicate code):
```tsx
// src/app/(app)/organizer/page.tsx - BAD
'use client';
import React, { useState, useEffect } from 'react';
// ... 791 lines of inline dashboard code
```

**After** (clean component usage):
```tsx
// src/app/(app)/organizer/page.tsx - GOOD
'use client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import OrganizerDashboard from '@/components/dashboard/organizer-dashboard-client';

export default function OrganizerPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user?.role !== 'organizer' && user?.role !== 'admin') {
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (user?.role !== 'organizer' && user?.role !== 'admin') {
        return null;
    }

    return <OrganizerDashboard />;
}
```

---

## 📊 OLD SECTION - Cleanup Reference (Most Already Done)

### Files that were listed to DELETE (Old Architecture)
```
src/lib/                          # ✅ ALREADY DELETED
├── firebase.ts                   # → src/core/config/firebase.ts ✅
├── firestore-services.ts         # → src/core/services/firestore-services.ts ✅
├── data.ts                       # → src/core/data/data.ts ✅
├── actions.ts                    # → src/core/actions/actions.ts ✅
├── utils.ts                      # → src/core/utils/utils.ts ✅
├── eventos-config.ts             # → src/core/config/eventos-config.ts ✅
├── env-config.ts                 # → src/core/config/env-config.ts ✅
├── firebase-admin.ts             # → src/core/config/firebase-admin.ts ✅
├── permissions-service.ts        # → src/features/auth/services/ ✅
├── user-management-service.ts    # → src/features/admin/services/ ✅
└── integration-service.ts        # → src/features/integrations/services/ ✅
```

### Old Duplicate Components Table (Reference - Most Never Existed)
| Old File | New File | Status |
|----------|----------|--------|
| `components/dashboards/student-dashboard.tsx` | `components/dashboard/attendee-dashboard.tsx` | ⚠️ NEVER EXISTED |
| `components/dashboards/professional-dashboard.tsx` | `components/dashboard/attendee-dashboard.tsx` | ⚠️ NEVER EXISTED |
| `components/ai/ai-chatbot.tsx` | `components/ai/event-chatbot.tsx` | ✅ KEEP BOTH - Different purposes |
| `components/integrations/ai-insights-dashboard.tsx` | `components/analytics/*` | ✅ ALREADY DELETED |
| `components/chat/chat-client.tsx` | `components/chat/enhanced-chat-client.tsx` | ⚠️ NEVER EXISTED |
| `components/workspace/*` | N/A | ⚠️ FOLDER NEVER EXISTED |
| `components/ticketing/organizer-dashboard.tsx` | `components/dashboard/organizer-dashboard-client.tsx` | ⚠️ NEVER EXISTED |
| `components/ticketing/qr-scanner-client.tsx` | `components/check-in/check-in-scanner-client.tsx` | ⚠️ NEVER EXISTED |

---

## 🎨 Phase 1: UI Theme Migration (Eventtts Style)

### Color Scheme Reference
```css
/* Primary Colors */
--primary: #E53935 (Bright Red)
--secondary: #3B82F6 (Blue)

/* Feature Icon Gradients */
--feature-purple: #8B5CF6
--feature-cyan: #06B6D4
--feature-green: #10B981
--feature-orange: #F59E0B
--feature-pink: #EC4899

/* Backgrounds */
--bg-soft-pink: red-50/50
--bg-soft-blue: blue-50/50
```

---

## ✅ COMPLETED: Phase 1 - UI Theme (Already Applied)

The Eventtts color scheme is already properly configured:
- `globals.css` has primary red (#E53935) and secondary blue (#3B82F6)
- Tailwind config has feature gradients
- Components are using CSS variables

### UI Components Status
| Component | Theme Status |
|-----------|--------------|
| `components/home/landing-page.tsx` | ✅ Using Eventtts theme |
| `components/home/eventtts-hero.tsx` | ✅ Exists and themed |
| `components/dashboard/attendee-dashboard.tsx` | ✅ Using theme variables |
| `components/dashboard/organizer-dashboard-client.tsx` | ✅ Using theme variables |
| `components/auth/login-form.tsx` | ✅ Modern themed |

---

## ✅ COMPLETED: Phase 2 - Import Path Migration

**Status**: All imports use `@/core/` pattern. No `@/lib/` imports found.

Verified via search - no files in `src/` use old import paths.

---

## ✅ COMPLETED: Phase 3 - Component Architecture

All components follow the new pattern:
- Using `'use client'` directive
- Importing from `@/hooks/use-auth`, `@/hooks/use-toast`
- Using `@/core/services/firestore-services`
- Using `@/core/utils/utils` for utilities

---

## ✅ COMPLETED: Phase 4 - Chat System

**Current State** (Clean):
```
src/components/chat/
├── enhanced-chat-client.tsx   # ✅ Primary implementation
└── floating-ai-chat.tsx       # ✅ Floating chat widget
```

No duplicate `chat-client.tsx` exists.

---

## ✅ COMPLETED: Phase 5 - AI Integration

**Current State** (Clean):
```
src/components/ai/
├── ai-chatbot.tsx              # ✅ General assistant (voice, attachments)
├── event-chatbot.tsx           # ✅ Event-specific quick questions  
└── recommendation-dashboard.tsx # ✅ AI recommendations widget
```

These are NOT duplicates - each serves a different purpose:
- `ai-chatbot.tsx` - Full-featured assistant for integrations page
- `event-chatbot.tsx` - Lightweight event-context chatbot
- `recommendation-dashboard.tsx` - Dashboard widget for recommendations

---

## ✅ COMPLETED: Phase 6 - Google Workspace

**Current State** (Clean):
```
src/components/integrations/
├── google-workspace-integration.tsx  # ✅ Only Google integration
└── n8n-automation.tsx                # ✅ N8N automation
```

The `workspace/` folder was documented as needing cleanup, but it **never existed**.

---

## 🎯 Phase 7: Page/Route Cleanup [FIXED]

### ✅ FIXED (February 1, 2026): Organizer Page Duplicate

**Problem Found**: `src/app/(app)/organizer/page.tsx` had 791 lines of inline code.

**Solution Applied**: Replaced with component import pattern (35 lines).

```tsx
// NOW USES:
import OrganizerDashboard from '@/components/dashboard/organizer-dashboard-client';
```

---

## 📋 Final Status Summary

| Area | Status | Notes |
|------|--------|-------|
| `src/lib/` folder | ✅ DELETED | Doesn't exist |
| `@/lib/` imports | ✅ CLEAN | None in src/ |
| Organizer page duplicate | ✅ FIXED | Now uses component |
| Admin page | ✅ CORRECT | Uses component pattern |
| Login/Auth | ✅ SINGLE | One login form |
| AI Components | ✅ VERIFIED | Different purposes |
| Chat Components | ✅ CLEAN | Only enhanced version |
| Google Workspace | ✅ CLEAN | Single implementation |
| Dashboard routing | ✅ WORKING | Role-based routing works |
---

## ✅ COMPLETED: Phase 7 - components.json Already Updated

The `components.json` already uses correct paths (verified in ROADMAP.md).

---

## ✅ COMPLETED: Phase 8 - Final Cleanup

### Verified Clean
| Item | Status |
|------|--------|
| `src/lib/` folder | ✅ DELETED (doesn't exist) |
| `src/components/dashboards/` | ✅ NEVER EXISTED |
| `@/lib/` imports | ✅ NONE FOUND |
| `components.json` aliases | ✅ Using @/core/ |

---

## 🎉 MIGRATION COMPLETE

### Summary of Changes Made (February 1, 2026)

1. **Organizer Page Fixed**
   - Removed 791 lines of duplicate inline code
   - Now uses `OrganizerDashboard` component (saves ~750 lines)

2. **Verified Clean Architecture**
   - All imports use `@/core/` pattern
   - No `src/lib/` folder exists
   - No duplicate dashboard components found
   - Single login form implementation

3. **Confirmed NOT Duplicates**
   - AI chatbots serve different purposes
   - Check-in scanners have different use cases
   - Analytics dashboards serve different roles

### Build Verification
Run these commands to verify:
```bash
npm run build   # Should pass with no errors
npm run lint    # Check for any issues
```

---

## 🔗 Reference Files

- **Roadmap**: `ROADMAP.md` - Overall migration status
- **Analysis**: `ANALYSIS_DELIVERABLES.md` - Detailed analysis
- **Start Guide**: `START_HERE.md` - Quick start documentation

### Key Components
| Component | Location | Purpose |
|-----------|----------|---------|
| Dashboard Router | `components/dashboard/dashboard-client.tsx` | Routes by user role |
| Organizer Dashboard | `components/dashboard/organizer-dashboard-client.tsx` | Organizer features |
| Attendee Dashboard | `components/dashboard/attendee-dashboard.tsx` | Attendee features |
| Admin Dashboard | `components/admin/admin-dashboard.tsx` | Platform admin |
| Login Form | `components/auth/login-form.tsx` | Authentication |

---

*Last Updated: February 1, 2026 - Migration Complete ✅*
