## What's broken

When you open the room picker on Profile → Settings, typing in the search box (or sometimes just opening the dropdown) crashes with "Something went wrong." The crash, the toast, and the "audit room selection" concern all trace to the **same** room picker component (`RoomSelector`) used both in the lockbox screen and in **My Room** on the profile page.

### Root cause

`src/features/keys/components/keys/lockbox/RoomSelector.tsx` line 95 calls:

```text
room.room_number.toLowerCase()
```

There are **3 rooms in the database with `room_number = NULL`**. As soon as the search filter runs, `null.toLowerCase()` throws, the ErrorBoundary swallows the page, and you see "Something went wrong." Nothing actually got saved — the mutation never ran.

### Self-serve assignment flow audit (My Room → pick a room)

I checked end-to-end and the back-end side is healthy:

- `MyRoomSection` calls `RoomSelector` and on change runs a delete-then-insert against `occupant_room_assignments` scoped to `profile_id = auth.uid()`.
- RLS policies `ora_self_insert` / `ora_self_delete` already permit a signed-in user to write their own rows (`profile_id = auth.uid()`). No admin role needed.
- The insert payload (`profile_id`, `room_id`, `assignment_type='work_location'`, `is_primary=true`) matches the schema; all other columns are nullable or defaulted.
- React Query invalidates `userRoomAssignments` and `occupantAssignments` on success, so the card refreshes.

So the only thing preventing room selection from working is the null-room_number crash in the picker.

## Fix

1. **Harden `RoomSelector`** (`src/features/keys/components/keys/lockbox/RoomSelector.tsx`)
   - In the query mapping, drop rooms whose `room_number` is null/empty so they can never reach the list (they wouldn't be selectable anyway — display value is the room number).
   - Defensive `?.toLowerCase()` on every search-filter field, plus a `String(...)` coerce on `room_number`, so a future stray null can't reproduce the crash.

2. **Verify the room-selection write path still works after the fix** by re-checking the mutation flow in `MyRoomSection` against the RLS policies above. No code changes needed there.

3. **Optional follow-up (flagging only, not changing in this pass):** the 3 rooms with `room_number = NULL` are data hygiene — worth surfacing to admins later, but they're out of scope for "let me pick my room."

### Files touched

- `src/features/keys/components/keys/lockbox/RoomSelector.tsx` — null-safe filtering and list source.

No DB migrations, no other components affected. The lockbox screen continues to work the same way.
