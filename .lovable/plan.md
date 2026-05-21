## 1. Fix Keys edit (desktop) — ⋯ menu in slot popup does nothing

**Root cause:** the previous patch added `onOpenChange(false)` before opening EditSlotDialog. On desktop, closing the parent `ModalFrame` unmounts the EditSlotDialog instance (it's a child of the parent), so `setEditDialogOpen(true)` fires against a torn-down tree and nothing renders. Mobile worked because the drawer keeps children mounted longer.

**Fix (LockboxSlotDialog.tsx):**
- Stop closing the parent on Edit click. Just open EditSlotDialog directly: `onClick={() => setEditDialogOpen(true)}`.
- Render `<EditSlotDialog>` as a sibling using a portal-safe pattern (it already uses Radix Dialog → portals to body, so z-index `z-[70]` on its content + `onCloseAutoFocus={e => e.preventDefault()}` is enough).
- Add `modal={false}` on the inner DropdownMenu OR ensure pointer-events aren't locked by Radix when the second dialog mounts on top.
- Verify Mark Missing still works (it relies on parent closing after action — keep that path unchanged).

## 2. Remove "Access & Assignments" page

- Delete the route in `src/App.tsx` (`access-assignments`) and any lazy import.
- Remove the nav entry in `src/components/layout/config/navigation.tsx` (line 73) and from the two role-permission arrays (lines 274, 290).
- Remove the page file(s) under `src/features/access` (or wherever the route element lives) and any dashboard links/cards that point to `/access-assignments`.
- Search-and-clean `rg "access-assignments"` to catch stray references (mobile nav, quick actions, etc.).
- Keep the underlying tables/RLS untouched (occupant_room_assignments etc. still power room occupants); only the standalone page is removed.

## 3. Room history & at-a-glance card status

**Goal:** replace the static "All clear" with a real, practical snapshot driven by Building Issues, focused on *big and prolonged* problems.

### Data sources (already in DB)
- `issues` table filtered by `room_id` — status (open/in_progress/resolved), priority, created_at, resolved_at, photos, notes.
- Derive "prolonged" = open or in_progress AND `now() - created_at > 7 days`.
- Derive "major" = priority in ('high','urgent') OR prolonged.

### Room card (front) — replace "All clear" block
Show a compact health line:

```text
[●] Attention  ·  2 open  ·  1 prolonged (14d)  ·  last activity 2d ago
```

Rules:
- **Critical** (red dot): any urgent open issue, or 2+ prolonged.
- **Attention** (amber): any open issue or 1 prolonged.
- **Good** (green): no open issues in the last 30 days.
- One-liner of the most recent event (e.g. "Leak reported · 2d ago") underneath.

### Room detail — new "History" tab
A single chronological timeline (reusing existing `RoomHistoryTimeline.tsx`) with:
- Issues opened / status changed / resolved (with photo thumbnail + note preview).
- A pinned "Ongoing concerns" section at top listing prolonged or recurring issues (same title reported 2+ times in 90 days) so they don't get buried.
- Filter chips: All · Open · Resolved · Major only.
- Empty state explains how to log an issue (deep-link to Building Issues → New, pre-filled with this room).

### Recording issues from the room
- Add a primary "Report Issue" button on the room detail header that opens the Building Issues create dialog pre-scoped to this room (no page jump).
- After save, optimistically prepend the event to the timeline.

### Files likely touched
- `src/features/spaces/components/spaces/rooms/cards/RoomDetails.tsx` (status block)
- `src/features/spaces/components/spaces/rooms/RoomCard.tsx` / `MobileRoomCard.tsx` (front summary)
- `src/features/spaces/components/spaces/rooms/components/history/RoomHistoryTimeline.tsx` (group + pin prolonged)
- New small hook `useRoomHealth(roomId)` returning `{ status, openCount, prolongedCount, lastEvent }`.

## Out of scope
- No schema changes; everything derives from `issues` + existing room data.
- No changes to Building Issues module itself beyond the deep-link prefill.

Approve and I'll implement in this order: (1) slot menu fix → (2) remove Access & Assignments → (3) room health + history upgrades.
