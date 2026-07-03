# Court Officer Command Dashboard — Design

Date: 2026-07-03
Status: awaiting user review

## Problem

The `court_officer` role has no dashboard: `roleBasedRouting.ts` sends the
role straight to `/keys`, which is the dense Key Management admin table
(inventory rows, filters, bulk actions) — a tool, not a landing page. There
is no "state of the security operation" view anywhere.

Audience correction from the user: this page is for **captains / command
staff** (the role's real-world users — e.g. the Major and Captain in the
Court Administration Directory), not rank-and-file officers. It is a
command-level overview, not a personal task queue.

## Goals

- A purpose-built desktop landing page answering two questions at a glance:
  **are the keys accounted for** and **is the building ready to hold
  court** — per user, both matter equally (two-panel layout).
- Become the court_officer login destination (replacing `/keys`), with the
  existing tools one click away.
- Visual/structural sibling of the Court Aide Work Center (same header,
  alert-bar, stat-strip, two-panel pattern) so operational roles feel
  consistent.
- Everything derived from live data; nothing that needs authoring/curation.

## Non-goals

- Personnel rostering / post assignments (not in this system).
- Key request approvals (workflow removed 2026-06-14; facility office is
  emailed instead).
- Authoring UI for `room_shutdowns` (display-if-exists only, same decision
  as the User Dashboard spec).
- Changes to the Keys, Courtrooms, Reports, or Term Sheet pages themselves.

## Design

### Route + role wiring

- New page `CourtOfficerCommandCenter` at `/command-center`
  (`features/court/pages/`), lazy-loaded like other dashboards.
- `ROLE_DASHBOARDS.court_officer` → `{ path: '/command-center', name:
  'Command Center' }`; `navigationPaths` fallback for court_officer updated
  from `/keys` accordingly.
- court_officer sidebar nav gains **Command Center** (LayoutDashboard icon)
  as the first entry; Keys, Reports, Courtrooms, Term Sheet unchanged below.
- Route guard: same authenticated-route treatment as `/work-center`; RLS
  already restricts writes appropriately, and the page itself is read-only.

### Page structure (top to bottom)

1. **Header** — Work Center pattern: eyebrow "Court officer command",
   title "Command center", date line, NotificationDropdown on the right.

2. **Alert bar** — renders only when at least one of:
   - Overdue keys: `key_assignments` where `returned_at IS NULL` and
     `expected_return_at < now()`.
   - Courtrooms with urgent open issues: `issues` where `status in
     (open, in_progress)`, `priority in (high, critical)`, and `room_id`
     belongs to a courtroom (`court_rooms.room_id`).
   Zero conditions → no bar (Court Aide AlertsBar behavior).

3. **Stat strip** (shared `StatStrip` component) — four metrics, each a
   click-through:
   - Keys out (active assignments) → `/keys`
   - Overdue returns → `/keys`
   - Courtrooms sitting today → `/term-sheet`
   - Courtrooms with open issues → `/operations?tab=issues`

4. **Two panels** (grid, stacks on mobile):

   **Left — Key Accountability.** All active (unreturned) assignments:
   recipient name, key name, issued date, expected return. Sort: overdue
   first (highlighted destructive), then by expected return ascending, then
   issued date. Badges for `is_spare` and `is_elevator_card`. Empty state:
   "All keys returned." Footer link → Key Management.

   **Right — Courtroom Picture.** Composed from the active term (the
   `getCurrentTermId` / covers-today term):
   - Shutdown/inactive courtrooms first, if any (`room_shutdowns` with
     status `scheduled`/`in_progress`/`delayed`, joined via
     `court_room_id → court_rooms`; plus `court_rooms.is_active = false`).
     Silent when none.
   - Parts sitting **today**: assignments in the active term whose
     `calendar_day` is null/empty (sit every day) or includes today's
     weekday name. Each row: part, justice, room number.
   - Open-issue badge per room (reuse `useCourtIssuesIntegration`
     red-dot/count pattern from the term sheet board).
   - Bunting flag icon on rooms where `court_rooms.has_bunting` is true.
   - Weekend note: on Sat/Sun no parts sit; show "No parts sit today" with
     the next sitting day, rather than an empty panel.
   Footer link → Courtrooms directory.

### Data / components

New:
- `features/court/pages/CourtOfficerCommandCenter.tsx` — page shell.
- `features/court/components/command/KeyAccountabilityPanel.tsx`
- `features/court/components/command/CourtroomPicturePanel.tsx`
- `features/court/components/command/CommandStats.tsx` (wraps `StatStrip`)
- `features/court/components/command/CommandAlertsBar.tsx`
- One hook per panel (`useKeyAccountability`, `useCourtroomPicture`) with
  plain react-query reads; no new tables, RPCs, or migrations.

Reused as-is: `StatStrip`, `NotificationDropdown`, term utilities
(`getCurrentTermId`, `parseSittingDays` from `termPattern.ts`),
`useCourtIssuesIntegration`.

### Error / empty states

- No keys out: "All keys returned" panel body.
- No active term / no assignments: courtroom panel shows "No term sheet
  data" with a link to the Term Sheet.
- Weekend: "No parts sit today — next court day is Monday."
- Query failure: per-panel inline error with retry (no full-page failure —
  one panel failing must not blank the other).

### Testing / verification

- Live preview as court_officer (dev-mode role preview): login lands on
  `/command-center`; sidebar shows Command Center active.
- Seed check: with 3 keys currently out, the Key panel lists 3 rows; set an
  `expected_return_at` in the past on one (test data, revert after) and
  confirm it surfaces as overdue in both the alert bar and panel sort.
- Courtroom panel on a weekday shows the active term's sitting parts for
  that weekday (cross-check against the term sheet board's sitting-day
  labels); a room with an open issue shows the badge.
- `tsc --noEmit` clean.
