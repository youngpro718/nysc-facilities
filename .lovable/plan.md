## Issue
In **Edit Slot Details** (and elsewhere a slot is edited from a Lockbox dialog), clicking the **Room** dropdown opens the picker but room rows can't be selected. Root cause: the EditSlotDialog's `ModalFrame` is raised to `z-[115]` so it sits above the parent `LockboxSlotDialog` (`z-[105]`), but `RoomSelector` uses a Radix `Popover` whose `PopoverContent` defaults to `z-50`. The popover is rendered in a portal *behind* the dialog overlay, so pointer events fall through to the dialog instead of the room list.

## Fix

1. **`src/features/keys/components/keys/lockbox/RoomSelector.tsx`**
   - Add a `zIndexClass` prop (default `z-50`) and apply it to `<PopoverContent className={...} />`.
   - Also pass `sideOffset={4}` and `collisionPadding={8}` so it stays visible on mobile.

2. **`src/features/keys/components/keys/lockbox/EditSlotDialog.tsx`**
   - Pass `zIndexClass="z-[120]"` to `<RoomSelector />` so the popover sits above the `z-[115]` edit dialog.
   - Same for the **Move to Lockbox** Radix `Select`: wrap its `SelectContent` with `className="z-[120]"` so it isn't hidden behind the dialog.

3. **`src/features/keys/components/keys/lockbox/AddSlotDialog.tsx`** — Add a `RoomSelector` here too (currently it only takes a free-text room number, which makes "add rooms… select from buildings" hard). Replace the plain `room_number` Input with `<RoomSelector zIndexClass="z-[110]" />` so newly added slots can be linked to a real room at creation time. Persist both `room_id` and `room_number` on insert.

4. **`src/features/keys/components/keys/lockbox/BulkAddChambersDialog.tsx`** — no changes needed (already links by `room_id`).

5. **Sanity audit of the editing path** while in there:
   - Confirm `EditSlotDialog` saves `room_id` and `room_number` together (it already does).
   - Confirm the parent `LockboxSlotDialog` refetches after edit success so the room badge updates (it already calls `onSuccess`).

## Out of scope
- Changing the slot list UI, lockbox CRUD, or RLS. This is a z-index / wiring fix plus enabling room linking at slot-creation time.
