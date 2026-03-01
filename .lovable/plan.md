

## Sync Room Names from Spaces to Term Sheet

**Problem**: The Term Sheet queries `court_rooms.room_number` but ignores the custom name set in Spaces (`rooms.name`). When you rename a room to "JHO PART" in Spaces, it doesn't appear in the Term Sheet.

**Fix**: Update the Term Sheet query to join `rooms` via `room_id` and include `rooms.name`. Display the Spaces name (e.g., "JHO PART") alongside or instead of the raw room number.

### Files to modify

1. **`src/components/court-operations/personnel/TermSheetBoard.tsx`**
   - Update the `court_rooms` query to also fetch `rooms.name` via the `room_id` FK: `.select("id, room_id, room_number, courtroom_number, is_active, rooms:room_id(name)")`
   - Add `room_name` to the combined data, preferring `rooms.name` over `room_number` when available
   - Pass `room_name` through the `TermAssignment` interface so it displays in the Term Sheet

2. **`src/components/user/TermSheetPreview.tsx`**
   - Same query change: join `rooms` via `room_id` to get `rooms.name`
   - Display `room_name` in both mobile cards and desktop table rows

Both components will show the Spaces-managed name (falling back to `room_number` if no linked room exists), so renaming a courtroom in Spaces immediately updates the Term Sheet.

