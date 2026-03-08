

# Floor Plan Tab Redesign — Compact, Editor-Style Layout

## Research Findings

From studying Figma, Miro, and professional floor plan tools (Flexopus, GoPlanogram, react-planner), the universal patterns are:

- **Maximize canvas space** — toolbars are thin (32-40px), floating, and icon-only with tooltips
- **Single compact top bar** — floor selector is a simple dropdown (not a decorative card), view mode toggle is small pill buttons
- **Floating toolbar clusters** — zoom, view toggles, and filters sit as small floating pill groups over the canvas (not above it)
- **Collapsible side panel** — properties panel slides in/out, narrower (280-320px), not always visible
- **Filters as small chips/toggles** — not full-size buttons; often a segmented control
- **No duplicate info** — the floating info card AND the floor selector both show building/floor name redundantly

## Current Problems

1. **Header is ~120px tall** — FloorSelector card (48px) + view mode tabs + ViewControls + filter row + attach mode = massive toolbar eating canvas
2. **FloorSelector renders a decorative gradient card + a separate 220px dropdown** — redundant, oversized
3. **Filter buttons are full `<Button size="sm">`** — too large for a toolbar
4. **Floating info card** overlaps ReactFlow's built-in panel/controls
5. **Properties panel is `w-96` (384px)** — too wide for a side panel
6. **Canvas wrapper has `px-6 pb-6 gap-6`** — wastes space around the canvas
7. **Attach mode controls sprawl inline** in the filter row
8. **"Add Hallways" button** in FloorPlanCanvas is a separate toolbar that overlaps the floating info card
9. **ViewControls returns null on mobile** — mobile users get zero controls

## Plan

### 1. Compact Single-Row Top Bar
Replace the current multi-row header with a single 40px-tall bar:
- **Left**: Simple floor dropdown (no decorative card) + 2D/3D toggle as tiny pill
- **Right**: Compact icon-only ViewControls (already close, just move inline)
- Remove the separate filter row; move filters into a small segmented control within the bar
- Move attach mode into a popover triggered by a single toolbar icon

**File**: `ModernFloorPlanView.tsx` — restructure the header `div` from lines 408-553 into one slim row

### 2. Simplify FloorSelector
Replace the desktop version's gradient card + separate Select with a single compact `Select` dropdown showing "Building — Floor N". Remove the decorative card entirely.

**File**: `FloorSelector.tsx` — rewrite desktop return (lines 102-151)

### 3. Move Filters to Compact Segmented Control
Replace 4 full `<Button>` elements with a small `ToggleGroup` or segmented control using tiny text/icons. Place inside the top bar.

**File**: `ModernFloorPlanView.tsx` — replace lines 468-552

### 4. Floating Zoom Controls on Canvas
Move zoom controls to a small floating pill at bottom-center of the canvas (like Figma's bottom bar), instead of in the header. Make ViewControls render a compact floating bar on mobile too (just zoom + fullscreen).

**File**: `ViewControls.tsx` — remove the mobile `return null`, render a minimal floating bar
**File**: `ModernFloorPlanView.tsx` — move ViewControls inside the canvas container as an overlay

### 5. Narrow Properties Panel + Collapse Button
Reduce from `w-96` (384px) to `w-72` (288px). Add a collapse/expand toggle button on the panel edge.

**File**: `ModernFloorPlanView.tsx` — change line 614 from `w-96` to `w-72`

### 6. Remove Redundant Floating Info Card
The floor selector already shows building + floor name. Remove the floating info card (lines 597-607) to free canvas space and avoid overlap with ReactFlow controls.

**File**: `ModernFloorPlanView.tsx` — remove lines 597-607

### 7. Remove "Add Hallways" Toolbar from Canvas
Move the "Add Hallways" action into the attach mode popover or a context menu, removing the always-visible toolbar overlay from `FloorPlanCanvas.tsx`.

**File**: `FloorPlanCanvas.tsx` — remove the toolbar div (lines ~175-220)

### 8. Reduce Canvas Padding
Change `gap-6 px-6 pb-6` on the main content area to `gap-2 px-2 pb-2` to give the canvas maximum room.

**File**: `ModernFloorPlanView.tsx` — line 556

---

## Files to Edit
- `src/components/spaces/floorplan/ModernFloorPlanView.tsx` — main layout restructure
- `src/components/spaces/floorplan/components/FloorSelector.tsx` — compact dropdown
- `src/components/spaces/floorplan/components/ViewControls.tsx` — floating + mobile support
- `src/components/spaces/floorplan/FloorPlanCanvas.tsx` — remove inline toolbar

