

## Three Issues Identified

### Issue 1: Room 1306 is "Inactive" (blue) with no way to reactivate
Room 1306 has `is_active = false` in `court_rooms`. The UI shows it with a blue "Inactive" badge but provides no toggle to change it back to active.

**Fix**: Add an "Activate Room" / "Deactivate Room" toggle button to the `AssignmentDetailPanel` when a room is inactive (or active). This will update `court_rooms.is_active` and invalidate the assignments query.

### Issue 2: 18 assignment notifications but no way to see which ones
The badge count comes from `useCourtOperationsCounts` which sums up assignments missing a judge, clerks, or sergeant. But in the assignments table, there's no visual filter or indicator to jump to those specific incomplete assignments.

**Fix**: Add a filter option to the `EnhancedCourtAssignmentTable` (e.g., a "Show needs attention" toggle or filter chip) that filters to only show assignments with missing staff. Also show the breakdown tooltip on the badge itself.

### Issue 3: Room name changes in Spaces don't sync to Court Operations
The assignment table uses `room_number` from `court_rooms`, and the room name from `rooms.name` (which the user edited to "JHO PART") is never displayed in the assignments view. The `court_rooms` and `court_assignments` tables store their own `room_number` independently from the `rooms` table `name` field.

**Fix**: Include the `rooms.name` in the court assignments query (via the `room_id` FK on `court_rooms`) and display it alongside or instead of the static `room_number`. This way, when a user updates a room name in Spaces, it's reflected in Court Operations.

## Plan

### 1. Add activate/deactivate toggle to AssignmentDetailPanel
- In `AssignmentDetailPanel.tsx`, add a button that toggles `court_rooms.is_active` for the selected room
- Show "Activate" when inactive, "Deactivate" when active
- On success, invalidate `court-assignments-enhanced` query

### 2. Add "Needs Attention" filter to assignment table
- In `EnhancedCourtAssignmentTable.tsx`, add a filter button/chip near the search bar: "Needs Attention (18)"
- When active, filter to only show rows where justice, clerks, or sergeant is missing
- This makes the 18 notifications actionable

### 3. Sync room name from Spaces into assignments view
- Modify the query in `EnhancedCourtAssignmentTable.tsx` to join `rooms` via the `room_id` FK on `court_rooms` and fetch `rooms.name`
- Add `room_name` to the `CourtAssignmentRow` interface
- Display `room_name` in the table row (e.g., below room number) and in `AssignmentDetailPanel`
- This ensures name changes made in Spaces are immediately visible in Court Operations

### Files to modify
1. `src/components/court/AssignmentDetailPanel.tsx` — add activate/deactivate toggle + display room name
2. `src/components/court/EnhancedCourtAssignmentTable.tsx` — join rooms.name in query, add "Needs Attention" filter, pass room_name to rows
3. `src/components/court/AssignmentListItem.tsx` — display room_name if available

