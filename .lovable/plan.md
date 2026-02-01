
# Fix User Dashboard Display & Add Term Sheet Button for Supply Team

## Problem Summary

### Issue 1: User Dashboard Not Showing
When using Developer Mode to preview the "Standard" user role, you're still seeing the Admin Dashboard instead of the User Dashboard.

**Root Cause**: The DevModePanel correctly navigates to `/dashboard` when you select "Standard", but if you're currently on `/` and the navigation doesn't happen (or you click the "Dashboard" quick link which goes to `/`), you stay on the Admin Dashboard route which is hardcoded to show `AdminDashboard`.

**Also**: The quick links in DevModePanel update dynamically based on the *effective* role, so when you switch to "Standard", the Dashboard link should point to `/dashboard`. However, if something is caching or not refreshing properly, it might still show admin links.

### Issue 2: Term Sheet Access for Supply Team
The Court Aide (supply team) dashboard doesn't have a button to access the Term Sheet, which is important for them to see court assignments at a glance.

---

## Solution

### Fix 1: Ensure DevMode Quick Links Navigate Correctly

Update the DevModePanel's "Dashboard" quick link behavior to always use the role-specific dashboard path rather than the hardcoded links.

**File: `src/components/dev/DevModePanel.tsx`**

Currently the quick links are defined with static paths. When the preview role changes, the `effectiveRole` from `useRolePermissions` should update, and the quick links should reflect the new role's paths. Need to verify this is working and add a useEffect to force re-render.

### Fix 2: Add Term Sheet Button to Court Aide Work Center

**File: `src/pages/CourtAideWorkCenter.tsx`**

Add a "Term Sheet" button to the action buttons section so Court Aides can quickly access the term sheet.

```
Current buttons: Inventory | All Tasks | Settings
New buttons: Inventory | Term Sheet | All Tasks | Settings
```

### Fix 3: Add Term Sheet to Court Aide Quick Links in DevMode

**File: `src/components/dev/DevModePanel.tsx`**

Add Term Sheet to the court_aide quick links for easier testing access.

---

## Technical Implementation

### File 1: `src/pages/CourtAideWorkCenter.tsx`

Add a Term Sheet button in the action buttons section (lines 48-66):

```tsx
// Add after the existing Inventory button
<Button variant="outline" size="sm" asChild className="shrink-0">
  <Link to="/term-sheet">
    <Scale className="h-4 w-4 mr-2" />
    Term Sheet
  </Link>
</Button>
```

Also add `Scale` to the imports from `lucide-react`.

### File 2: `src/components/dev/DevModePanel.tsx`

Update the `court_aide` quick links array to include Term Sheet:

```tsx
court_aide: [
  { label: 'Work Center', path: '/court-aide-dashboard' },
  { label: 'Term Sheet', path: '/term-sheet' },  // NEW
  { label: 'Supply Room', path: '/supply-room' },
  { label: 'Inventory', path: '/inventory' },
  { label: 'Tasks', path: '/tasks' },
],
```

### File 3: Verify DevMode Role Switching

The DevModePanel already uses `getDashboardForRole()` for navigation when switching roles. Verify that:

1. When switching to "Standard", it navigates to `/dashboard`
2. The quick links update to show `standard` role links (Dashboard → `/dashboard`)

If the quick links aren't updating, add a key prop to force re-render:

```tsx
<div key={effectiveRole} className="flex flex-wrap gap-1.5">
  {quickLinks.map((link) => (
    // ...
  ))}
</div>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/CourtAideWorkCenter.tsx` | Add Term Sheet button to action buttons |
| `src/components/dev/DevModePanel.tsx` | Add Term Sheet to court_aide quick links; add key prop for re-render |

---

## Expected Behavior After Fix

1. **DevMode Role Switching**: 
   - Clicking "Standard" → Navigates to `/dashboard` → Shows the new User Dashboard with Term Sheet
   - Quick links update to show Standard user links

2. **Court Aide Dashboard**:
   - New "Term Sheet" button visible in the header action buttons
   - Clicking it navigates to `/term-sheet` for full term view

3. **DevMode Testing for Court Aide**:
   - Term Sheet appears in quick links for faster access during testing

---

## How to Test

1. Open DevMode (Ctrl+Shift+D)
2. Click "Standard" radio button
3. Verify you're taken to `/dashboard` and see the User Dashboard with Term Sheet
4. Switch back to "Court Aide"
5. Verify you're taken to `/court-aide-dashboard`
6. Verify new "Term Sheet" button is visible in the action bar
7. Click Term Sheet button and verify navigation to `/term-sheet`
