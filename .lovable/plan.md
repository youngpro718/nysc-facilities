


## Personalized, Minimal Experience Per Role — IMPLEMENTED

### What Changed

1. **Navigation reduced** (`navigation.tsx`):
   - Standard: 2 items (Home, Activity)
   - CMC: 3 items (Home, Court Ops, Activity)
   - Court Officer: 3 items (Home, Keys, Activity)
   - Court Aide: 3 items (Home, Tasks, Supply Room)
   - Admin: unchanged (full access)

2. **Standard User Dashboard** (`UserDashboard.tsx`): Rewritten as a clean, single-column action portal with 3 large action rows (Order Supplies, Report Issue, Request Key), pickup alert, and a unified activity feed. Removed stats strip, MyRoomCard, TermSheetPreview, and 2x2 grid.

3. **Role Dashboards** (`RoleDashboard.tsx`): Replaced 4-card stats grids and 4-card quick action grids with compact inline stat strips and focused content. Court Aide gets a "Work Queue" section with task list and supply room rows.

4. **QuickIssueReportButton** now supports `children` prop for custom rendering.

## Unified Audit Trail for Court Assignments — IMPLEMENTED

### What Changed

1. **Database**: Created `court_assignment_audit_log` table with trigger `trg_court_assignment_audit` on `court_assignments`. Every INSERT/UPDATE/DELETE is automatically logged with old/new values, changed fields, action type (assigned/reassigned/cleared/deleted), and the user who made the change.

2. **Database**: Created `audit_logs` general-purpose table for room status changes (fixes the missing table that `operationsService.updateRoomStatus()` was trying to write to).

3. **UI**: Added `CourtAssignmentAuditPanel.tsx` — a History tab in the Assignments panel showing a chronological log of all court assignment changes with action badges, room numbers, and change diffs.
