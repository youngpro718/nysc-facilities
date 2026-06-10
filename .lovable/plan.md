# Mobile Navigation Cleanup

## Problem

When an admin taps the mobile FAB and opens an action (Order Supplies, Request Help, Request Key, Report Issue), pressing the page's Back arrow uses `navigate(-1)`. That replays browser history, which can:

- Land on a redirect target (`/issues` → `/operations?tab=issues`) and bounce again,
- Land on the standard user dashboard or another tab the user happened to visit earlier,
- Land on `/login` if the page was opened from a fresh tab.

The user reports this as "back doesn't return to admin." The same pattern exists in several non-FAB pages.

## Goal

Back buttons in app pages should be **deterministic and role-aware**: they go to the user's home (admin dashboard for admins, role dashboard otherwise), or to the explicit parent route — never to whatever happened to be in history.

## Changes

### 1. New hook: `useHomePath`

`src/shared/hooks/useHomePath.ts` — returns the role-aware home path using existing `getDashboardForRole(profile?.role)` from `src/routes/roleBasedRouting.ts`. Exposes:

```ts
const homePath = useHomePath();          // e.g. "/" for admin, "/dashboard" for standard
const goHome = useGoHome();              // navigate(homePath, { replace: true })
```

### 2. Replace `navigate(-1)` in top-level back buttons

Switch these pages to `goHome()` (or an explicit parent when one is obvious):

- `src/features/supply/pages/RequestHub.tsx` — back to home
- `src/features/supply/pages/request/SupplyOrderPage.tsx` — back to home
- `src/features/supply/pages/request/HelpRequestPage.tsx`
  - Outer `step === 'select'` back button → home
  - `handleBack` fallback → home
  - (Internal step transitions `setStep('select')` stay as-is — that's in-page state, not routing)
- `src/features/admin/pages/AdminCenter.tsx` — back to home (admin will land on `/`)
- `src/components/layout/Breadcrumb.tsx` — fallback `navigate(-1)` → `goHome()`

### 3. FAB audit (`src/components/ui/FloatingActionButton.tsx`)

- "Request Key" currently navigates to `/my-requests?new=1`. Keep — route exists.
- "Report Issue" opens a dialog (no routing), fine.
- `hiddenPaths` already hides FAB on `/admin`, `/spaces`, `/operations`, `/keys`, `/inventory`, `/tasks`, `/term-sheet`, `/profile`, `/settings`. Confirm `/court-officer-dashboard` and `/court-aide-dashboard` belong (they do).
- Add `/my-activity`, `/my-requests`, `/my-issues`, `/my-supply-requests`, `/notifications` to `hiddenPaths` so the FAB does not float over its own destinations.

### 4. Issues redirect hygiene

`src/features/issues/pages/Issues.tsx` uses `<Navigate to="/operations?tab=issues" replace />`. `replace` already prevents back-stack pollution — leave as-is. Verify the same pattern is used for `/maintenance` and `/lighting` redirect shims; switch any non-`replace` redirect to `replace`.

### 5. Quick visual QA on mobile preview

After edits, load `/` as admin on the 440-wide preview, tap FAB → Order Supplies → Back, then FAB → Request Help → Back, then FAB → Request Key → Back, confirming each returns to `/` (admin dashboard). Repeat at `/dashboard` as a standard role check (back returns to `/dashboard`).

## Out of scope

- No business logic, schema, RLS, or data-fetch changes.
- No visual restyle of the FAB or pages — only routing wiring.
- In-wizard "Back" buttons that move between steps within a single page stay untouched.

## Technical notes

- `getDashboardForRole` already maps every role to its correct landing route, so the hook is a thin wrapper around `useAuth().profile?.role`.
- Using `navigate(path, { replace: true })` for the back action prevents an extra forward-entry that would let the user immediately re-enter the same sub-page with the browser's forward button.
