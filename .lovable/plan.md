

# User Management Page - Simplification Plan

## What's Wrong Right Now

After auditing the current state:

### 1. Role Assignment on New User Approval is Broken
In `AdminCenter.tsx` line 119-122, when approving a user:
```typescript
const { error } = await supabase.rpc('approve_user_verification', {
  p_user_id: userId,
  p_role: 'standard',  // ← HARDCODED! No way to pick a different role
  p_admin_notes: 'Approved via admin panel'
});
```
The admin can't choose what role to assign - everyone gets "standard" automatically.

### 2. Current Admin's Info Not Shown
The page shows all users but doesn't display who YOU are as the logged-in admin at the top. This makes it feel disconnected - "whose view is this?"

### 3. Page Still Feels Cluttered
- 5 statistics cards across the top (Total, Pending, Verified, Suspended, Admins)
- Clicking them filters - but this isn't obvious
- The role dropdown exists per-user but only works for already-approved users
- Need to click "⋮ menu → Approve User" then separately change their role

### 4. Approval Workflow is Awkward
Current flow:
1. Click ⋮ menu → Approve User (assigns "standard" role automatically)
2. Then find them again and change their role with the dropdown
3. Two separate actions for what should be one

---

## The Simpler Solution

### Redesigned User Management Page

**Goal**: One simple page to manage all users with a clear approval + role assignment flow

### Visual Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ ← User Management                                           │
├─────────────────────────────────────────────────────────────┤
│ Logged in as: John Smith (Administrator)         [Refresh]  │
├─────────────────────────────────────────────────────────────┤
│ 3 users awaiting approval                     [Clear filter]│
├─────────────────────────────────────────────────────────────┤
│ 🔍 Search users...                    Filter: [All Users ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 🟡 PENDING APPROVAL                                      ││
│ │ ┌────────────────────────────────────────────────────┐  ││
│ │ │ Jane Doe                              Requested:    │  ││
│ │ │ jane@court.gov                        Court Aide    │  ││
│ │ │                                                     │  ││
│ │ │        Role: [User ▼]    [Approve] [Reject]        │  ││
│ │ └────────────────────────────────────────────────────┘  ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ ACTIVE USERS                                             ││
│ │ ┌────────────────────────────────────────────────────┐  ││
│ │ │ Bob Wilson                         Role: [User ▼]   │  ││
│ │ │ bob@court.gov                                       │  ││
│ │ └────────────────────────────────────────────────────┘  ││
│ │ ┌────────────────────────────────────────────────────┐  ││
│ │ │ Alice Chen                   Role: [Administrator ▼]│  ││
│ │ │ alice@court.gov                         (You)       │  ││
│ │ └────────────────────────────────────────────────────┘  ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Key Changes

### 1. Add "Logged in as" Header
Show the current admin at the top so they know whose view this is:
```text
Logged in as: John Smith (Administrator)
```

### 2. Replace 5 Stats Cards with Simple Alert
Instead of 5 clickable cards, show a simple alert when there are pending users:
```text
⚠️ 3 users awaiting approval
```
Much cleaner and more actionable.

### 3. Fix Approval Flow - Add Role Selection BEFORE Approving
For pending users, show:
- The role they requested (for context)
- A dropdown to select their actual role
- Approve button (uses selected role)
- Reject button

This makes it ONE action instead of two.

### 4. Simplify Filter Options
Replace 5 stat card filters with one dropdown:
- All Users
- Pending Approval
- Active
- Suspended
- Administrators

### 5. Remove Menu Dots for Approve/Reject
The ⋮ menu is awkward. For pending users, show buttons directly on the card.

---

## Technical Implementation

### File: `src/pages/AdminCenter.tsx`

**Changes:**

1. **Add current admin info at top**
   - Use existing `currentUserId` to display admin's name from `users` list
   
2. **Replace stats cards with pending alert**
   - Remove the 5 statistics Card components
   - Add simple Alert component if `pendingCount > 0`

3. **Fix `handleApproveUser` function**
   - Accept role parameter: `handleApproveUser(userId: string, role: UserRole)`
   - Pass the selected role to the RPC instead of hardcoded 'standard'

4. **Redesign user cards for pending users**
   - Show "Requested: [their requested role]" badge
   - Show role selector dropdown (default to requested role or 'standard')
   - Show inline Approve/Reject buttons (not in menu)

5. **Simplify verified user cards**
   - Keep role dropdown
   - Keep menu for Unlock Account, Edit Profile, etc.

6. **Replace stats card filtering with dropdown**
   - Add Select component for filter (All, Pending, Active, Suspended, Admins)

---

## Code Changes Summary

### `src/pages/AdminCenter.tsx`

| Section | Change |
|---------|--------|
| Header | Add "Logged in as: [name]" display |
| Stats | Remove 5 Card stats, add simple "X pending" badge/alert |
| Filter | Replace stat card clicks with single Select dropdown |
| Pending user card | Add role selector + inline Approve/Reject buttons |
| `handleApproveUser` | Accept `role` parameter, pass to RPC |
| Active user card | Keep role dropdown, simplify layout |

### Estimated Line Reduction
Current: ~490 lines
After: ~350 lines

---

## What We're Removing

- 5 separate statistic cards (replaced with badge/alert)
- Stat card click handlers for filtering
- Menu-based approve/reject (moved to inline buttons)
- Confusion about two-step approval process

## What We're Adding

- "Logged in as" header with current admin info
- Simple pending count badge
- Role selector integrated with approval workflow
- Clearer visual separation (Pending vs Active sections)

---

## Expected Result

The User Management page will:
1. Show who's logged in at a glance
2. Highlight pending approvals clearly
3. Allow one-step approval WITH role assignment
4. Feel less cluttered and more focused

