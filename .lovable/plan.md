## Goal
Simplify the `court_officer` role so the entire experience is just key management. No dashboard, no Spaces, no Term Sheet, no Notifications page — just Keys (and Profile for account access).

## Changes

### 1. Default landing → Keys
`src/routes/roleBasedRouting.ts`
- `ROLE_DASHBOARDS.court_officer.path`: `/court-officer-dashboard` → `/keys`
- `hasModuleAccess`: remove `court_officer` from `spaces`, `operations`, `dashboard`. Keep only `keys`.

### 2. Navigation (sidebar + mobile tabs)
`src/components/layout/config/navigation.tsx` (both the items list ~L202 and the routes list ~L324)
- Replace court_officer nav with:
  - Keys
  - (separator)
  - Profile
- Drop: Dashboard, Spaces, Term Sheet, Notifications

### 3. Dashboard route
- `RoleDashboard.tsx`: remove the `court_officer` branch entirely (no key-stat cards needed since they land directly on `/keys`).
- Court officers will no longer hit `/court-officer-dashboard`; any direct visit redirects to `/keys` via the role-aware home logic already added.

### 4. Role permissions sanity check
`src/features/auth/hooks/useRolePermissions.ts` and `src/lib/permissions.ts` — confirm court_officer keeps `canView('keys')` / `canAdmin('keys')` at current levels, and drop any Spaces/Term Sheet/Operations grants. (Term Sheet is read-only for everyone per project memory, so they'll still implicitly lose nothing critical.)

### 5. FAB / quick actions
Confirm `FloatingActionButton` doesn't surface supply/issue shortcuts for court_officer — if it does, hide it for this role.

## Out of scope
- No DB / RLS changes. Existing key-related policies for court_officer remain.
- No visual restyle of the Keys page.
- Other roles untouched.

## QA
- Log in as court_officer → lands on `/keys`.
- Sidebar shows only Keys + Profile.
- Mobile bottom tabs show only Keys + Profile.
- Visiting `/spaces`, `/term-sheet`, `/court-officer-dashboard`, `/notifications` redirects to `/keys` (or shows the standard "no access" guard).
- Back button from any key sub-screen returns to `/keys`.
