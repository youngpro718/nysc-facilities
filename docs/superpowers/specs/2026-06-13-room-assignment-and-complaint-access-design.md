# Room Assignment, Form Room Auto-Load & Complaint Access — Design

Date: 2026-06-13
Status: awaiting user review

## Problem

Logged-in users can't be assigned to a room, can't set their own room, and
their room no longer auto-loads into the Report Issue / Supply Order / Set Up a
Room forms. This regressed when occupant storage was reworked.

### Root cause (verified against the live DB)

There are three "people" tables:
- `profiles` — actual login users (6).
- `personnel_profiles` — court staff directory (judges/clerks, used by Term Sheet).
- `occupants` — building occupant directory (101 rows, **0 linked to a profile**).

Rooms link to a person through `occupant_room_assignments`, which carries three
nullable identity columns + FKs:
- `profile_id → profiles(id)`
- `occupant_id → occupants(id)`
- `personnel_profile_id → personnel_profiles(id)`

Current data: 14 assignments — 8 `occupant_id`, 6 `personnel_profile_id`,
**0 `profile_id`**. So **no login user has a room.**

The form hooks (`useUserRoomAssignments`, `useOccupantAssignments`) already query
all three identity columns, and every form already auto-loads the user's primary
room and lets them pick a different one for that request:
- Report Issue: `QuickIssueReportButton` opens the shared requester-mode `ReportIssueDialog`.
- Supply Order: `OrderSummaryFooter` pre-fills `deliveryLocation` from room assignments.
- Set Up a Room: `SetupRequestForm` auto-selects primary, dropdown + manual entry.

They come up empty only because no `profile_id` row exists. Two links are broken:
- The admin assign dialog (`CreateAssignmentDialog`, which *does* support
  `profile_id`) is **rendered nowhere**.
- The old user "Request Room Assignment" button (`MyRoomSection`) files a generic
  `staff_tasks` request that dead-ends, because the admin has no reachable way to
  fulfill it.

## Decisions (from the user)

- **Room is self-serve.** A user sets their own room; it stores instantly and
  auto-loads into forms. **Admin verification is on-demand, not mandatory** — the
  admin can view/change anyone's room only if needed.
- **Report Issue → all roles** (including `court_aide` / "couriers").
- **Order Supplies → all roles except `court_aide`** (they fulfill/ship supplies,
  so they don't place orders).

## Design

### Part 1 — Self-serve room (user, in Profile)

Rework `src/features/profile/components/profile/MyRoomSection.tsx`:
- Fix the display bug: it reads `assignments.roomDetails`, but the hook returns
  `roomAssignments` — so it always shows "no room." Use the correct shape.
- Replace the dead "Request Room Assignment" (staff_task) button with a **room
  picker** (searchable list of active rooms, same source the assignment dialog
  uses). Selecting a room **upserts the user's own** `occupant_room_assignments`
  row: `profile_id = auth user id`, `assignment_type = 'work_location'`,
  `is_primary = true`. Re-selecting changes it; a "Remove" clears it.
- On change, invalidate the room-assignment query keys so forms pick it up.

### Part 2 — Admin verify/override (Admin → Users)

Wire the existing `CreateAssignmentDialog` into the **Users** tab of Admin Center
(`src/features/admin/pages/Users.tsx`): each user row gets an "Assign / change
room" action that opens the dialog prefilled for that profile. The dialog already
writes `profile_id` for `source_type === 'profile'`. This is the on-demand
override; it is never required for the self-serve path to work.

### Part 3 — Form auto-load (already built; verify)

No new auto-load code. After Parts 1–2 produce `profile_id` rows, verify live that
each form pre-fills the user's room and still allows choosing a different room for
that one request:
- Report Issue (`ReportIssueDialog`, requester mode)
- Supply Order (`OrderSummaryFooter`)
- Set Up a Room (`SetupRequestForm`)
Fix any wiring gap found (e.g. a hook variant returning the wrong shape).

### Part 4 — Complaint / supply access per role

Target access matrix (entry points to *initiate* these actions):

| Role | Report Issue | Order Supplies |
|---|---|---|
| admin / system_admin / facilities_manager | yes | yes |
| court_liaison | yes | yes |
| court_officer | yes | yes |
| purchasing | yes | yes |
| standard | yes | yes |
| **court_aide** | **yes** | **no** |

Implementation:
- **Mobile (FAB, `FloatingActionButton.tsx`):** render for all roles; compute the
  action list per role instead of the blanket `rolesWithoutFAB` early-return:
  - Report Issue — always shown.
  - Order Supplies — shown unless role is `court_aide`.
  - Set Up a Room / Request Help / Request a Key — keep their *current* audience
    (standard + admin-ish + court_liaison). Newly-included fulfiller/security roles
    (purchasing, court_officer, court_aide) get the slim set only. No behavior
    change for roles that already had the full FAB.
- **Desktop (shared header):** add a compact **Report Issue** + **Order Supplies**
  pair to the app header, shown for **all roles** on desktop (Order Supplies hidden
  for `court_aide`). This is the entry point for court_officer / court_liaison /
  purchasing (who land on keys / term-sheet / supply-room, not the dashboard, and
  have no FAB on desktop); harmless minor redundancy for standard/admin who also
  have dashboard/admin entry points is acceptable and keeps the rule simple.

### Part 5 — Security (RLS)

Add a policy on `occupant_room_assignments` so a user can INSERT / UPDATE / DELETE
**their own** row (`profile_id = auth.uid()`). Admin/privileged full access stays
(existing `is_privileged()` policy). Self-serve writes only ever touch the
caller's own `profile_id` row.

## Out of scope
- Merging the three people-tables (`profiles` / `personnel_profiles` / `occupants`).
- The `occupant`/`personnel` directory assignments (building directory) — unchanged.
- The broader FAB↔desktop parity items from `QA_FAB_2026-06-13.md` beyond Report
  Issue / Order Supplies.

## Risks
- Per-action FAB filtering must preserve today's behavior for standard/admin.
- RLS must not let a user write another user's `profile_id` row — `WITH CHECK
  (profile_id = auth.uid())` on insert/update.
- The desktop header addition is shown for all roles (Order Supplies hidden for
  court_aide); the minor redundancy for standard/admin is accepted in exchange for
  a simple, uniform rule.
