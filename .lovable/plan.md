

# Comprehensive Application Audit

## Issues Found

### 1. HELP BUTTON - Not Working Properly (HIGH)

**Problem:** The Help Button has multiple issues:

- **On mobile**, it sits at `bottom-36` (144px) and the FAB sits at `bottom-24` (96px). Both are on the right side (`right-4`). They are visually close but don't overlap. However, the Help Button's `z-40` is lower than the FAB's `z-50`, so the dropdown menu can get partially hidden behind the FAB.
- **The dropdown menu opens upward (`side="top"`)** which is correct, but on mobile, when both the FAB and Help Button are stacked, the dropdown can be clipped or covered by the bottom tab bar.
- **Tour functionality is fragile:** Many tour steps target `data-tour` attributes that may not be present on the page (e.g., `[data-tour="ops-tabs"]`, `[data-tour="ops-filters"]`). When the target isn't found, the tour silently skips to the next step, which can make it appear broken — the tour might skip 3-4 steps in a row and jump to "Done."
- **No tours for many pages:** `/profile`, `/request`, `/request/help`, `/request/supplies`, `/my-activity`, `/help`, `/court-officer-dashboard`, `/cmc-dashboard`, `/court-aide-dashboard`, `/term-sheet`, `/notifications` — all return `null` from `getTourForRoute()`, so `hasTour = false` and the "Tour This Page" option doesn't appear. Users clicking the help button on these pages only see "Help Center" with no page-specific guidance.

**Fix:**
- Raise Help Button z-index to `z-50` to match FAB
- On mobile, add more vertical separation between Help Button and FAB (e.g., `bottom-[10.5rem]` instead of `bottom-36`)
- Add basic tours for `/profile`, `/my-activity`, `/request`, role dashboards
- Add missing `data-tour` attributes to page components so tour steps find their targets

---

### 2. HEADER - Logo and Icons Too Small (MEDIUM)

**Problem:** The header logo is `h-7 w-7` (28px) and the nav icons are `h-4 w-4` (16px). The header height is only `h-12` (48px). For a facilities management app used on various devices, these are cramped:
- Logo at 28px is hard to identify at a glance
- Nav button icons at 16px with `h-8` (32px) tap targets are below the 44px mobile recommendation
- The profile avatar is `h-7 w-7` (28px) — very small
- The notification/theme/search icons in the right utility area are similarly small

**Fix:**
- Increase header height from `h-12` to `h-14`
- Increase logo from `h-7 w-7` to `h-9 w-9`
- Increase nav icon size from `h-4 w-4` to `h-5 w-5`
- Increase nav button height from `h-8` to `h-9`
- Increase profile avatar from `h-7 w-7` to `h-8 w-8`
- Increase right-side utility icons to match

---

### 3. LOGIN PAGE - Forces Light Theme Globally (MEDIUM)

**Problem:** `LoginPage.tsx` lines 18-25 forcibly strips all theme classes and sets `light`. When the user navigates away, it restores via `prevClassName`, but this causes a visible flash/flicker. If the user's preferred theme is dark, they see a jarring light→dark transition after login.

**Fix:** Instead of manipulating `document.documentElement.className`, scope the light theme only to the login card via a local CSS class or wrapper div. This avoids global side effects.

---

### 4. FLOATING BUTTONS STACKING - Mobile Overlap Risk (MEDIUM)

**Problem:** Three fixed-position elements stack in the bottom-right on mobile:
- Bottom Tab Bar: `bottom-0`, `z-40`
- FAB: `bottom-24`, `z-50`
- Help Button: `bottom-36`, `z-40`

The Help Button has a **lower z-index** than the FAB. If the Help Button dropdown opens, it could be clipped behind the FAB. Also, `MobileSpaceFAB` uses the same `bottom-24 right-4 z-50` as the main FAB, which would cause direct overlap on the `/spaces` page.

**Fix:**
- Make Help Button `z-50` (same as FAB)
- Add `pointer-events-none` to Help Button wrapper when dropdown is closed, and `pointer-events-auto` on the button itself
- Hide one of the two FABs on `/spaces` (the main FAB or the MobileSpaceFAB)

---

### 5. PURCHASING DASHBOARD ROUTE - Dead Route (LOW)

**Problem:** `App.tsx` line 133 defines `/purchasing-dashboard` route that renders `RoleDashboard`. The `getRoleDashboardConfig` still handles `purchasing_staff` but this role doesn't exist in `SYSTEM_ROLES`. The route exists but no user can ever be routed there by the role-based routing system.

**Fix:** Remove the `/purchasing-dashboard` route from `App.tsx` and the `purchasingStaffConfig` from `roleDashboardConfig.ts`.

---

### 6. ACTIVITY SORT STILL USES STRING COMPARISON (LOW)

**Problem:** In `RoleDashboard.tsx` line 251, activities are sorted using `b.time.localeCompare(a.time)` but `time` is now a human-readable string like "3 hours ago" from `formatDistanceToNow()`. String comparison of these values does NOT produce chronological order (e.g., "3 hours ago" vs "5 minutes ago" — alphabetically "3" < "5" but chronologically "5 minutes ago" is more recent).

**Fix:** Sort by the raw `created_at` timestamp before converting to human-readable format. Store a `sortKey` field with the ISO date string.

---

### 7. MISSING TOUR TARGETS (MEDIUM)

**Problem:** Tour steps reference `data-tour` attributes that are often missing from components. For example:
- `[data-tour="ops-tabs"]` — Operations page may not have this
- `[data-tour="keys-create"]`, `[data-tour="keys-request-card"]` — Keys page may not add these
- `[data-tour="inventory-search"]`, `[data-tour="inventory-alerts"]`, etc.

When targets aren't found, `EVENTS.TARGET_NOT_FOUND` fires and the tour auto-advances, making it look like the tour is skipping or broken.

**Fix:** Add `data-tour` attributes to the actual components. Audit each tour's steps against the real component markup and add missing attributes.

---

### 8. `@ts-nocheck` IN CRITICAL FILES (HIGH - from previous audit, still present)

**Problem:** 9 page files and many component files still use `@ts-nocheck`. Key files:
- `UserDashboard.tsx` — main user-facing page
- `AdminDashboard.tsx` — main admin page
- `Layout.tsx` — the app shell
- `SupplyRoom.tsx`, `admin/SupplyRequests.tsx` — supply management

**Fix:** Remove `@ts-nocheck` from at least `Layout.tsx`, `UserDashboard.tsx`, and `AdminDashboard.tsx` and fix resulting type errors. This is a multi-step effort.

---

### 9. REQUEST HUB - "Report Issue" Navigates to Wrong Page (LOW)

**Problem:** In `RequestHub.tsx` line 49, "Report Issue" navigates to `/my-issues?new=1`. This takes the user to their issues list page with a query param that may or may not trigger the report wizard — it depends on whether `MyIssues` checks for `new=1`. Similarly, "Request Key" goes to `/my-requests?new=1`. This is an inconsistent pattern compared to supplies (`/request/supplies`) and help (`/request/help`) which have dedicated form pages.

**Fix:** Verify that `MyIssues` and `MyRequests` pages handle the `?new=1` param to auto-open the creation form. If not, create dedicated `/request/issue` and `/request/key` routes.

---

### 10. BOTTOM TAB BAR - No "Help" or "New Request" Quick Access (LOW)

**Problem:** For standard users, the bottom tab shows 4 items from their navigation config. There's a FAB for "New Request" but no tab for it. If a user's 4 tabs are Dashboard, My Activity, Tasks, Profile — there's no quick way to access Help/Support from the bottom bar.

**Fix:** No code change needed — the FAB covers "New Request" and the Help Button covers help. This is acceptable.

---

## Implementation Plan (Priority Order)

1. **Fix Help Button z-index & mobile positioning** — Change `z-40` to `z-50`, increase mobile bottom offset to avoid FAB overlap
2. **Enlarge header elements** — Increase logo to `h-9 w-9`, header to `h-14`, nav icons to `h-5 w-5`, avatar to `h-8 w-8`
3. **Fix activity sort** — Add raw timestamp `sortKey` to activity items, sort by that instead of human-readable string
4. **Add `data-tour` attributes** to Operations, Keys, Inventory, and other components so tours work
5. **Add basic tours** for `/profile`, `/my-activity`, `/request`, and role dashboard pages
6. **Fix Login theme scoping** — Scope light theme to login card instead of global `documentElement`
7. **Remove dead purchasing-dashboard route** from `App.tsx`
8. **Verify `?new=1` handling** on MyIssues and MyRequests pages

