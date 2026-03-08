

# Fix: Room Labels Disappearing When Rotating

## Root Cause
The room number and name labels are positioned at `y: 1.5` (barely above the floor), while walls extend up to `y: 35` (the default `size[1]`). When you rotate the camera, the walls occlude the labels. The `Billboard` component makes text face the camera, but it doesn't prevent walls from blocking the view.

## Fix
Raise both labels above the wall tops so they're always visible from any camera angle, while keeping them centered over each room:

**Edit: `BlueprintRoom.tsx`**
- Move room number position from `y: 1.5` to `y: size[1] + 8` (just above wall top)
- Move room name position from `y: 1.5 - offset` to `y: size[1] + 8 - numberFontSize` (below number, still above walls)
- Keep `Billboard` wrapping so labels always face camera
- Adjust the hover lift offset to work from the new baseline

This ensures labels float above the room like a nameplate — visible from every angle, never hidden behind walls.

