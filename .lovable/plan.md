## Goal
When you click **Floors / Rooms / Health** on a BuildingCard, the Spaces page should auto-scope to that building and let you drill further by floor. Right now all three send you to `/spaces?building=ID` but `RoomsPage` hardcodes `selectedBuilding: "all"` and ignores the URL, so nothing actually filters.

## What "exceptional" looks like
- Click **Floors** on 100 Centre Street → Spaces opens scoped to that building, with a compact floor strip ("1 · 10 · 11 · 13 · 14") at the top. Pick a floor → rooms collapse to just that floor.
- Click **Rooms** → Spaces opens scoped to that building, floor strip available but defaulted to "All floors".
- Click **Health** → routes to Lighting tab filtered by the building so you see affected fixtures grouped by room.
- Building name + active floor render as removable chips (✕ to clear). Closing the chip restores "all buildings".
- All scope lives in URL (`?building=…&floor=…`), so browser Back behaves correctly and deep links are shareable.
- No new page, no modal, no extra tab — the strip slides in only when a building is scoped.

## Changes

### 1. `src/features/dashboard/components/dashboard/BuildingCard.tsx`
- Make each stat cell its own clickable target (stop propagation):
  - **Floors** → `navigate('/spaces?building=ID&pick=floor')` (`pick=floor` tells RoomsPage to auto-open the floor strip even on mobile).
  - **Rooms** → `navigate('/spaces?building=ID')`.
  - **Health** → `navigate('/operations?tab=lighting&building=ID')`.
- Card body (image area) keeps current `/spaces?building=ID`.
- Add `aria-label`s and replace divs with buttons for the stat cells (a11y + hit target ≥44px).

### 2. `src/features/spaces/components/spaces/views/RoomsPage.tsx`
- Read `building` and `floor` from `useSearchParams`; pass them into `useRoomFilters` instead of the hardcoded `"all"`.
- Preserve them in `handleRoomSelect` (already preserves other params — already correct via `URLSearchParams(searchParams)`).
- Render the new `<BuildingFloorScopeBar />` above the FilterBar when `building` is set.

### 3. **New** `src/features/spaces/components/spaces/rooms/components/BuildingFloorScopeBar.tsx`
- Inputs: `buildingId`, `floorId`, `onClearBuilding`, `onSelectFloor`, `autoExpand` (from `pick=floor`).
- Pulls building name + floors for that building via a small query (`useBuildingFloors(buildingId)` — see #4).
- Layout (single row, wraps on mobile):
  - `[ 🏢 100 Centre Street ✕ ]`
  - Horizontal scroll chips: `All floors` · `1` · `10` · `11` · `13` … (sorted by `floor_number`)
  - Selected chip uses primary variant; others outline.
- When `autoExpand` and on mobile, ensure the strip is in view (scrollIntoView on mount).
- Uses semantic tokens (`bg-card`, `text-foreground`, `border-border`) — no hardcoded colors.

### 4. **New** `src/features/spaces/components/spaces/hooks/queries/useBuildingFloors.ts`
- Wraps Supabase `floors` query: `select('id, name, floor_number').eq('building_id', buildingId).order('floor_number')`.
- Returns `{ building, floors }` (building via `buildings` select). Cached by react-query.

### 5. `src/features/spaces/components/spaces/hooks/useRoomFilters.ts`
- No change needed — it already supports `selectedBuilding` / `selectedFloor`. We're just stopping the page from passing `"all"`.

### 6. Operations page wiring (light touch)
- Verify `/operations` accepts `?building=` and `?tab=lighting`. If `?building=` is ignored, scope it the same way (one-line `useSearchParams` read into the existing filter state). If this turns out to be larger, surface as a follow-up — do not balloon the scope.

## Out of scope
- No DB / RLS / schema changes.
- No redesign of the RoomsPage layout or sidebar.
- No change to existing FilterBar quick filters.
- No new mobile drawer; the scope bar is just a row above the existing FilterBar.

## QA checklist
1. Admin dashboard → click 100 Centre Street **Floors** → URL becomes `/spaces?building=…&pick=floor`. Strip visible, lists every floor of that building only.
2. Tap "11" → only 11th-floor rooms render; URL gets `&floor=…`.
3. Tap ✕ on building chip → URL clears building+floor; sidebar shows all rooms.
4. Browser **Back** from inside a room returns to the scoped Spaces view (because scope is preserved in URL).
5. Click **Rooms** stat → scope bar shows building chip but "All floors" selected.
6. Click **Health** stat → lands on Operations / Lighting filtered by that building.
7. Mobile (440 px wide): chips horizontally scroll, no clipping; building chip wraps to its own line if needed.
8. No regressions when visiting `/spaces` with no query params (strip hidden, behaves as today).
