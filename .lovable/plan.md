

## Problem

The current Live Grid has three operation types, but none handle your scenario:

- **Move**: Only targets **empty** rooms (occupied rooms are hidden from the picker)
- **Swap**: Exchanges two rooms symmetrically (A↔B), but your changes aren't symmetric
- **Cover**: Temporary — not a permanent reassignment

Your scenario requires **independent reassignments**: Part 77 → Room X, Part 95 → Room Y, Part 66 → Room 1600 — each judge goes to a specific room regardless of who's currently there.

## Plan: Add "Reassign" Operation Type

### 1. Show all rooms in the destination picker (not just empty ones)
Currently line 612 hides occupied rooms in move mode. Remove that filter so you can pick **any** room as a destination.

### 2. Add a 4th operation type: "Reassign to Room"
This directly updates `court_assignments` to place the selected judge into the target room. If someone is already there, they get displaced (unassigned from that room). Unlike "Move" which calls `move_judge` RPC, this does a direct assignment update — simpler and more flexible.

### 3. Batch workflow for your scenario
With batch mode ON, you'd queue:
- Reassign Part 77's judge → Room where 95 currently is
- Reassign Part 95's judge → wherever they're going
- Reassign Part 66's judge → Room 1600

Then hit "Apply All" — all changes execute in sequence.

### Files to modify

**`src/components/court/LiveCourtGrid.tsx`**:
- Remove the occupied-room filter from the destination picker (line 612)
- Add "Reassign" as a 4th radio option in the operation type selector
- Implement reassign logic: upsert the judge into the target room's `court_assignments`, and clear them from their source room
- Show a warning when targeting an occupied room ("This will displace Judge X")

### Technical Details

The reassign handler will:
1. Update `court_assignments` for the **destination** room with the new judge/part
2. Clear the judge from the **source** room's assignment
3. Invalidate all court queries for real-time sync

No new RPCs or database changes needed — this uses existing `court_assignments` upserts.

