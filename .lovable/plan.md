

# Fix Hallway Layout: Auto-Extending Spine with Side-by-Side Rooms

## The Real Problem

Looking at your actual data, the layout algorithm is broken because:

1. **Every room has `sequence_order: 0`** — so rooms on the same side at the same position stack directly on top of each other
2. **The hallway has a fixed size** (e.g. 740px wide for Floor 16) — it never grows when you add more rooms
3. **No "next to" concept** — rooms at `position: middle, side: left` all get placed at the exact same coordinate

Floor 16 example: 6 rooms, all `sequence_order: 0`, all `side: left`, split between `middle` and `end` — they're literally piled on two points.

## The Fix

Rewrite `computeHallwayCentricLayout` in `useFloorPlanData.ts` with a fundamentally different approach:

### New Algorithm: Sequential Tiling with Auto-Extend

1. **Sort rooms by position segment** (start → middle → end), then by sequence_order as a tiebreaker
2. **Tile rooms side-by-side** along the hallway — each room's width determines the next room's offset, not a fixed `SEQUENCE_SPACING`
3. **Auto-extend hallway length** — after placing all rooms, compute the total length needed and override the hallway's size so it stretches to cover everything
4. **Left/right branching** — rooms on `left` go one side, `right` the other, each side gets its own sequential tiling
5. **Gap between rooms** — small configurable gap (e.g. 10px) between adjacent rooms, representing the wall thickness

```text
Current (broken):          Fixed:
                           
  [R1][R2][R3] ← stacked    [R1]  [R2]  [R3]
  ═══════                    ═══════════════════  ← hallway auto-extends
  [R4][R5]                         [R4]  [R5]
```

### What Changes

**File: `src/components/spaces/floorplan/hooks/useFloorPlanData.ts`**
- Rewrite `computeHallwayCentricLayout`:
  - Group connections by hallway, then by side (left/right)
  - Sort each side's rooms by position segment priority (start=0, middle=1, end=2), then sequence_order
  - Place rooms sequentially: each room's X (or Y for vertical) = previous room's edge + gap
  - Offset left rooms above/left of hallway center, right rooms below/right
  - Calculate total span needed, return a hallway size override
- Return hallway size overrides alongside position overrides so the hallway visually stretches
- Update the object assembly loop to apply size overrides to hallway objects

**File: `src/components/spaces/floorplan/queries/floorPlanQueries.ts`**
- No changes needed — data fetching is already correct

### Auto-Sequence Fix

Since all `sequence_order` values are 0, the algorithm will use insertion order within each position segment as the implicit sequence. This means you don't need to manually fix the database — rooms just tile in the order they were added.

### Hallway Auto-Extend Logic

```
totalRoomSpan = sum of all room widths on the longer side + gaps
hallwayLength = max(storedLength, totalRoomSpan + padding)
```

The hallway's rendered size gets overridden to match, so it always covers all its rooms.

