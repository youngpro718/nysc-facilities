

## Fix: Room Name in Spaces = Part Name on Term Sheet

I now understand: the room name you set in Spaces (e.g., "JHO PART") **is** the part name. They're the same thing. So `rooms.name` should drive the **Part** column, not the Room column.

### What I'll change

**`src/components/court-operations/personnel/TermSheetBoard.tsx`** (lines 134-135)
- Revert `room_number` back to: `room.room_number || room.courtroom_number || '—'`
- Change `part` to: `room.rooms?.name || assignment.part || '—'`

**`src/components/user/TermSheetPreview.tsx`** (lines 84-85)
- Same revert and swap: room numbers stay, part uses `rooms.name`

The `rooms:room_id(name)` join stays — we just point it at the right column.

