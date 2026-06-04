## Goal
Make it fast to provision a lockbox with all chambers keys in one shot — auto-creating one slot per chamber room, linked to the room, with a per-slot key quantity.

## UX

In the Lockbox view, add a new button **"Bulk Add Chambers"** next to the existing "Add Key Slot" / "Create Lockbox" actions.

It opens a dialog: **Add Chambers to Lockbox**

- Target lockbox: defaults to currently selected lockbox; dropdown to switch (or "Create new lockbox…" inline).
- Filter row: search box + building/floor filter.
- List of all rooms where `room_type = 'chamber'`, each row showing:
  - Checkbox (selected by default)
  - Room number + name + building/floor
  - "Already in this lockbox" badge if a slot already links to that room (checkbox disabled)
  - Quantity input (number, default 1, min 1, max 10) — how many physical keys for that chamber
  - Optional label override (defaults to `Chambers <room_number>`)
- Footer: "Default quantity for all" quick-set + Select all / Clear + primary button **Add N slots**.

Submitting creates one `lockbox_slots` row per selected chamber:
- `lockbox_id` = target
- `slot_number` = continues from current max slot number in that lockbox
- `label` = override or `Chambers <room_number>`
- `room_id`, `room_number` from the room
- `quantity` = per-row value
- `status` = `in_box`

Also writes a `lockbox_activity_logs` entry per slot (`action: 'status_change'`, note: `Bulk-added chambers key (qty N)`).

Success toast: `Added N chambers to <lockbox name>`. List refreshes.

## Technical

New files:
- `src/features/keys/components/keys/lockbox/BulkAddChambersDialog.tsx` — the dialog described above. Uses `ModalFrame`, `useQuery` to load chamber rooms (`rooms` join `floors`→`buildings` for display) and existing slots for the target lockbox (to mark/disable duplicates). Batches inserts with a single `supabase.from('lockbox_slots').insert([...]).select()` then a second insert into `lockbox_activity_logs`. Invalidates the `lockboxes` and slots queries on success.

Edited files:
- `src/features/keys/components/keys/lockbox/LockboxView.tsx` — add a "Bulk Add Chambers" button (shown only when a lockbox is selected) and wire it to the new dialog, passing `lockboxId`, `lockboxName`, current `slots.length` (for starting slot_number) and `onSuccess` that calls `fetchSlots()` + `refetchLockboxes()`.

No DB schema changes — `lockbox_slots` already has `room_id`, `room_number`, `quantity`, `label`, `slot_number`, `status`. RLS already allows authenticated inserts (same path the existing AddSlotDialog uses).

## Out of scope
- Robing rooms / other room types (can be added later by generalizing the dialog to take a room_type filter).
- Editing key quantities after bulk add — already supported by the existing EditSlotDialog.
