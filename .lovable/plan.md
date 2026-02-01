
# Simplify Room Assignment Workflow

## Overview
This plan addresses three key improvements to make room assignments easier:
1. **Admin side**: Add direct room assignment from the Access & Assignments page
2. **User side**: Let users request room assignments from their Settings
3. **Issue reporting**: Users can quickly select from their assigned ("favorited") rooms

---

## Part 1: Admin Room Assignment from Access & Assignments

### Current Problem
The `/access-assignments` page shows personnel cards with room counts, but clicking a card does nothing. Admins must navigate to a separate Room Assignments page to make changes.

### Solution
Add a "Manage" action when clicking a personnel card that opens a simple assignment dialog.

### Changes

**1. Create `PersonnelQuickAssignDialog.tsx`**
A new dialog component that appears when admin clicks a personnel card:
- Shows the person's name and current assignments
- "Add Room" button with room selector dropdown
- Toggle to set as "Primary" room
- Quick remove buttons for existing assignments
- Single-click workflow: Select room → Check "Primary" → Done

**2. Update `AccessAssignments.tsx`**
- Add `onClick` handler to `PersonnelCard` 
- Open `PersonnelQuickAssignDialog` with selected person's data
- Add visual affordance (cursor pointer, hover effect) to indicate cards are clickable

**3. Update `PersonnelCard` component**
- Add subtle "Manage" button or make card itself clickable
- Show visual feedback on hover

### User Flow (Admin)
```
1. Go to Access & Assignments
2. Click on "John Smith" card
3. Dialog opens showing:
   - Current rooms: Room 1300 (Primary), Room 1205
   - "Add Room" dropdown
4. Select "Room 1400" → Check "Primary" → Click "Add"
5. Room 1400 becomes primary, Room 1300 becomes secondary
6. Done
```

---

## Part 2: User Self-Service Room Request

### Current Problem
Users can only request a room during the issue reporting flow, which is confusing. The message "Room assignment request submitted! You can continue reporting the issue." appears mid-flow.

### Solution
Add a "My Room" section to the Settings page where users can:
- See their current room assignments
- Request a room assignment (if none)
- Request a change to their primary room

### Changes

**1. Create `MyRoomSection.tsx`**
New component for the Settings page:
- Shows current room assignments with "Primary" badge
- If no assignments: "Request Room Assignment" button
- If has assignments: "Request Change" button for switching primary
- Status indicators for pending requests

**2. Update `EnhancedUserSettings.tsx`**
- Add new "My Room" section at the top (before Notifications)
- Uses `useOccupantAssignments` hook to show current state
- Request button creates a `staff_task` with type "room_assignment_request"

**3. Remove redundant request from `SimpleReportWizard.tsx`**
- Keep the "No assigned room" state but change the messaging
- Instead of inline request, show: "Go to Settings to request a room"
- Link directly to `/profile?tab=settings`

### User Flow (Standard User)
```
1. Go to Profile → Settings
2. See "My Room" section at top:
   - "You have no room assigned"
   - [Request Room Assignment] button
3. Click button → Confirmation toast
4. Admin approves → User gets notification
5. Room appears in "My Room" section
```

---

## Part 3: Improved Issue Reporting with Room Favorites

### Current State (Already Good)
The SimpleReportWizard already:
- Shows user's assigned rooms
- Auto-selects primary room
- Allows selecting other assigned rooms

### Minor Enhancement
- Add visual "star" or "primary" indicator on the primary room
- Improve the room card design to show building/floor info more clearly
- No major changes needed - this flow already works well

---

## Technical Details

### Database
No schema changes needed. The existing `occupant_room_assignments` table and `staff_tasks` table handle all requirements.

### New Files
| File | Purpose |
|------|---------|
| `src/components/access-assignments/PersonnelQuickAssignDialog.tsx` | Dialog for quick room assignment from personnel card |
| `src/components/profile/MyRoomSection.tsx` | User's room assignments in settings |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/AccessAssignments.tsx` | Add click handler to personnel cards, import dialog |
| `src/components/profile/EnhancedUserSettings.tsx` | Add MyRoomSection to settings tabs |
| `src/components/issues/wizard/SimpleReportWizard.tsx` | Update no-room message, remove inline request |

### Hooks Used
- `useOccupantAssignments` - Get user's current assignments
- `usePersonnelAccess` - Get personnel list (admin view)
- Existing `useRoomAssignment` hook for creating assignments

---

## Summary

| Who | What They Can Do | Where |
|-----|-----------------|-------|
| Admin | Click personnel card → Assign room | /access-assignments |
| User | See assigned rooms, request changes | /profile → Settings |
| User | Select from assigned rooms when reporting | Issue Report dialog |

This makes the workflow:
- **Simpler**: Admin clicks card, picks room, done
- **Self-service**: Users manage room requests from one place (Settings)
- **Cleaner**: Issue reporting stays focused on reporting issues
