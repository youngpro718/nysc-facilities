

## Problem

Two issues:

1. **Room 1300 shows "Lactation Room"**: The current code prioritizes `rooms.name` (from Spaces) for the Part column. But Room 1300's Spaces name is "Lactation Room" — not a part name. The room may serve dual purposes, or was simply named differently in Spaces.

2. **Abbreviations lost**: The `court_assignments.part` field already contains the abbreviations you created (e.g., `"59,59V,59M"`, `"TAP A, TAP G"`, `"ATI, 21"`). By replacing that with `rooms.name`, we lost those — `rooms.name` only says "PART 59", not "59,59V,59M".

## Solution: Revert to using `court_assignments.part` for the Part column

The `court_assignments.part` field is the correct source for Part names — it already has your abbreviations. The Spaces room name is a general-purpose label for the physical room and doesn't always match the court assignment designation.

### Changes

1. **`src/components/court-operations/personnel/TermSheetBoard.tsx`** (line ~134)
   - Revert `part` back to: `assignment.part || '—'`

2. **`src/components/user/TermSheetPreview.tsx`** (line ~84)
   - Revert `part` back to: `assignment?.part || '—'`

This restores the abbreviations (59,59V,59M etc.) and fixes Room 1300 showing "Lactation Room" instead of "Part 32".

### What about syncing Spaces ↔ Term Sheet?

The real sync point is: when you **edit an assignment's part name** in Court Operations, that value is stored in `court_assignments.part`. The Spaces room name (`rooms.name`) is a separate concept — it's the physical room's label, which may differ from its court designation. These should remain independent.

