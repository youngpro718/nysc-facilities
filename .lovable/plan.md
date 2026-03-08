

# Floor Plan 3D Visualization — Fix Data Display + Immersive Walkthrough

## Problem Diagnosis

The 3D view **does** have data flowing through correctly — the pipeline (`floorPlanQueries` → `useFloorPlanData` → `ModernThreeDViewer` → `NewThreeDScene` → `BlueprintFloorPlan` → `BlueprintScene` → `BlueprintRoom`) is intact. However:

1. **Many rooms have `position: {x:0, y:0}`** — they stack at origin and appear as one blob. Floors like 17th (15/18 positioned) and 16th (14/14) render properly; others like 10th and 13th have most rooms at origin.
2. **No walls between rooms** — rooms are floating transparent boxes with wireframe edges. There's no sense of "being in a building."
3. **No hallway geometry** — hallways render as the same box shape as rooms, just narrower. There are no actual corridor walls.
4. **Bird's-eye isometric only** — OrbitControls let you rotate around from above, but there's no first-person walkthrough mode.

## Research Findings

From studying R3F floor plan projects and tools like Blueprint3D, 2d-3d-converter, and Planner5D:

- **Walls are the key** — procedurally generate thin wall meshes along room boundaries to create enclosed spaces
- **First-person mode** — use `PointerLockControls` (or a simpler "walk mode" toggle) with WASD movement at eye-level height (~1.6m/16 units)
- **Dual camera modes** — keep the existing orbit/overview AND add a ground-level walkthrough toggle
- **Auto-layout for unpositioned rooms** — rooms at `{0,0}` should be auto-arranged along their hallway using `hallway_landmarks` data or a simple grid algorithm

## Plan

### 1. Auto-Layout for Unpositioned Rooms
When rooms have `position: {x:0, y:0}`, apply an automatic grid layout in `useFloorPlanData.ts` instead of stacking them. Use hallway connections (from `hallway_landmarks`) to intelligently place rooms along hallway sides. For rooms with no hallway link, arrange them in a grid with proper spacing.

**File**: `src/components/spaces/floorplan/hooks/useFloorPlanData.ts`

### 2. Add Wall Geometry to BlueprintRoom
Create a new `WallSegment` component that renders thin extruded walls (4 sides per room) instead of just wireframe boxes. This gives the feel of actual enclosed rooms with doorway openings.

**File**: `src/components/spaces/floorplan/three-d/blueprint/WallSegment.tsx` (new)
**File**: `src/components/spaces/floorplan/three-d/blueprint/BlueprintRoom.tsx` — add wall meshes around room perimeter

### 3. Render Hallways as Corridor Geometry
Transform hallway objects into proper corridor shapes — floor plane + two parallel walls, rather than a transparent box. Use the hallway's size (width = length of corridor, height = corridor width) to generate proper geometry.

**File**: `src/components/spaces/floorplan/three-d/blueprint/BlueprintHallway.tsx` (new)
**File**: `src/components/spaces/floorplan/three-d/blueprint/BlueprintScene.tsx` — render hallway-type objects with `BlueprintHallway` instead of `BlueprintRoom`

### 4. Add First-Person Walkthrough Mode
Add a toggle button in the viewer to switch between "Overview" (current orbit camera) and "Walk" mode (first-person at eye level). Walk mode uses keyboard WASD + mouse look, positioned at ground level so you feel like you're walking the hallways.

- Use `PointerLockControls` from drei for mouse look
- Implement simple WASD movement with collision avoidance
- Set camera height to ~16 units (eye level relative to 35-unit room height)
- Add a minimap overlay in walk mode showing your position on the 2D plan

**Files**:
- `src/components/spaces/floorplan/three-d/blueprint/FirstPersonControls.tsx` (new)
- `src/components/spaces/floorplan/three-d/blueprint/BlueprintScene.tsx` — toggle between OrbitControls and FirstPersonControls
- `src/components/spaces/floorplan/three-d/BlueprintFloorPlan.tsx` — pass walkMode prop
- `src/components/spaces/floorplan/components/ModernThreeDViewer.tsx` — add walk mode toggle button

### 5. Add Floor Plane with Material
Currently there's only a grid. Add an actual floor plane mesh with a subtle material (polished concrete look) so the ground feels solid in walkthrough mode.

**File**: `src/components/spaces/floorplan/three-d/blueprint/BlueprintGrid.tsx` — add a solid floor plane beneath the grid lines

### 6. Door Openings
For door objects, create visible openings/gaps in adjacent walls and render a door frame mesh, so when walking through you can see the doorways.

**File**: `src/components/spaces/floorplan/three-d/blueprint/BlueprintDoor.tsx` (new)

---

## Execution Order
1. Auto-layout (fixes the "nothing visible" issue immediately)
2. Wall geometry + hallway corridors (makes it look like a building)
3. Floor plane (grounds the scene)
4. First-person walkthrough mode (the immersive experience)
5. Door openings (polish)

## Files to Create
- `WallSegment.tsx`, `BlueprintHallway.tsx`, `BlueprintDoor.tsx`, `FirstPersonControls.tsx`

## Files to Modify
- `useFloorPlanData.ts` — auto-layout logic
- `BlueprintRoom.tsx` — wall geometry
- `BlueprintScene.tsx` — hallway/door rendering + camera mode toggle
- `BlueprintFloorPlan.tsx` — walkMode prop passthrough
- `BlueprintGrid.tsx` — solid floor plane
- `ModernThreeDViewer.tsx` — walk mode UI toggle
