

# Comprehensive Audit & Workflow Improvements

## Part 1: Fix Build Errors (Immediate)

**Error 1: `updated_at` missing from `EnhancedIssue`**
- `IssueTableView.tsx` line 143 uses `issue.updated_at` but `UserIssue` (which `EnhancedIssue` extends) doesn't have it.
- Fix: Add `updated_at?: string` to the `UserIssue` interface in `src/types/dashboard.ts`.

**Error 2: `issue_id` not in `CreateTaskDialog` schema**
- `IssueDetails.tsx` line 136 passes `issue_id` in `taskDefaults`, but `CreateTaskFormData` (from `createTaskSchema`) doesn't include it.
- Fix: Add `issue_id: z.string().optional()` to `createTaskSchema` in `CreateTaskDialog.tsx`.

---

## Part 2: Issue Completion Workflow (Clarify & Simplify)

**Current state**: The system has a "Mark Resolved" button in the admin `QuickUpdateActions` panel, but it's buried among other controls. There's no guided resolution flow -- just a raw status toggle. Users also can't easily see *how* to mark something complete.

### What we'll do:

1. **Add a prominent "Resolve Issue" action** in `IssueDetails.tsx` (the detail panel) -- a clear green button visible at the top alongside "Edit" and "Create Task". Currently only admins see "Create Task"; we'll add a "Resolve" button right next to it.

2. **Resolution dialog**: When clicking "Resolve", show a small dialog asking:
   - Resolution type (Fixed, Replaced, Maintenance Performed, No Action Needed, Deferred)
   - Short resolution note (optional)
   - This updates `status` to `resolved`, `resolution_type`, `resolution_notes`, and `resolution_date`.

3. **Visual completion indicator**: On the issue card/list, show a green checkmark banner when resolved, with the resolution date and type visible at a glance.

---

## Part 3: Issue Reporting -- Better Structure & Categories

**Current state**: The `SimpleReportWizard` has 5 categories (Electrical, Plumbing, Climate, Cleaning, Other). This is clean but missing common facility categories.

### What we'll add:

4. **Expand categories** to include:
   - **Structural** (walls, ceilings, doors, plastering, painting) -- maps to a new `STRUCTURAL_REPAIR` type
   - **Furniture** (desks, chairs, shelving) -- maps to `FURNITURE_REPAIR`
   - Keep existing 5, making it 7 total (still fits in a horizontal chip layout)

5. **Auto-title generation**: When user selects a category and room, auto-generate a descriptive title like "Plumbing Issue - Room 301" so reports are consistently named.

---

## Part 4: Room-Level Planning & Scheduling

**Current state**: There's no easy way to see "what's planned for this room" or schedule work. Tasks can be linked to rooms via `to_room_id`, but there's no room-centric view of upcoming work.

### What we'll build:

6. **Room Activity Summary** on the room card back (`CardBack.tsx`):
   - A "Planned Work" section showing active tasks linked to this room (from `staff_tasks` where `to_room_id = room.id`)
   - Active issues for this room (from `issues` where `room_id = room.id` and status != 'resolved')
   - A "Schedule Work" button that opens `CreateTaskDialog` pre-filled with this room

7. **Quick schedule from issue**: When viewing an issue tied to a room, a "Schedule Work" button creates a task with:
   - Title pre-filled from issue
   - Room pre-selected
   - Due date field prominent
   - Notes field for "vendor coming on X date" type entries

---

## Part 5: Lockbox / Key System UX Review

**Current state**: The lockbox system has 12 component files. The checkout flow requires clicking a slot, entering a name, then clicking "Check Out". It's functional but:
- The slot dialog shows "in_box" / "checked_out" raw status text
- "Mark Missing" is always visible alongside Check In/Out (could be confusing)

### Simplifications:

8. **Clean up slot dialog labels**: Replace raw status with human-readable text ("Available" / "Checked Out" / "Missing"). Move "Mark Missing" into a secondary/overflow action so the primary actions are just "Check Out" or "Return Key".

9. **Lockbox grid visual polish**: The `LockboxSlotCard` should use color-coded backgrounds (green = available, orange = checked out, red = missing) so captains can scan at a glance without reading text.

---

## Summary of Files to Change

| File | Change |
|------|--------|
| `src/types/dashboard.ts` | Add `updated_at` to `UserIssue` |
| `src/features/tasks/components/CreateTaskDialog.tsx` | Add `issue_id` to schema |
| `src/features/issues/components/issues/details/IssueDetails.tsx` | Add Resolve button + dialog |
| `src/features/issues/components/issues/wizard/constants/simpleCategories.ts` | Add Structural & Furniture categories |
| `src/features/issues/components/issues/wizard/SimpleReportWizard.tsx` | Auto-title generation |
| `src/features/spaces/components/spaces/rooms/components/CardBack.tsx` | Room planned work section |
| `src/features/keys/components/keys/lockbox/LockboxSlotDialog.tsx` | Clean up labels, secondary "Missing" |
| `src/features/keys/components/keys/lockbox/LockboxSlotCard.tsx` | Color-coded slot backgrounds |

