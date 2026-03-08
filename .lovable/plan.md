

# 3D Floor Plan Visual & UX Overhaul

## Problems Identified

1. **Room number badge is tiny** — `fontSize: 6`, tucked in the corner at `[size[0]/2 - 10, size[1]/2 + 3, size[2]/2 - 10]` right next to the green status dot. Practically unreadable.
2. **Room name label is small** — capped at `fontSize: 10` with `Math.min(10, size[0]/12)`. At typical zoom, this is hard to read.
3. **Status dot jammed in corner** — the green sphere sits at the room's corner edge, overlapping the room number badge. Cluttered.
4. **Emoji icons floating above** — emoji text rendered in 3D doesn't scale well and looks inconsistent across platforms. They hover 20 units above the wall top, disconnected from the room.
5. **Label stacking is awkward** — icon at `wallTop + 20`, name at `wallTop + 8`, room number at corner. Three separate elements at different heights/positions with no visual hierarchy.
6. **Hallway labels are small** — `fontSize: 8`, same readability issue.
7. **No hover tooltip** — when you hover a room, the only feedback is a color shift. No quick-info panel.
8. **Walls all look the same** — no visual distinction between room types beyond a subtle floor tint at 18% opacity.

## Plan

### 1. Redesign Room Labels (BlueprintRoom.tsx)
- **Move room number to center of room**, rendered on the floor plane as large, bold text (fontSize ~14-18, scaled to room width). This is the primary identifier — it should be the most prominent element.
- **Move room name below the room number** on the floor, smaller but still readable (fontSize ~8-10).
- **Remove the corner badge** entirely — it's redundant once the number is centered.
- **Remove emoji icons** — replace with a subtle colored bar or type-indicator stripe on the floor (type color is already computed, just make it more visible).

### 2. Relocate Status Indicator (BlueprintRoom.tsx)
- Move the status dot from the corner to a **top-edge center pill** — a small rounded rectangle sitting on the front wall's top edge, clearly visible from the default camera angle.
- Increase the dot size slightly and remove the redundant outer glow sphere (two overlapping spheres is visually noisy).

### 3. Improve Wall Type Distinction (BlueprintRoom.tsx + WallSegment.tsx)
- Use the **type color for the wall top-edge glow** instead of the universal `#38bdf8`. This way courtrooms have indigo edges, offices have blue edges, etc. — visible differentiation at a glance.
- Bump floor fill opacity from 0.18 to 0.25 so the type color is actually visible.

### 4. Enlarge Hallway Labels (BlueprintHallway.tsx)
- Increase hallway name `fontSize` from 8 to 12.
- Add the hallway name as floor text too (rendered on the center stripe), so it's readable from top-down angles.

### 5. Improve Hover/Select Feedback (BlueprintRoom.tsx)
- On hover: raise room labels slightly and increase their opacity/size for a subtle "pop" effect.
- On select: add a **bright colored outline ring** on the floor plane around the room perimeter, more visible than the current glow box.

### Files Changed
| File | Change |
|------|--------|
| `BlueprintRoom.tsx` | Redesign labels (floor-centered number + name), relocate status dot to top-center, remove emoji icon, remove corner badge, improve hover/select feedback, use type color for top-edge |
| `WallSegment.tsx` | Accept `accentColor` prop for top-edge glow instead of hardcoded `#38bdf8` |
| `BlueprintHallway.tsx` | Larger labels, floor-rendered name text |
| `blueprintMaterials.ts` | No changes needed — colors already good |

