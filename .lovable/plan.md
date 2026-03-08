

# Room Arrangement & Alignment Tools for 2D Editor

## Current State
- Rooms are draggable with snap-to-grid (10px) and auto-save to DB on drag stop
- BulkPositionTool handles mass layout of unpositioned rooms
- No way to align selected rooms relative to each other or distribute them evenly

## Plan

### 1. Multi-Select Alignment Toolbar
**New file**: `src/components/spaces/floorplan/components/AlignmentToolbar.tsx`

A floating toolbar that appears when 2+ nodes are selected in ReactFlow. Provides:
- **Align**: Left, Right, Top, Bottom, Center-H, Center-V (aligns selected rooms to a shared edge/center)
- **Distribute**: Even horizontal spacing, Even vertical spacing (distributes rooms evenly between outermost positions)
- **Stack**: Tile selected rooms in a row or column with configurable gap

Each action computes new positions from the selected nodes' current positions/sizes, updates ReactFlow nodes, and triggers the existing debounced DB save via `useFloorPlanNodes`.

### 2. Track Selection State
**Edit**: `src/components/spaces/floorplan/FloorPlanCanvas.tsx`

- Add `onSelectionChange` callback to ReactFlow to track which nodes are currently selected
- Pass selected node IDs up so the AlignmentToolbar knows what to operate on
- Expose `setNodes` to the toolbar so it can apply position changes

### 3. Wire Toolbar into FloorPlanFlow
**Edit**: `src/components/spaces/floorplan/components/FloorPlanFlow.tsx`

- Add `onSelectionChange` prop to ReactFlow
- Render `AlignmentToolbar` as a ReactFlow `<Panel>` at bottom-center when 2+ nodes selected
- The toolbar calls `setNodes` to update positions, which triggers `onNodesChange` → DB save

### 4. Snap-to-Neighbor Enhancement
**Edit**: `src/components/spaces/floorplan/components/FloorPlanFlow.tsx`

- Add `onNodeDrag` handler that checks proximity to other nodes' edges
- When within 15px of another node's edge, snap the dragged node's edge to align
- Visual guide lines (temporary edges) shown during drag for alignment feedback

## Files Summary
- **Create**: `src/components/spaces/floorplan/components/AlignmentToolbar.tsx` — alignment/distribute/stack UI + logic
- **Edit**: `src/components/spaces/floorplan/components/FloorPlanFlow.tsx` — selection tracking, render toolbar, snap-to-neighbor
- **Edit**: `src/components/spaces/floorplan/FloorPlanCanvas.tsx` — pass selection state through

