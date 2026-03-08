

# Fix Walk Mode Exit + Improve Hallway Attachment UX

## Problems Identified

1. **Walk mode ESC doesn't work reliably**: The `PointerLockControls` captures ESC to exit pointer lock, but nothing toggles `walkMode` state back to `false`. User is stuck in walk mode (no orbit controls) even after ESC releases the mouse. They must click the walk mode button again — hence "pressing twice."

2. **No ESC listener at the React level**: The tooltip says "ESC to exit" but the walk mode state in `ModernThreeDViewer.tsx` has no keyboard listener for Escape.

3. **No clear way to move rooms in 3D**: The `HallwayAttachPanel` exists in the sidebar but the 3D scene itself has no visual affordance for room placement along hallways. Users can't see or interact with the spatial relationship.

## Plan

### 1. Fix Walk Mode Exit (2 files)

**`ModernThreeDViewer.tsx`** — Add an ESC keydown listener that sets `walkMode = false`:
```ts
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && walkMode) setWalkMode(false);
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [walkMode]);
```

**`FirstPersonControls.tsx`** — Listen for `PointerLockControls` "unlock" event and call a new `onExit` callback prop so the parent can also react:
```ts
// Add onExit prop
// In useEffect: controlsRef.current?.addEventListener('unlock', onExit)
```
Pass `onExit={() => setWalkMode(false)}` from `BlueprintScene` up through `BlueprintFloorPlan` and `NewThreeDScene`.

This ensures: ESC releases pointer lock AND toggles walk mode off in one press.

### 2. Add Visual Room Placement Along Hallways in 3D (1 new file, 1 edit)

**Create `HallwayAttachOverlay.tsx`** — A floating overlay that appears when a hallway is selected in 3D mode, showing:
- Minimap/strip of the hallway with room slots on left/right sides
- Drag targets for "drop a room here" at each position
- Current attached rooms shown as chips on the strip
- Instruction: "Click a room in the 3D view, then click a slot to place it"

**Edit `ModernFloorPlanView.tsx`** — When in 3D mode and a hallway is selected, render the `HallwayAttachOverlay` as an absolute-positioned panel at the bottom of the viewport (above zoom controls). Wire it to the existing `HallwayAttachPanel` data functions.

### Files Summary

| File | Action |
|------|--------|
| `ModernThreeDViewer.tsx` | Add ESC listener to exit walk mode |
| `FirstPersonControls.tsx` | Add `onExit` callback on pointer lock unlock |
| `BlueprintScene.tsx` | Pass `onWalkModeExit` through to FirstPersonControls |
| `BlueprintFloorPlan.tsx` | Forward `onWalkModeExit` prop |
| `NewThreeDScene.tsx` | Forward `onWalkModeExit` prop |
| `HallwayAttachOverlay.tsx` | **Create** — visual hallway strip for room placement |
| `ModernFloorPlanView.tsx` | Render overlay when hallway selected in 3D |

