

## Plan: Conflict-Aware Addition for Both Judges and Staff

### Problem
When adding a judge to a part that's already occupied (e.g., Part "TAP B" already has Litman), the system blindly creates a duplicate assignment row. The same risk exists for staff — assigning a sergeant to a room that already has one silently overwrites without warning. Both the Add Judge and Add Staff flows need conflict detection and user-facing warnings.

### Changes

**1. Backend: `src/services/court/judgeManagement.ts` — `addNewJudge()`**
- Before inserting a new `court_assignments` row, query for an existing assignment matching the part (case-insensitive)
- If found and occupied by another judge: **update** that row's `justice` field instead of inserting a duplicate
- Return `{ personnelId: string; displacedJudge: string | null }` so the UI knows who was replaced

**2. UI: `src/components/court/JudgeStatusManager.tsx` — `AddJudgeDialog`**
- Add a live conflict check: when the part field value changes, query `court_assignments` for a matching part
- If occupied, show an amber warning banner: "Part TAP B is currently assigned to S. LITMAN. Adding this judge will replace them."
- After successful add, if a judge was displaced, include the displaced name in the success toast

**3. Backend: `src/services/court/staffManagement.ts` — `addNewStaff()` / `assignStaffToRoom()`**
- `assignStaffToRoom` already handles clerks (appends to array) and sergeants (overwrites). The sergeant case silently replaces — add return value indicating who was displaced
- Return `{ personnelId: string; displacedStaff: string | null }` from `addNewStaff`

**4. UI: `src/components/court/AddStaffDialog.tsx`**
- Add a live conflict check: when a courtroom is selected and role is "sergeant", query the assignment for that room to see if a sergeant already exists
- If occupied, show a warning: "Room 1130 already has Sgt. Jones. Adding this sergeant will replace them."
- For clerks, show an informational note: "Room 1130 already has 2 clerks. This clerk will be added alongside them." (no conflict, just awareness)
- After successful add with displacement, include displaced name in toast

### Data Cleanup
- Delete the duplicate TAP B assignment rows from earlier testing so only one remains

### Files to Modify
1. `src/services/court/judgeManagement.ts` — upsert logic in `addNewJudge()`
2. `src/components/court/JudgeStatusManager.tsx` — live part-conflict warning in AddJudgeDialog
3. `src/services/court/staffManagement.ts` — return displaced info from `assignStaffToRoom()`
4. `src/components/court/AddStaffDialog.tsx` — live room-conflict warning for staff

