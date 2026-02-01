
# Developer Mode: Role Switching & Dashboard Testing

## Overview

You want a way to quickly switch between roles and test different dashboards/features without repeatedly logging in and out. This is a very common need for development and QA testing.

## What Already Exists

The codebase already has a `preview_role` mechanism built into `useRolePermissions.ts`:
- Admins can set `localStorage.setItem('preview_role', 'court_aide')` to preview other roles
- **Current limitation**: This only works on the `/admin-profile` page (line 227 checks `window.location.pathname.startsWith('/admin-profile')`)
- When you sign out, the preview role is automatically cleared

## Proposed Solution

Create a **Developer Mode Panel** that:
1. Is only accessible to admin users
2. Can be toggled via keyboard shortcut (Ctrl+Shift+D)
3. Shows a floating panel with quick role switching
4. Extends the existing `preview_role` mechanism to work **site-wide** (not just Admin Profile)
5. Provides quick links to test key pages for each role

## How It Will Work

1. **Activation**: Press `Ctrl+Shift+D` (or tap a hidden spot 5 times on mobile) to toggle Developer Mode
2. **Panel Position**: Fixed bottom-right floating panel (draggable)
3. **Features**:
   - Quick role switcher (Admin → CMC → Court Aide → Standard User)
   - Current role indicator with visual badge
   - Quick links to role-specific dashboards and pages
   - "Reset to Real Role" button to exit preview mode
   - Warning banner when viewing as a different role

## Visual Design

```text
┌─────────────────────────────────────────┐
│ 🔧 DEV MODE                         ✕   │
├─────────────────────────────────────────┤
│ Current: [Admin] → Viewing as: [CMC]    │
├─────────────────────────────────────────┤
│ Switch Role:                            │
│  ○ Admin     ○ CMC                      │
│  ○ Court Aide  ○ Standard               │
├─────────────────────────────────────────┤
│ Quick Links:                            │
│  [Dashboard] [Tasks] [Operations]       │
│  [Supply Room] [Inventory]              │
├─────────────────────────────────────────┤
│        [Reset to Real Role]             │
└─────────────────────────────────────────┘
```

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/dev/DevModePanel.tsx` | Main floating panel component |
| `src/hooks/useDevMode.ts` | Hook for managing dev mode state and keyboard shortcuts |

### Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useRolePermissions.ts` | Remove the `/admin-profile` path restriction (line 227) so preview_role works everywhere |
| `src/App.tsx` | Add DevModePanel at root level (only renders for admins) |
| `src/components/layout/Layout.tsx` | Add warning banner when in preview role mode |

### Key Implementation Points

1. **Security**: 
   - DevModePanel only renders if `isAdmin === true` (from database role, not preview)
   - Preview role is stored in localStorage only (no server-side changes)
   - RLS policies still enforce real role at database level
   - Clear indicator that you're in "preview mode" to prevent confusion

2. **User Experience**:
   - Panel remembers its position
   - Keyboard shortcut `Ctrl+Shift+D` for quick toggle
   - Mobile: 5 taps on bottom-right corner to activate
   - Panel is draggable to reposition

3. **Integration**:
   - Uses existing `preview_role` localStorage key
   - Dispatches `preview_role_changed` event (already listened for in useRolePermissions)
   - Automatic cleanup on sign out (already implemented)

### Quick Links by Role

| Role | Primary Pages to Test |
|------|----------------------|
| **Admin** | `/` (Admin Dashboard), `/spaces`, `/keys`, `/access-assignments`, `/admin-profile` |
| **CMC** | `/cmc-dashboard`, `/court-operations`, `/tasks`, `/operations` |
| **Court Aide** | `/court-aide-dashboard`, `/supply-room`, `/inventory`, `/tasks` |
| **Standard** | `/dashboard`, `/request`, `/my-activity`, `/profile` |

## Benefits

1. **Fast testing**: Switch roles in 1 click instead of logging in/out
2. **All-in-one**: Test any page as any role from a single panel
3. **Safe**: Doesn't change your actual database role
4. **Clear UX**: Warning banner prevents confusion about current view
5. **Production-safe**: Only visible to authenticated admins

## Security Note

This is a **client-side preview only**. The database RLS policies still enforce the user's real role. This means:
- You can see what the UI looks like for other roles
- You cannot actually perform actions restricted by RLS (database will block them)
- Good for visual testing, but database operations will still use your real permissions

## Implementation Order

1. Create `useDevMode.ts` hook with keyboard listener and state management
2. Create `DevModePanel.tsx` component with role switcher and quick links
3. Update `useRolePermissions.ts` to remove path restriction
4. Add panel to `App.tsx` (conditionally for admins)
5. Add warning banner to `Layout.tsx`
