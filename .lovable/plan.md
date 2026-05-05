## Goal

Remove the heavy "court operations" machinery (sessions, coverage, daily reports, CMC dashboard) while keeping:
- Courtrooms as spaces
- The Term Sheet as a read-only directory everyone can view
- Courtroom personnel names (judge, part, clerks, sergeant, phone) for fast lookup
- The Court Aide work center, untouched

## What gets removed

**Routes / pages**
- `/cmc-dashboard` (`CMCDashboard.tsx`)
- `/court-operations` (`CourtOperationsDashboard.tsx`) and the entire `components/court-operations/` folder (sessions, coverage, daily reports, conflict panels, shutdowns, absence)
- `TermSheetBoard` embed inside `MaintenanceDashboard.tsx`
- Court reports feature (`components/court-reports/`, `dailyReportParser`, AI extraction)

**Hooks / services tied to scheduling**
- `useCourtSessions`, `useBulkCreateCourtSessions`, `useStartTodaysReport`
- `useCoverageAssignments`, `conflictDetectionService`, `sessionValidation`
- `useCourtOperationsRealtime`, `useCourtOperationsCounts`, `useCMCMetrics`, `cmcDashboardService`

**Role**
- Delete `cmc` role. Reassign existing CMC users → `standard`.
- Add a new `court_liaison` role with one capability: edit `court_assignments` (the term sheet directory). No dashboard, no extras.
- Update role hierarchy: `admin`, `court_liaison`, `court_officer`, `court_aide`, `standard`.

**Database (drop)**
- `court_sessions`
- `coverage_assignments`
- `cmc_court_operations_view`, `cmc_permissions` views
- Helper fns no longer used: `is_cmc()`, `is_court_operations_manager()` (or repurpose)
- Triggers tied to dropped tables (judge status sync from sessions, session validation)

**Database (keep)**
- `court_rooms` — these are spaces
- `court_assignments` — the directory backing the Term Sheet
- `court_terms` — kept only as the grouping for the active term sheet (no scheduling UI)

## What stays / gets touched lightly

- **Term Sheet page** (`/term-sheet`): keep as-is for viewing. Edit access narrows to `admin` + `court_liaison`. Remove any "CMC" branding.
- **Court Aide Work Center** (`/court-aide-dashboard`): untouched.
- **Court Officer Dashboard**: untouched (already scoped to Keys / Spaces / Term Sheet view).
- **Room detail / spaces**: continue showing assigned personnel pulled from `court_assignments` so you can find people quickly.

## Navigation & dashboards

- Remove "Court Operations" and "CMC Dashboard" from sidebar/nav (`navigation.tsx`, `navigationPaths.ts`, `DesktopNavigation`, `MobileNavigationGrid`).
- `roleBasedRouting.ts`: drop `cmc` mapping; `court_liaison` → `/term-sheet`.
- `Command Center` (admin): drop court-session metrics, keep courtroom *health* (operational status of court rooms as spaces).
- `roleDashboardConfig.ts` + tests: remove cmc entries, add court_liaison.

## Cleanup pass

- Delete CMC docs: `CMC_DASHBOARD_IMPROVEMENTS.md`.
- `useEnabledModules.ts`: drop `court_operations` flag.
- `hasModuleAccess`: drop `court_operations` entry, remove `cmc` from module lists.
- Memory: prune all `features/court-operations/*` memory files (sessions, coverage, AI extraction, smart judge logic, grid keyboard nav, report context, session validation, status registry, judge sync). Keep memories tied to `court_assignments`/term sheet directory only.

## Database migration outline

```sql
-- 1. Drop scheduling tables (cascades remove RLS, triggers, FKs)
DROP TABLE IF EXISTS coverage_assignments CASCADE;
DROP TABLE IF EXISTS court_sessions CASCADE;

-- 2. Drop CMC views & helper fns
DROP VIEW IF EXISTS cmc_court_operations_view;
DROP VIEW IF EXISTS cmc_permissions;
DROP FUNCTION IF EXISTS is_court_operations_manager();
-- is_cmc() kept temporarily until callers removed, then dropped

-- 3. Add court_liaison to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'court_liaison';

-- 4. Reassign cmc users -> standard, then add court_liaison where appropriate (manual)
UPDATE user_roles SET role = 'standard' WHERE role = 'cmc';

-- 5. RLS on court_assignments: allow UPDATE/INSERT for admin + court_liaison
DROP POLICY IF EXISTS court_assignments_cmc_write ON court_assignments;
CREATE POLICY court_assignments_liaison_write ON court_assignments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'system_admin') OR has_role(auth.uid(),'court_liaison'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'system_admin') OR has_role(auth.uid(),'court_liaison'));

-- 6. Remove 'cmc' from enum (Postgres can't drop enum values directly;
--    leave value in place with no users — safe and standard practice)
```

## Code change checklist

1. **Migration** as above.
2. **Delete files**: `src/features/court/pages/CMCDashboard.tsx`, `CourtOperationsDashboard.tsx`; `components/court-operations/` (entire folder); `components/court-reports/` (entire folder); `services/cmcDashboardService.ts`, `conflictDetectionService.ts`, `sessionValidation.ts`, `dailyReportParser.ts`; `hooks/useCMCMetrics.ts`, `useCourtSessions.ts`, `useCoverageAssignments.ts`, `useBulkCreateCourtSessions.ts`, `useStartTodaysReport.ts`, `useCourtOperationsRealtime.ts`, `useCourtOperationsCounts.ts`; `CMC_DASHBOARD_IMPROVEMENTS.md`.
3. **App.tsx / routes.ts**: remove `/cmc-dashboard`, `/court-operations` routes.
4. **Navigation configs**: drop CMC + Court Operations entries.
5. **roleBasedRouting.ts** + **roleDashboardConfig.ts** (+ tests): swap cmc → court_liaison; new dashboard target `/term-sheet`.
6. **roles.ts** / `UserRole` type: replace `cmc` with `court_liaison`.
7. **MaintenanceDashboard.tsx**: remove the embedded `TermSheetBoard` (it has its own page).
8. **CommandCenter.tsx** + `commandCenterService.ts`: drop session/coverage queries; keep courtroom health (counts from `court_rooms`).
9. **TermSheet.tsx + AssignmentManagementPanel.tsx**: gate edit affordances behind `admin || court_liaison`.
10. **useEnabledModules + hasModuleAccess**: prune `court_operations`.
11. **Onboarding / tour content / dev panel**: scrub CMC references.
12. **Memory**: delete obsolete court-operations memory files, update index.

## Out of scope (explicitly)

- No new "alert/broadcast" feature in this pass — separate conversation.
- No changes to Court Aide functionality.
- No changes to courtroom space records, photos, or floorplan.

## Risk notes

- Dropping `court_sessions`/`coverage_assignments` is irreversible — confirmed no export needed.
- Existing CMC users will land on the standard dashboard after reassignment; you can promote specific people to `court_liaison` afterwards.
- Postgres enum values can't be removed cleanly; `cmc` stays in the enum but unused — harmless.
