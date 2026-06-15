## 1. Trim user settings — remove Display, Security, Accessibility

`src/features/profile/components/profile/EnhancedUserSettings.tsx`

- Drop the **Display**, **Security**, and **Accessibility** tabs and their `TabsTrigger`/`TabsContent` blocks, plus the `DisplayTab`, `SecurityTab`, and `AccessibilityTab` components and their related defaults in the settings state.
- Collapse the tab bar to **Notifications only**. If Notifications is the only remaining group, render it directly (no `Tabs` wrapper) so the page is a single clean card.
- Remove the now-unused `Palette`, `Lock`, `Shield`, `Accessibility` icon imports and any helpers only those tabs used.

No DB changes — these were client-side preference toggles only.

## 2. Lockbox slots: room link wins over stored label

User intent: the slot's stored `label` becomes meaningless when the room/judge changes. Whatever the room is currently called in the system (e.g. "Room 1000 — Clerk's Office") is the source of truth.

**Scope:** lockbox slot UI only. Keys inventory list is left alone.

### Display rule (read side)
When a slot has `room_id` (or resolvable `room_number`):
- **Primary line:** the live room identity, formatted `Room {room_number} — {room.name}` (omit the dash if no name).
- Hide `slot.label` entirely — do not render it as a subtitle.
- If the room link is missing/broken (deleted room), fall back to `slot.label` and mark it muted/italic as "Unlinked".
- If no room is linked at all, show `slot.label` as today and the existing "No room" hint.

Files to update:
- `src/features/keys/components/keys/lockbox/LockboxSlotCard.tsx` — swap the `<h4>{slot.label}</h4>` block for the resolved room title; remove the redundant secondary `Room {room_number}` line when the primary already shows it.
- `src/features/keys/components/keys/mobile/MobileKeyManagement.tsx` — same substitution wherever a slot row renders `slot.label`.
- `EditSlotDialog.tsx` / `AddSlotDialog.tsx` / `LockboxSlotCard` detail surfaces — show the resolved room title as the dialog heading; keep a small "Internal label" field admins can still edit but mark it as not shown to staff.
- Any other slot list (kiosk view if present) — sweep with `rg "slot\\.label"` and apply the same rule.

### Data fetch
Slots already carry `room_id` and `room_number`. Extend the slot fetch (likely in `useLockboxSlots`/equivalent — confirm during build) to join `rooms` and select `rooms.name, rooms.room_number`. The resolved title is computed in a small helper `getSlotDisplayTitle(slot)` reused by every surface above, so the rule lives in one place.

### Automatic freshness
Because the title is derived from the live `rooms` row at fetch time, any room rename in Spaces immediately reflects on slots — no migration, no cron, no stored copy to drift.

### Out of scope (per user)
- Key inventory table, key detail panel, assignments table — unchanged.
- No edits to `keys.name`.
- No new "current occupant" lookup; the user clarified the room's own stored name is the authority.

## Technical notes

- No DB migration. Pure read-side rendering change plus a join in the slot query.
- Keep `slot.label` writable in the edit dialog so admins retain an internal note, but it stops being a user-facing identifier for linked slots.
- Add a one-line helper + unit-style sanity check by spot-checking a slot with a renamed room in the preview after the change.
