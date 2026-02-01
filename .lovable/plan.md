
# Fix Developer Mode Dashboard Navigation

## Problem Identified

When using Developer Mode to preview other roles, clicking "Dashboard" links still shows the Admin Dashboard instead of the role-appropriate dashboard.

**Root Cause**: The current route structure has separate explicit routes for each dashboard:
- `/` → `AdminDashboard` (with `requireAdmin`)
- `/dashboard` → `UserDashboard`
- `/cmc-dashboard` → `RoleDashboard`
- `/court-aide-dashboard` → `CourtAideWorkCenter`

When you stay on `/` and switch roles via DevModePanel, the route doesn't change - you're still viewing the Admin-only route. The DevModePanel's quick links DO point to the correct paths (e.g., `/dashboard` for Standard), but users naturally expect that switching roles would change what they see on the current page.

---

## Solution: Auto-Navigate on Role Switch

Make the DevModePanel automatically navigate to the appropriate dashboard when switching roles. This matches user expectations - when you switch to "Standard User", you should immediately see what a standard user sees.

---

## Technical Changes

### File 1: `src/components/dev/DevModePanel.tsx`

**Change**: After setting a preview role, automatically navigate to that role's default dashboard.

```
Current behavior:
  setPreviewRole(value as UserRole);

New behavior:
  setPreviewRole(value as UserRole);
  // Navigate to the new role's default dashboard
  const newDashboard = ROLE_QUICK_LINKS[value as UserRole]?.[0]?.path || '/dashboard';
  navigate(newDashboard);
```

This ensures that when you click "Court Aide" in the role switcher, you're taken to `/court-aide-dashboard` automatically.

### File 2: `src/hooks/useDevMode.ts`

**Change**: The `setPreviewRole` function could optionally return the target dashboard path, making navigation more explicit from the caller.

Alternatively, we can add a new function `switchToRole(role)` that combines setting the preview role AND navigating.

---

## Additional Enhancement: SmartDashboard Redirect

For a more seamless experience, we can also modify the `/` route behavior when a preview role is active:

### File 3: `src/pages/SmartDashboard.tsx` (or modify App.tsx route)

**Option A - Modify SmartDashboard**: Have the `/` route use `SmartDashboard` instead of `AdminDashboard`, so it automatically renders the right dashboard based on `userRole` (which includes preview_role).

**Current Route Structure**:
```tsx
<Route path="/" element={
  <ProtectedRoute requireAdmin>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

**Proposed Route Structure**:
```tsx
<Route path="/" element={
  <ProtectedRoute>
    <SmartDashboard />
  </ProtectedRoute>
} />
```

This would mean `/` shows:
- AdminDashboard for admins (real or previewing)
- UserDashboard for standard users
- RoleDashboard for CMC/Court Aide

**Important**: We'd need to keep `requireAdmin` protection for non-admin users in their real role. The change would only affect admins using Dev Mode to preview.

---

## Recommended Approach (Minimal Change)

The simplest fix that matches user expectations:

1. **Auto-navigate on role switch** in DevModePanel
2. Keep route structure unchanged
3. Add a note in the Dev Mode panel that says "Navigating to [Role] dashboard..."

This is the safest approach as it:
- Doesn't change routing for real users
- Doesn't bypass security for non-admins
- Gives admins the preview experience they expect

---

## Implementation Summary

| File | Change |
|------|--------|
| `src/components/dev/DevModePanel.tsx` | Auto-navigate to role's default dashboard on role switch |
| `src/hooks/useDevMode.ts` | (Optional) Add `switchToRole` helper function |

---

## Expected Behavior After Fix

1. Open Dev Mode (Ctrl+Shift+D)
2. Click "Standard" radio button
3. **Automatically navigates to `/dashboard`**
4. See the Standard User Dashboard
5. Click "Court Aide" radio button
6. **Automatically navigates to `/court-aide-dashboard`**
7. See the Court Aide Work Center

This matches the intuitive expectation: "Switch role = switch to that role's view"
