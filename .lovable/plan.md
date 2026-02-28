

# Court Officer / Major Dashboard

## Context

The system currently has 4 frontend roles (`admin`, `cmc`, `court_aide`, `standard`), but the database `user_role` enum already includes `court_officer` as a valid value. The Major (senior court officer responsible for building security) needs a focused view with access to:

- **Keys / Lockbox** -- managing who has access to what
- **Spaces / Building Layout** -- understanding the physical building (read-only)
- **Term Sheet** -- knowing which judges are where

They do **not** need access to issues, supply requests, inventory, maintenance, or admin functions.

## What Changes

### 1. Add `court_officer` to the frontend role system

**`src/config/roles.ts`**
- Add `'court_officer'` to the `UserRole` type union
- Add a new entry to `SYSTEM_ROLES` array: value `court_officer`, label "Court Officer", description "Building security, key management, and facility layout access", color `blue`
- Add to `SIGNUP_ROLE_OPTIONS` (or exclude if only admin-assignable -- recommend excluding, same as admin)

**`src/lib/permissions.ts`**
- Add `'court_officer'` to `USER_ROLES` constant
- Add `court_officer` to relevant permission arrays:
  - `facility.view` -- yes
  - `facility.update_status` -- no
  - `audit.view` -- yes (security needs audit trail visibility)
  - All issue/admin permissions -- no

### 2. Add permissions and navigation for the role

**`src/hooks/useRolePermissions.ts`**
- Add `court_officer` to `rolePermissionsMap`:
  - `spaces: 'read'` (view building layout, read-only)
  - `keys: 'write'` (manage lockbox, issue keys)
  - `dashboard: 'read'`
  - Everything else: `null`

**`src/components/layout/config/navigation.tsx`**
- Add a `court_officer` navigation block in `getRoleBasedNavigation`:
  - Dashboard, Keys, Spaces (read-only), Term Sheet
- Add matching routes in `getNavigationRoutes`:
  - `/court-officer-dashboard`, `/keys`, `/spaces`, `/term-sheet`

### 3. Add dashboard configuration

**`src/config/roleDashboardConfig.ts`**
- Add `'court_officer'` to `DashboardRole` type
- Add `court_officer` config entry:
  - Title: "Court Officer Dashboard"
  - Greeting: "Officer"
  - Primary action: Keys (/keys)
  - Secondary action: Building Layout (/spaces)
  - Stats: Total Keys Issued, Keys Checked Out, Lockbox Status, Active Courtrooms
  - Quick actions: Key Management, Lockbox, Building Layout, Term Sheet
  - `showTermSheet: true`, all others false

### 4. Add routing

**`src/utils/roleBasedRouting.ts`**
- Add `court_officer` to `ROLE_DASHBOARDS`: path `/court-officer-dashboard`, name "Court Officer Dashboard"
- Add `court_officer` to `hasModuleAccess`: grant access to `keys`, `spaces` (read), `dashboard`

**`src/App.tsx`**
- Add route: `/court-officer-dashboard` pointing to `RoleDashboard` (the unified role dashboard component handles it via config)

### 5. Update route protection

**`src/components/auth/ProtectedRoute.tsx`** -- no changes needed (non-admin roles already fall through to permission checks)

**`src/App.tsx`**
- The `/keys` route currently has `requireAdmin`. Change to allow `court_officer` as well (add `allowDepartments` or remove `requireAdmin` and use permission-based gating)
- The `/spaces` route currently has `requireAdmin`. Add court_officer access (read-only view)

### 6. Update RLS policies (database)

No database schema changes needed -- `court_officer` is already in the `user_role` enum. However, RLS policies for `keys`, `key_assignments`, `lockboxes`, and related tables need to grant access to `court_officer`. This means adding `OR public.has_role('court_officer')` to the relevant SELECT/INSERT/UPDATE policies on:
- `keys` table
- `key_assignments` table
- `lockboxes` table
- `lockbox_slots` table
- `lockbox_activity_logs` table
- `rooms` table (SELECT only, for building layout)
- `floors` / `buildings` tables (SELECT only)

### 7. Files touched (summary)

| File | Change |
|------|--------|
| `src/config/roles.ts` | Add `court_officer` to type and `SYSTEM_ROLES` |
| `src/lib/permissions.ts` | Add `court_officer` to `USER_ROLES` and permission arrays |
| `src/hooks/useRolePermissions.ts` | Add `court_officer` permission map |
| `src/components/layout/config/navigation.tsx` | Add court officer nav + routes |
| `src/config/roleDashboardConfig.ts` | Add court officer dashboard config |
| `src/utils/roleBasedRouting.ts` | Add court officer dashboard route + module access |
| `src/App.tsx` | Add `/court-officer-dashboard` route, relax `/keys` and `/spaces` from admin-only |
| Database (RLS) | Add `has_role('court_officer')` to key/lockbox/room SELECT policies |

### Implementation order
1. Update role type and config (`roles.ts`, `permissions.ts`)
2. Add permission map (`useRolePermissions.ts`)
3. Add dashboard config (`roleDashboardConfig.ts`)
4. Add routing (`roleBasedRouting.ts`, `App.tsx`)
5. Add navigation (`navigation.tsx`)
6. Update RLS policies for key/lockbox/room tables
7. Test end-to-end with a court_officer user

