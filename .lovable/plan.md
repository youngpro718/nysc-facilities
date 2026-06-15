## Audit summary

Two parallel investigations turned up one critical wiring bug, two real UX gaps on the Tasks page, and a small set of low-severity polish items. Fixing as I go, smallest-impact first.

## Findings & fixes

### A. Tasks page — "tasks I created don't appear" (the reported issue)

**Root cause:** The `/tasks` page has two views — a court-aide layout and an admin/manager layout. Standard users land on the admin layout, which fetches `staff_tasks` with no `created_by` filter. Their own pending/active requests *are* fetched by RLS, but the page has **no tab that surfaces them as "mine"**, so they look like they vanish. The dedicated "My Requests" view (`UserTasksTab`) is wired into `/my-activity` only.

There's also a small bug in the court-aide view: the `My Tasks` bucket is hardcoded to `['claimed', 'in_progress']`, so a task an aide just approved-and-claimed shows up but a task they're assigned to but is still `pending_approval` or `approved` is hidden from their personal tab.

**Fixes (`src/features/tasks/pages/Tasks.tsx`):**
1. For **non-manager / non-court-aide roles**, render the existing `<UserTasksTab />` instead of the admin layout. Same component used on My Activity, single source of truth — no duplicate code.
2. For the **court aide** layout, expand `myTasks` to also include tasks where `assigned_to === user.id` regardless of status (still excluding completed/cancelled/rejected). So an aide always sees everything currently on their plate.
3. Add a tiny "My Submissions" count to the admin layout header so managers can see how many tasks they themselves created — non-blocking, helps them too.

### B. Facilities Manager sidebar — Term Sheet & Profile are dead clicks 🔴

**Root cause:** `getRoleBasedNavigation` (`navigation.tsx:127-141`) emits 11 nav items for `facilities_manager`, but `getNavigationRoutes` (`navigation.tsx:239-252`) emits only 10 — the `'/term-sheet'` entry is missing between `'/tasks'` and the separator. Sidebar maps `routes[i]` to each nav item, so Term Sheet ends up with `''` (no-op), the separator slides to the wrong index, and Profile gets `undefined → ''` too. **Both buttons silently do nothing.**

**Fix (`src/components/layout/config/navigation.tsx`):** Insert `'/term-sheet'` into the facilities_manager routes array between `'/tasks'` and the separator. One-line change, no other side effects.

### C. Stale `/court-aide-dashboard` redirect 🟡

`App.tsx:134` still redirects `/court-aide-dashboard → /tasks`, but court_aide's actual home is `/work-center`. Anyone with the old link lands on the wrong place.

**Fix (`src/App.tsx`):** Update the redirect target to `/work-center`. Also remove the stale `/court-aide-dashboard` row in `routes.ts` (label still says "Supply Staff Dashboard") to avoid confusing breadcrumbs.

### D. Missing routes.ts entries (breadcrumb gaps) ⚠️

These pages exist and render fine, but `src/config/routes.ts` has no metadata for them so breadcrumbs are blank:
- `/work-center`
- `/notifications`
- `/issues`, `/maintenance`, `/lighting` (they redirect into `/operations`, but the breadcrumb shows empty during the redirect)
- `/admin/routing-rules`, `/admin/form-templates`

**Fix:** Add the seven missing entries to `routes.ts` with labels + parent routes. Cosmetic only, low risk.

### E. Court Officer / Purchasing — Profile unreachable from sidebar ⚠️

Neither role has a Profile entry in their sidebar (`navigation.tsx:155-169`), so the only way in is typing `/profile`. Sign-out is in the footer separately, so accounts still work.

**Fix:** Add a `{ type: 'separator' }` + `{ title: 'Profile', icon: User }` to both arrays, and append `''` + `'/profile'` to their corresponding routes arrays. Mirrors what every other role already has.

## Out of scope (this pass)

- `CompactActivitySection` empty-state polish for the standard user dashboard — flagged as Low. Will revisit if you hit it.
- `staff_tasks` RLS policy verification against the live DB — the code path is correct; if regular users still see nothing after fix A, that's the next thing to check, but I don't want to touch RLS unless we confirm.
- Supply fulfillment panel scope — not flagged as broken in the audit, leaving alone.

## Files touched

| File | Change |
|---|---|
| `src/features/tasks/pages/Tasks.tsx` | Route standard users to `UserTasksTab`; expand court-aide `myTasks` bucket |
| `src/components/layout/config/navigation.tsx` | Add `/term-sheet` to facilities_manager routes; add Profile to court_officer + purchasing nav and routes |
| `src/App.tsx` | Redirect `/court-aide-dashboard` → `/work-center` |
| `src/config/routes.ts` | Add missing breadcrumb entries; drop stale `/court-aide-dashboard` row |

No DB migrations, no RLS changes.
