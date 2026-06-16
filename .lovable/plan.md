# Lockbox: support top/bottom locks and sub-room keys

## Goal
A single room (e.g. 1416 MDC) can need several physical keys: top lock, bottom lock, a main-door key, and keys for inner sub-rooms. Today every key is just a free-text label, so they're easy to mix up and impossible to filter. We'll keep today's "one slot = one key" model but add structured fields so each slot clearly says **what** key it is and **which** part of the room it opens.

## What changes for you

1. **New "Key Role" field on every slot** with these options:
   - Main Door
   - Top Lock
   - Bottom Lock
   - Sub-Room  *(reveals a "Sub-room name" text field, e.g. "Treatment Office")*
   - Other  *(reveals a free-text "Describe" field)*

2. **Room link stays the same.** A slot still points to the parent Room (1416 MDC). The role tells you which lock on that room.

3. **Auto-label.** When you pick a room + role, the label auto-fills: "Room 1416 MDC — Top Lock", "Room 1416 MDC — Sub-Room: Treatment Office". You can still edit it.

4. **Visual tags on each slot card.** A small colored chip next to the room name:
   - 🟦 Top Lock / Bottom Lock
   - 🟪 Sub-Room: *name*
   - 🟩 Main Door
   - ⬜ Other
   This makes a flat list still scannable when one room has 3–4 slots.

5. **Search & filter.** The lockbox search will match the role and sub-room name, so typing "treatment" finds the sub-room slot and "top lock" filters across the whole box.

6. **Print sheet.** The printed lockbox reference will show the role chip next to each slot.

## Sub-rooms
You said sub-rooms are mixed — some exist in Spaces, some don't. To avoid blocking you on cleaning that up, this plan does **not** require sub-rooms to exist as their own Room records. The "Sub-Room" role just stores a name string on the slot. Later, if you want, we can do a separate pass to link those strings to real sub-room records in Spaces.

## Migration / backfill
- Add two nullable columns to `lockbox_slots`: `key_role` (enum: main_door, top_lock, bottom_lock, sub_room, other) and `sub_room_label` (text).
- Existing slots stay as-is with `key_role = null` and render as "Unspecified" (no chip) until you edit them. Nothing breaks.
- A best-effort backfill scans existing labels for "top lock" / "bottom lock" / "main" and pre-fills the role so you don't have to re-tag everything by hand. You can correct anything wrong.

## Technical details
- DB migration: add columns + enum, index on `(lockbox_id, room_id, key_role)`, RLS unchanged.
- Files touched: `LockboxTypes.ts`, `AddSlotDialog.tsx`, `EditSlotDialog.tsx`, `LockboxSlotCard.tsx`, `LockboxSlotDialog.tsx`, `LockboxSearch.tsx`, `PrintLockboxReference.tsx`, `BulkAddChambersDialog.tsx` (default role = Main Door for chambers).
- `getSlotDisplayTitle` extended to append the role suffix when present.
- No change to status, checkout flow, or activity logs.

## Out of scope (ask separately if wanted)
- Promoting sub-rooms into real Room records in Spaces.
- Multiple keys grouped under one parent slot (the "parent + child entries" model).
- Linking slots to specific `doors` rows.
