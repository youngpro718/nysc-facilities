

## Two Fixes

### 1. Card flip: replace sideways (Y-axis) flip with a regular vertical (X-axis) flip

The current animation uses `rotateY(180deg)` which flips the card sideways like a door. Change to `rotateX(180deg)` for a top-over-bottom flip (like flipping a page/card face-down on a table).

**File: `src/components/spaces/rooms/RoomCard.tsx`**
- Line 81: `rotateY(180deg)` → `rotateX(180deg)`, `rotateY(0)` → `rotateX(0)`
- Line 108 (back face): `rotateY(180deg)` → `rotateX(180deg)`

### 2. Logo: make it bigger

Currently `h-10 w-10`. Increase to `h-14 w-14` in the expanded state and `h-12 w-12` in collapsed state. Also bump the header height from `h-14` to `h-16` to accommodate.

**File: `src/components/layout/components/AppSidebar.tsx`**
- Line 50: header height `h-14` → `h-16`
- Line 53: expanded logo `h-10 w-10` → `h-14 w-14`
- Line 61: collapsed logo `h-10 w-10` → `h-12 w-12`

