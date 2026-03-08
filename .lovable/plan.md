

# Courtroom Color + Smart Hallway Room Ordering

## Two Changes

### 1. Distinct Courtroom Color
Currently courtrooms use `#818cf8` (indigo-400) — similar to the general palette. Change to a more distinctive warm/bold color so courtrooms stand out immediately.

**File: `blueprintMaterials.ts`**
- Change `courtroom` in `TYPE_COLORS` from `#818cf8` to `#f97316` (orange-500) — warm, unmistakable, high contrast against the dark background and other blue-toned rooms.

### 2. Smart Room Ordering Along Hallways

The database already has exactly the structure needed: `hallway_adjacent_rooms` stores `position` (start/middle/end), `side` (left/right), and `sequence_order` per room. The 2D layout in `useFloorPlanData.ts` already sorts by position segment priority + sequence_order and tiles rooms sequentially. But the **3D view** doesn't use this — it gets pre-positioned objects and just renders them.

The fix is to ensure the 3D scene respects the hallway-centric layout computed in `useFloorPlanData.ts`, which already does the right thing:
- Groups rooms by hallway
- Sorts each side by position (start → middle → end) then by `sequence_order`
- Tiles them flush along the hallway spine

**The data pipeline already works.** The rooms arrive at the 3D scene with hallway-centric positions from `computeHallwayCentricLayout`. The issue is that if `sequence_order` values aren't set correctly in the database, rooms appear in arbitrary order.

**Practical improvement — File: `useFloorPlanData.ts`**
- Add a secondary sort fallback: when `sequence_order` values are equal (all 0), sort alphabetically by room_number. This way rooms like "1601, 1602, 1603" automatically line up in numeric order along the hallway without manual ordering.
- Within each position segment (start/middle/end), rooms with numeric room numbers sort numerically; others sort alphabetically.

**File: `floorPlanQueries.ts`**
- Also fetch `room_number` in the `hallway_adjacent_rooms` join so the sort has access to it. Currently only `id, hallway_id, room_id, position, side, sequence_order` are fetched — we need the room's number for smart sorting.

### Summary of File Changes

| File | Change |
|------|--------|
| `blueprintMaterials.ts` | Change courtroom color to orange `#f97316` |
| `useFloorPlanData.ts` | Add room_number-based fallback sort when sequence_order ties |
| `floorPlanQueries.ts` | Join room_number from rooms table in hallway connection query |

