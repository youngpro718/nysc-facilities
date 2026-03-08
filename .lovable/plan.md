

# Hallway Attachment Controls in the 3D Selected Object Panel

## Current State

The attach mode already exists in `ModernFloorPlanView.tsx` — it's a toolbar popover where you toggle attach mode ON, pick a side (N/S/E/W), then click a hallway followed by a room. This works for both 2D and 3D since the same `handleObjectSelect` callback processes clicks from either viewer.

However, the 3D viewer's own **Selected Object Info Panel** (lines 653-727 in `ThreeDViewer.tsx`) only shows read-only properties and two stub buttons ("View Details" / "Edit"). It has no hallway attachment UI.

The user wants: when clicking a room or hallway in 3D, see contextual controls to attach rooms to hallways with proper positioning.

## Plan

### 1. Add Hallway Attachment Panel to 3D Selected Object Info (ThreeDViewer.tsx)

When a **hallway** is selected in the 3D view, show:
- "Attach Room" button that enters attach mode — next room click attaches it to this hallway
- Side selector (N/S/E/W)
- List of currently attached rooms (fetched from `hallway_adjacent_rooms`) with their position/sequence

When a **room** is selected, show:
- Which hallway it's currently attached to (if any)
- Controls to change side, position (start/middle/end), and sequence order
- "Detach" button to remove from hallway

### 2. Create a new component: `HallwayAttachPanel.tsx`

Located in `src/components/spaces/floorplan/components/HallwayAttachPanel.tsx`

Props:
- `selectedObject` — the clicked room or hallway
- `allObjects` — all floor plan objects (to find hallways/rooms)
- `floorId` — current floor
- `onAttach` — callback when attachment is made
- `onRefresh` — to refresh data after DB update

This component will:
- Query `hallway_adjacent_rooms` for the selected hallway (or the room's hallway)
- Show a side picker (N/S/E/W buttons)
- Show a position picker (start/middle/end)
- Show a sequence order input (or drag-to-reorder list of attached rooms)
- Persist changes to `hallway_adjacent_rooms` table via Supabase

### 3. Wire into ThreeDViewer's selected object panel

Replace the stub "View Details" / "Edit" buttons (lines 711-722 in `ThreeDViewer.tsx`) with:
- If selected object is a hallway → show attached rooms list + "click a room to attach" mode
- If selected object is a room → show hallway assignment dropdown, side, position, sequence controls
- Keep existing property display above

### 4. Also wire into ModernFloorPlanView's 3D path

Since `ModernFloorPlanView` uses `ModernThreeDViewer` (not `ThreeDViewer`), and the attach logic is already in `handleObjectSelect`, we need to:
- Pass `attachMode`, `selectedHallwayId`, `attachSide` state down so the 3D viewer can show visual indicators (highlight the selected hallway, show attachment guides)
- Add the same `HallwayAttachPanel` into the `EnhancedPropertiesPanel` sidebar when in 3D mode

### Files to Create/Edit

| File | Action |
|------|--------|
| `src/components/spaces/floorplan/components/HallwayAttachPanel.tsx` | **Create** — attachment UI component |
| `src/components/spaces/floorplan/components/ThreeDViewer.tsx` | **Edit** — integrate HallwayAttachPanel into selected object info panel |
| `src/components/spaces/floorplan/components/EnhancedPropertiesPanel.tsx` | **Edit** — add HallwayAttachPanel tab/section for room↔hallway management |
| `src/components/spaces/floorplan/queries/floorPlanQueries.ts` | **Edit** — add query to fetch/update hallway_adjacent_rooms for a specific room or hallway |

### HallwayAttachPanel Behavior

**When a hallway is selected:**
- Header: "Hallway: [name]"
- Section: "Attached Rooms" — list showing room name, side, position, sequence order
- Each room row has: side dropdown, position dropdown, sequence number input, detach button
- Footer: "Click a room in the 3D view to attach it" instruction text

**When a room is selected:**
- Header: "Room: [name/number]"
- If attached to a hallway: show hallway name, current side/position/sequence, with editable controls
- If not attached: show dropdown of available hallways on this floor + "Attach" button
- Side picker (N/S/E/W), position picker (start/middle/end), sequence order input

All changes persist immediately to `hallway_adjacent_rooms` via Supabase upsert/delete, then trigger a data refresh so the 3D layout recalculates.

