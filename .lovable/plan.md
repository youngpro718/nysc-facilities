
# Fix User Dashboard Display & Consolidate Request Actions

## Problem Analysis

### Issue 1: User Dashboard Not Displaying in Dev Mode

**Root Cause Identified**: When you switch to "Standard" role in Dev Mode, the code correctly navigates to `/dashboard`. However, you're still seeing the admin dashboard because:

1. The sidebar navigation is dynamically determined by `getRoleBasedNavigation()` which uses `userRole` from `useRolePermissions()`
2. `useRolePermissions()` DOES respect the `preview_role` (lines 221-229 of the hook)
3. BUT the initial navigation may be cached or there's a race condition between setting the preview role and the navigation updating

**Additional Finding**: The DevModePanel already calls `navigate(getDashboardForRole(value))` after setting preview role. The issue is likely that:
- The permissions cache (30-second TTL for non-admin) may be stale
- The `preview_role_changed` event needs to trigger a permission refetch AND re-navigation

### Issue 2: "New Requests" Page Consolidation

You're asking: "Is the dedicated /request page needed, or can those actions be on the dashboard?"

**Current State**: 
- Standard user navigation includes: Dashboard, **New Request**, My Activity, Profile
- The `/request` page (RequestHub) shows 4 large action cards: Order Supplies, Request Help, Report Issue, Request Key

**Your Request**: Put these actions directly on the user dashboard so users don't need a separate page.

---

## Proposed Solution

### Fix 1: Force Dashboard Refresh on Role Switch

Modify the DevModePanel to:
1. Clear the permissions cache before setting preview role
2. Trigger a hard page reload OR force useRolePermissions to refetch
3. Ensure navigation happens AFTER the role/permissions update is complete

**File**: `src/components/dev/DevModePanel.tsx`

Changes:
- Add a small delay after setting preview role before navigating
- Clear any cached permissions when switching roles
- Force the `preview_role_changed` event to propagate fully

### Fix 2: Integrate Quick Actions into User Dashboard

Instead of linking to `/request`, put the 4 action buttons directly on the dashboard.

**Current Quick Actions Section** (lines 175-193):
```tsx
<div className="grid grid-cols-2 gap-3">
  <Button onClick={() => navigate('/request')}>Request Supplies</Button>
  <QuickIssueReportButton />
</div>
```

**Proposed Expanded Quick Actions**:
```tsx
<div className="grid grid-cols-2 gap-3">
  <Button onClick={() => navigate('/request/supplies')}>Order Supplies</Button>
  <Button onClick={() => navigate('/request/help')}>Request Help</Button>
  <QuickIssueReportButton />
  <Button onClick={() => navigate('/forms/key-request')}>Request Key</Button>
</div>
```

This gives users **direct access to all 4 actions** from their dashboard, eliminating the need for the intermediate `/request` page.

### Fix 3: Update Standard User Navigation

Remove "New Request" from navigation since actions are now on dashboard.

**File**: `src/components/layout/config/navigation.tsx`

Change standard user navigation from:
```tsx
return [
  { title: 'Dashboard', icon: LayoutDashboard },
  { title: 'New Request', icon: Package },  // REMOVE
  { title: 'My Activity', icon: FileText },
  { type: "separator" },
  { title: 'Profile', icon: User },
];
```

To:
```tsx
return [
  { title: 'Dashboard', icon: LayoutDashboard },
  { title: 'My Activity', icon: FileText },
  { type: "separator" },
  { title: 'Profile', icon: User },
];
```

And update routes accordingly.

---

## Implementation Summary

| File | Change |
|------|--------|
| `src/components/dev/DevModePanel.tsx` | Force cache clear + add delay before navigation on role switch |
| `src/pages/UserDashboard.tsx` | Expand quick actions grid to include all 4 request types |
| `src/components/layout/config/navigation.tsx` | Remove "New Request" from standard user nav, keep `/request` route as backup |

---

## Updated User Dashboard Layout

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Header: Compact greeting + Date + Notifications                    │
├─────────────────────────────────────────────────────────────────────┤
│  PICKUP ALERT BANNER (if supplies ready)                           │
├─────────────────────────────────────────────────────────────────────┤
│  QUICK ACTIONS (4 buttons, 2x2 grid)                               │
│  ┌─────────────┐ ┌─────────────┐                                   │
│  │ 📦 Order    │ │ 🆘 Request  │                                   │
│  │  Supplies   │ │    Help     │                                   │
│  └─────────────┘ └─────────────┘                                   │
│  ┌─────────────┐ ┌─────────────┐                                   │
│  │ ⚠️ Report   │ │ 🔑 Request  │                                   │
│  │   Issue     │ │    Key      │                                   │
│  └─────────────┘ └─────────────┘                                   │
├─────────────────────────────────────────────────────────────────────┤
│  COURT TERM SHEET (searchable, collapsible)                        │
├─────────────────────────────────────────────────────────────────────┤
│  MY ACTIVITY (tabbed: Supplies | Issues | Keys)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technical Details

### DevModePanel Role Switch Fix

```tsx
onValueChange={(value) => {
  // Clear permissions cache first
  localStorage.removeItem(`permissions_cache_${userId}`);
  
  if (value === realRole) {
    clearPreviewRole();
  } else {
    setPreviewRole(value as UserRole);
  }
  
  // Dispatch event for permission refresh
  window.dispatchEvent(new CustomEvent('preview_role_changed'));
  
  // Small delay to let permissions update before navigating
  setTimeout(() => {
    navigate(getDashboardForRole(value as UserRole));
  }, 100);
}}
```

### Dashboard Quick Actions Expansion

Replace the current 2-button grid with a 4-button grid, each going directly to the action form:

- **Order Supplies** → `/request/supplies`
- **Request Help** → `/request/help`
- **Report Issue** → `/forms/issue-report` (existing QuickIssueReportButton)
- **Request Key** → `/forms/key-request`

---

## Benefits

1. **Dashboard becomes the true hub** - Everything accessible from one place
2. **One less click** - Users go directly to forms instead of through /request
3. **Cleaner navigation** - Only 3 items: Dashboard, My Activity, Profile
4. **Dev Mode works correctly** - Role switches show the correct dashboard

---

## Files to Modify

1. `src/components/dev/DevModePanel.tsx` - Fix role switch + navigation timing
2. `src/pages/UserDashboard.tsx` - Expand quick actions to 4 buttons
3. `src/components/layout/config/navigation.tsx` - Remove "New Request" from standard nav; update routes
