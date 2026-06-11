
# Court Aide Experience Audit & Rework

## What's wrong today

A Court Aide signs in and lands directly on `/tasks` — there is no operations dashboard at all. The only "dashboards" wired up for them are user-flavored:

- `/dashboard` (UserDashboard) renders the standard-user layout: greeting card, "Order Supplies / Make a Request / Request a Key" rows, "My Activity" feed. It only redirects away after mount, so they briefly see a user view.
- There is already a purpose-built `CourtAideWorkCenter` page (with `TaskWorkQueue`, `SupplyFulfillmentPanel`, `TodaySchedule`, `AlertsBar`, `WorkCenterStats`) — but it is not routed anywhere, so nobody can reach it.
- `RoleDashboard` also has Court Aide branches, also not routed.

Navigation is also wrong for the role:
- Sidebar shows: Tasks, Inventory, Term Sheet, **Profile**. Per the new rule, Profile is gone.
- **Supply Room** (the core fulfillment surface for a Court Aide) is not in their nav at all — they have to deep-link via a button on a page they can't reach.
- Per-role rail in `navigationPaths.ts` sends them straight to `/tasks` with no "home".

Result: the role that owns supplies + inventory + task fulfillment has no operational home screen and a nav that hides their main tool.

## Target experience

Court Aide is an **operations** role, not an end-user. Their home should open straight onto work-in-flight:

1. Alerts (overdue tasks, low stock, stuck supply requests)
2. Quick stats (available tasks, my active, pending pickups, low-stock count)
3. Two side-by-side work panels: **Task Queue** + **Supply Fulfillment**
4. Today's schedule strip

No "Make a Request / Request a Key / Order Supplies" CTAs — those are end-user actions, not Court Aide work.

## Changes

### 1. Route + landing
- Add route `/work-center` → `CourtAideWorkCenter` (lazy-loaded in `App.tsx`, behind `ProtectedRoute`).
- `roleBasedRouting.ts`: change `court_aide` dashboard from `/tasks` to `/work-center`.
- `navigationPaths.ts`: update the `court_aide` home from `/tasks` to `/work-center`.
- `UserDashboard.tsx`: keep the existing role redirect — Court Aide now lands on `/work-center` instead of briefly flashing the user view.

### 2. Navigation (sidebar + mobile)
Update both `getNavigationTabs` and `getNavigationPaths` for `court_aide` in `src/components/layout/config/navigation.tsx`:

```
Work Center  → /work-center   (Home/Briefcase icon)
Tasks        → /tasks
Supply Room  → /supply-room   (NEW — core to the role)
Inventory    → /inventory
Term Sheet   → /term-sheet
```

- **Remove Profile** from Court Aide nav (and remove the trailing separator).
- Remove `court_aide` from `noDashboardRoles` in `getFilteredNavigationItems` so the Work Center counts as their home.

### 3. Work Center content polish
`CourtAideWorkCenter.tsx` already imports `CompactHeader` (the user-style greeting). Tighten it for the operations framing:
- Drop the room/department/title fields from the header — show name + "Court Aide" + shift/today's date.
- Remove the floating bottom "Report Issue / Supply Room" bar (Supply Room is now in the sidebar; issues are not a Court Aide responsibility).
- Remove the `<Link to="/profile">` settings cog.
- Keep the top action buttons but drop "Term Sheet" (already in sidebar) and add a "Supply Room" primary button so the fulfillment surface is one tap away.

### 4. Permissions sanity pass
Verify with the existing `useRolePermissions` mapping that `court_aide` already has:
- `tasks`: write/admin (claim + complete)
- `supply_requests`: write (fulfillment-stage only — already enforced by migration 040 RLS)
- `inventory`: write (stock adjustments)
- `term_sheet`: read

No DB/RLS changes are needed — migration 040 already blocks Court Aide from approving `pending_approval` supply requests, which is the correct behavior.

### 5. Cleanup
- Remove the unrouted Court Aide branches in `RoleDashboard.tsx` (`court_aide` in `inlineStats`, `FocusedTaskList`, the `enabled` flags) — Work Center replaces it. Leaves `RoleDashboard` for `court_liaison`/`purchasing` only.
- Delete the dead `roleDashboardConfigs.court_aide` block in `src/config/roleDashboardConfig.ts` and update its test.
- Update `src/routes/roleBasedRouting.test.ts` if it asserts the old `/tasks` landing.

## Files touched

```text
src/App.tsx                                        (+ route)
src/routes/roleBasedRouting.ts                     (court_aide → /work-center)
src/components/layout/utils/navigationPaths.ts     (home path)
src/components/layout/config/navigation.tsx        (tabs/paths, drop Profile, add Supply Room/Work Center)
src/features/court/pages/CourtAideWorkCenter.tsx   (header + footer polish)
src/features/dashboard/pages/RoleDashboard.tsx     (remove court_aide branches)
src/config/roleDashboardConfig.ts                  (remove court_aide entry)
src/config/roleDashboardConfig.test.ts             (update assertion)
src/routes/roleBasedRouting.test.ts                (update assertion if present)
```

## Out of scope

- Profile page itself (the user's direction is "we're not going to do profile anymore" — this plan only removes Court Aide's nav entry; a full app-wide Profile removal is a separate request).
- Reworking the supply pipeline or RLS — those are correct as-is.
- Visual redesign of the Work Center panels themselves (`TaskWorkQueue`, `SupplyFulfillmentPanel`, etc.) — they are already operations-oriented; we can iterate after the routing fix lands.

## Open questions

1. **Profile scope** — do you want Profile removed for *all* roles in this same pass, or only Court Aide for now? (The plan above only removes it from Court Aide nav.)
2. **Issues** — should Court Aide be able to *report* issues from the Work Center (a single button), or are issues fully outside their lane?
