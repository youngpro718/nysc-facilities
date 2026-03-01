

## Investigation Results

### What the data actually shows

**"2 rooms unassigned" — count is technically correct but misleading:**
- The query only checks if a `part` string exists in `court_assignments`. Rooms 572 and 1602 have no part at all.
- However, Room 1234 (Part 99) and Room 687 (Part 85) have a part but **no justice assigned** (empty string). From the user's perspective, these are also "unassigned" — a part with no judge is not a functioning assignment.

**"1 with active issues" — incorrect, no active issues exist:**
- All issues in the database have status `resolved`. Zero rows match `status IN ('open', 'in_progress')`.
- The `useCourtIssuesIntegration` hook's `getCourtImpactSummary()` returns `totalAffectedRooms` based on the court issues query, which should return 0. The "1 with active issues" is likely stale React Query cache or a race condition on initial load.

### Plan

**1. Fix "unassigned" count logic** (`src/components/court/AssignmentManagementPanel.tsx`)
- Change the definition of "assigned" from "has a non-empty `part`" to "has a non-empty `part` AND a non-empty `justice`"
- This way, rooms with a part but no judge are counted as unassigned, matching user expectations

**2. Fix "active issues" count accuracy** (`src/components/court/AssignmentManagementPanel.tsx`)
- The banner reads `impactSummary?.totalAffectedRooms` from `useCourtIssuesIntegration`, which queries issues with `status IN ('open', 'in_progress')`. Since no such issues exist, this should be 0.
- Add a guard: only show the "with active issues" portion of the banner when the value is genuinely > 0 AND the issues query has finished loading (not stale/loading state)
- Also ensure the Issues stat card in the grid shows 0 correctly when there are no active issues

**3. Remove phantom issue display** (`src/hooks/useCourtIssuesIntegration.ts`)
- Ensure `getCourtImpactSummary()` returns `totalAffectedRooms: 0` when `courtIssues` is an empty array (it should already, but verify no edge case with undefined/null)

### Files to modify
1. `src/components/court/AssignmentManagementPanel.tsx` — fix unassigned count logic and banner guard
2. `src/hooks/useCourtIssuesIntegration.ts` — verify impact summary returns 0 for empty issues (minor)

