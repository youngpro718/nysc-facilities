## Goal
1. Lock down `purchasing` and `court_aide` to only what they actually use.
2. Give every signed-in user access to the Term Sheet (read-only directory).
3. Keep Rooms (Spaces) and Keys restricted to admin tier + court_liaison (+ court_officer for Keys, since that was just set up last turn).
4. Fix the P0 routing/back-button bugs surfaced in the QA audit so every role lands and returns to the right place.

---

## Role matrix after this change

| Role | Tabs (in order) | Default landing |
|---|---|---|
| admin / system_admin | Dashboard, Spaces, Issues, Maintenance, Lighting, Keys, Inventory, Tasks, Court Operations, Term Sheet, Admin Center | `/` |
| facilities_manager | Dashboard, Spaces, Issues, Maintenance, Lighting, Keys, Inventory, Tasks, Term Sheet, Profile | `/` |
| court_liaison | Term Sheet, Keys, Supply Room, My Activity, Notifications, Profile | `/term-sheet` |
| court_officer | Keys *(unchanged from last turn)* | `/keys` |
| **purchasing** *(new)* | Inventory, Tasks, Term Sheet, Profile | `/inventory` |
| **court_aide** *(new)* | Tasks, Inventory, Term Sheet, Profile | `/tasks` |
| standard | Dashboard, My Activity, Term Sheet, Notifications, Profile | `/dashboard` |

Notes:
- Purchasing loses: Dashboard, Supply Room, Notifications nav entries.
- Court_aide loses: Dashboard, Supply Room, Notifications nav entries.
- Standard already has Term Sheet — no change.
- Court_officer remains keys-only as set last turn (no Term Sheet) — confirm if you want it added too.

---

## Changes

### A. Role permissions — `src/features/auth/hooks/useRolePermissions.ts`
- `purchasing`: `inventory: 'admin'`, `supply_orders: 'admin'` (needed for inventory features); set `supply_requests: null`, `operations: null`, `dashboard: null`, `issues: null`. Keep all spaces/keys/maintenance/court_operations/lighting `null`.
- `court_aide`: keep `inventory: 'admin'`; set `supply_requests: null`, `supply_orders: null`, `issues: null`, `occupants: null`, `operations: null`, `dashboard: null`. (Tasks page has its own permissioning, not in this map.)
- No change to other roles' permission rows.

### B. Navigation tabs + routes — `src/components/layout/config/navigation.tsx`
- Replace `purchasing` block with: `Inventory`, `Tasks`, `Term Sheet`, separator, `Profile`. Route array: `['/inventory','/tasks','/term-sheet','','/profile']`.
- Replace `court_aide` block with: `Tasks`, `Inventory`, `Term Sheet`, separator, `Profile`. Route array: `['/tasks','/inventory','/term-sheet','','/profile']`.
- Fix `getFilteredNavigationItems` (line 367): replace hardcoded `/dashboard` check with `getDashboardForRole(userRole)` so purchasing/court_aide don't get pushed back to `/dashboard`.

### C. Default landings — `src/routes/roleBasedRouting.ts`
- `purchasing` → `/inventory` (already correct).
- `court_aide` → change `/court-aide-dashboard` → `/tasks` (matches user intent that Tasks is the primary surface).
- `hasModuleAccess` map: drop `purchasing` and `court_aide` from `dashboard`; drop `court_aide` from `supply_requests`; keep `inventory` for both.

### D. Mobile nav path resolution — `src/components/layout/utils/navigationPaths.ts`
- Make `Dashboard` resolution role-aware via `getDashboardForRole` instead of the boolean `isAdmin` flag (so purchasing → `/inventory`, court_aide → `/tasks` if "Dashboard" tab is ever rendered for them by legacy code).

### E. Mobile breadcrumb / back-button — `src/components/layout/Layout.tsx`
- Remove `hidden md:block` on the `<Breadcrumb>` so the back chevron is reachable on mobile (root cause of the "back button doesn't return me to admin" report).

### F. Orphan cleanup — `src/App.tsx`
- Remove the `/court-aide-dashboard` route and the orphan `/court-officer-dashboard` route (neither role lands there anymore). Add redirects from those paths to the new defaults to be safe for bookmarked URLs.

### G. Profile avatar guard — `src/components/layout/Layout.tsx`
- Hide the header avatar's click-to-profile for `court_officer` (keys-only role has no Profile).

### H. FAB hidden-paths trim — `src/components/ui/FloatingActionButton.tsx`
- Also hide FAB for `purchasing`, `court_aide`, `court_officer` (the quick actions — Order Supplies / Request Help / Request Key — aren't part of their workflow and currently cause confusing back-stack jumps).

---

## Out of scope
- No DB / RLS changes. All restrictions are UI + client routing; server policies already cover access.
- No visual redesign.
- No change to admin / system_admin / facilities_manager / court_liaison / standard navigation contents (only standard already had Term Sheet).

## QA after build
1. Log in (or Dev-Mode preview) as each of: purchasing, court_aide, standard, court_liaison, court_officer, facilities_manager, admin.
2. Confirm tab bar matches the matrix above on mobile and desktop.
3. From each tab, open a detail page → tap back → confirm it returns to that tab's root, not `/dashboard`.
4. Confirm Term Sheet is reachable for purchasing, court_aide, standard, court_liaison (read-only).
5. Confirm `/spaces`, `/keys`, `/maintenance`, `/lighting` redirect away for purchasing / court_aide / standard.
6. Confirm FAB no longer appears for purchasing / court_aide / court_officer.

## One question before I implement
**Court_officer** is currently keys-only (no Term Sheet). Your message said "give everybody who's a user a term sheet." Should I also add Term Sheet to court_officer, or keep them strictly keys-only as set last turn? Default if you don't reply: **keep keys-only**.
