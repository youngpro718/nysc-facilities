

# Hallway-Centric Layout for 3D Floor Plan

## Core Problem
The `fetchFloorPlanObjects` query returns `connections: []` — it **never fetches `hallway_adjacent_rooms`**. The 3D scene has zero relationship data, so rooms float independently with no spatial connection to hallways.

Your database already has the data needed (Floor 16 has 6 rooms linked to "Main Hallway", Floor 17 has rooms with position/side/sequence). It's just not being used.

## What Your Sketches Tell Us
Your hand-drawn layout shows exactly the target: a hallway as a vertical spine, rooms branching off left/right at specific positions along it, with a door at the entry. The "Room Connections" screenshot confirms the node-graph relationship model already exists.

## Plan

### 1. Fetch Hallway-Room Relationships
**File**: `src/components/spaces/floorplan/queries/floorPlanQueries.ts`

Add a query for `hallway_adjacent_rooms` joined with room data. Return these as `connections` (currently hardcoded to `[]`). Each connection carries `hallway_id`, `room_id`, `position` (start/middle/end), `side` (left/right), `sequence_order`.

### 2. Hallway-Centric Auto-Layout Algorithm
**File**: `src/components/spaces/floorplan/hooks/useFloorPlanData.ts`

Replace the naive grid layout with a hallway-aware algorithm:
- Place hallway at its stored position (or center if `{0,0}`)
- Determine hallway orientation from its size (width > height = horizontal, else vertical)
- Distribute connected rooms along the hallway spine:
  - `start` rooms at ~20% along length, `middle` at ~50%, `end` at ~80%
  - `left` rooms offset to one side, `right` to the other
  - `sequence_order` spaces them apart within the same segment
- Rooms with no hallway link keep the existing grid fallback

```text
         [Door]
           |
   ┌───────┼───────┐
   │    Hallway     │
   │  (vertical)    │
   ├───┐       ┌────┤  ← start
   │   │ 1703  │1709│
   ├───┘       └────┤
   │                │
   ├───┐       ┌────┤  ← middle
   │   │ 1616  │    │
   ├───┘       └────┤
   │                │
   ├───┐       ┌────┤  ← end
   │   │ 1610  │1609│
   └───┘       └────┘
```

### 3. Generate Visual Connections
**File**: `src/components/spaces/floorplan/hooks/useFloorPlanData.ts`

After layout, generate edge objects connecting each hallway to its adjacent rooms so the 3D scene renders `AnimatedConnection` lines between them. This uses the positioned coordinates of both objects.

### 4. Pass Connections Through Pipeline
**File**: `src/components/spaces/floorplan/hooks/useFloorPlanData.ts`

Currently `edges` is built from `safeSpaceData.connections` via `createEdgesFromConnections`. Update this to handle the new hallway-room connection format, or build simple `{id, source, target}` edges directly.

## Files to Edit
- `src/components/spaces/floorplan/queries/floorPlanQueries.ts` — fetch hallway_adjacent_rooms
- `src/components/spaces/floorplan/hooks/useFloorPlanData.ts` — hallway-centric layout + connection generation

## What This Achieves
- Rooms appear arranged along their hallway in both 2D and 3D views
- Connection lines show which rooms belong to which hallway
- Walking through a hallway in 3D, you see rooms on both sides
- Rooms without hallway links still get a grid layout (no data lost)

