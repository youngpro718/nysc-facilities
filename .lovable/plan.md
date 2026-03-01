

## Faster Reassignment: Click-to-Select Mode

The current flow requires 7 steps per reassignment (batch toggle, arrow button, radio select, dropdown, add to batch, repeat, apply). That's too many clicks for what should be a quick operation.

### New Interaction: "Quick Reassign" Mode

A streamlined click-based workflow:

1. **Click "Quick Reassign" button** in the toolbar (one-time toggle)
2. **Click Room A** (source) — row highlights blue, showing "Selected: Room 1300 · Judge X"
3. **Click Room B** (destination) — immediately queues "Move Judge X → Room B" and auto-selects Room B as next source if it had a judge (for chaining)
4. A **floating bar** at the bottom shows all queued changes with an "Apply All" button
5. **Click "Apply All"** — done

This turns a 7-step-per-room process into **2 clicks per reassignment** plus one final "Apply."

### Chaining Example (Your Scenario)

- Click Room with Part 77 → Click Room where Part 95 is → queues "Part 77 judge → Part 95's room"
- Part 95's judge auto-selects as next source → Click Part 95's new destination → queues that
- Click Part 66's room → Click Room 1600 → queues that
- Hit "Apply All" — 3 reassignments done in ~7 clicks total

### Technical Changes

**`src/components/court/LiveCourtGrid.tsx`**:

- Add `quickReassignMode` state and a toolbar toggle button
- Add `selectedSource` state (room object) — set on first click
- When a row is clicked in quick-reassign mode:
  - If no source selected → select it (highlight row blue)
  - If source already selected → queue the reassignment, auto-chain if destination had a judge
- Add a sticky floating bar at bottom showing queued changes with "Apply All" / "Undo Last" / "Cancel"
- Rows become clickable (cursor pointer, hover highlight) in this mode
- Selected source row gets a distinct blue border/background
- Disable the normal action buttons while in quick-reassign mode to avoid confusion

### What stays the same

- The existing batch mode, move dialog, and all other features remain untouched
- Quick Reassign uses the same `executeBatch` logic and `BatchChange` interface already in place
- Same Supabase upserts on `court_assignments` — no database changes needed

