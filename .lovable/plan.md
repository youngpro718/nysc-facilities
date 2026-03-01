

## Problem

Room 1600 (Part 1, J. SVETKEY) shows a "Maintenance" badge in the assignment table because there is a **scheduled shutdown** record in the `room_shutdowns` table (id: `b35834b0-ff6b-4fb2-8c48-1d0c25975510`, reason: "Emergency", status: "scheduled"). This is not an "issue" from the `issues` table — it's a shutdown entry, which is why the user can't find or resolve it from the Issues page.

The `maintenanceSet` in `EnhancedCourtAssignmentTable.tsx` pulls all shutdowns with status `in_progress` or `scheduled` and marks those rooms with a red "Maintenance" badge. There's currently no UI to view, manage, or dismiss these shutdown records from the Assignments page.

## Plan

### 1. Delete the stale shutdown record (data cleanup)
Run a SQL migration to delete the orphan shutdown record:
```sql
DELETE FROM room_shutdowns WHERE id = 'b35834b0-ff6b-4fb2-8c48-1d0c25975510';
```
This immediately clears the phantom maintenance badge from Room 1600.

### 2. Add shutdown visibility to the Assignment Detail Panel (`src/components/court/AssignmentDetailPanel.tsx`)
When `hasMaintenance` is true, show the shutdown details (reason, status) and a "Clear Shutdown" button so users can resolve these directly from the assignments view instead of hunting through other pages.

- Query `room_shutdowns` for the selected room's `court_room_id` when `hasMaintenance` is true
- Display reason and status
- Add a "Clear Shutdown" button that updates the shutdown status to `completed` (or deletes it)
- Invalidate `room-shutdowns-active` query on success

### Files to modify
1. **Database** — delete the stale shutdown row
2. `src/components/court/AssignmentDetailPanel.tsx` — add shutdown details display and clear action

