## Problem

Logged in as an admin, navigating to `/dashboard` renders the standard **User Dashboard** — but admins should only ever see the **Admin Dashboard** at `/`.

Root cause is in `src/components/layout/config/navigation.tsx`:

1. The `User Dashboard` nav item (line 32-38) has `adminOnly: false`, so it appears in the sidebar for everyone — including admins.
2. `getFilteredNavigationItems` (line 372-386) unconditionally returns `true` for both `/` and `/dashboard`, bypassing the role check entirely.

Result: admins see two dashboard links ("Dashboard" → `/` and "User Dashboard" → `/dashboard`) and can land on the user view.

## Fix

Frontend-only, two small changes in `src/components/layout/config/navigation.tsx`:

1. In `getFilteredNavigationItems`, change the always-allow rule so admin-tier roles (`admin`, `system_admin`, `facilities_manager`) only see `/`, and non-admin roles only see `/dashboard`:
   - `/` → show only for admin-tier
   - `/dashboard` → hide for admin-tier
2. (No change needed to the route itself — `UserDashboard` at `/dashboard` stays available for non-admin roles, which is correct.)

Optional hardening (only if you want it — say the word):
- Add a redirect in `UserDashboard` so an admin who lands on `/dashboard` via a stale link bounces to `/`.

## Files

- `src/components/layout/config/navigation.tsx` — adjust the filter logic for `/` and `/dashboard`.

No DB, no routing, no business logic changes.