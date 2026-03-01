

## Current State of Live Grid

After reviewing the code and data, the Live Grid has three operation modes (Move Entire Part, Cover Another Part, Swap Courtrooms) but several gaps prevent it from handling the scenarios you described:

### Problems Identified

1. **No building indicator or filter**: The grid shows all rooms together. You can't quickly see which courtroom is in 100 Centre vs 111 Centre, making it hard to manage cross-building switches.

2. **Can't assign a judge to a vacant room directly**: The Move dialog only works from an occupied room. There's no way to place a new judge into an empty courtroom from the grid itself.

3. **No "Assign New Judge" action on empty rooms**: Vacant rooms show "No judge assigned" but the only action buttons are Mark Present/Absent and the Move arrow — none of which help assign someone new.

4. **Part name not shown in the room picker**: When selecting a destination room in the Move dialog, part names appear but the building doesn't, making it hard to pick the right room across buildings.

5. **No bulk operations**: If 5 judges switched courtrooms, you have to do 5 individual swaps. No way to queue up multiple changes.

### Plan

#### 1. Add building column and filter to the grid
- Show building (100 or 111) on each row via the `rooms → floors → buildings` join in `useCourtRooms`
- Add a building filter dropdown next to the existing status filter

#### 2. Add "Assign Judge" action on vacant rooms
- When a room has no assigned judge, show an "Assign Judge" button instead of presence buttons
- Opens a dialog where you pick a judge (from personnel_profiles or free text) and optionally set the part
- Calls an upsert on `court_assignments` to fill the vacant slot

#### 3. Improve the Move/Swap dialog
- Show building name next to each room in the destination picker (e.g., "1300 · 100 Centre (Part 32 · G. CARRO)")
- Group rooms by building in the dropdown for easier scanning

#### 4. Add batch mode for multiple swaps
- Add a "Batch Changes" toggle that lets you queue multiple move/swap operations
- Shows a preview list of pending changes before committing them all at once
- Each change is validated for conflicts before execution

### Files to modify

- **`src/hooks/useCourtOperationsRealtime.ts`** — Update `useCourtRooms` query to join through `rooms → floors → buildings` and return building name
- **`src/components/court/LiveCourtGrid.tsx`** — Add building column, building filter, "Assign Judge" button for vacant rooms, improve Move dialog room picker with building labels, add batch mode UI

### Technical Notes

- The building join path is: `court_rooms.room_id → rooms.id → rooms.floor_id → floors.id → floors.building_id → buildings.id`
- The swap RPC (`swap_courtrooms`) and move RPC (`move_judge`) already exist and work — no database changes needed
- Assigning a judge to a vacant room will upsert into `court_assignments` using existing patterns from `judgeManagement.ts`

