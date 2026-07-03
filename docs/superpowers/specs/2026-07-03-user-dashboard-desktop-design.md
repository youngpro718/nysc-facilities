# User Dashboard — Desktop Redesign

Date: 2026-07-03
Status: awaiting user review

## Problem

`UserDashboard` (the "standard" role's home page — general court staff who
report issues, request supplies, request keys) is built mobile-first and never
adapted for desktop. The root `<div>` is `max-w-lg mx-auto` (576px), with every
section stacked in one vertical column. On a desktop viewport this renders as a
narrow phone-shaped column pinned to the left with the rest of the screen
empty — confirmed live at 1600px width.

Desktop is the primary device for standard users (per user), so this is a real
"digital lobby" redesign, not a responsive tweak.

Two related gaps discovered while investigating:

1. **Self-serve room assignment is fully built but not discoverable.**
   `MyRoomSection` (in Profile settings) correctly self-serve-assigns a room
   via `occupant_room_assignments` (RLS-scoped to the caller's own
   `profile_id`), and every form (Report Issue, Supply Order, Set Up a Room)
   already auto-loads it. But it's never surfaced anywhere a user is likely to
   see it. Live data: **2 of 10 profiles** have a room set. Moving this to the
   home page is expected to fix adoption on its own.

2. **`room_shutdowns` exists but doesn't apply here.** The table looked like
   a fit for "my room is offline for a project" (title, status,
   impact_level, date range, project_notes, linked issue), but
   `room_shutdowns.court_room_id` foreign-keys to `court_rooms` — the
   courtroom-specific table used by the Term Sheet — not general `rooms`. A
   standard user's assigned room is an office/workspace, essentially never a
   courtroom, so this table would almost never have anything to show here.
   Dropped from this design; it's a much better fit for the Court Officer
   dashboard (separate spec), where courtroom operational status is directly
   relevant to the role.

## Goals

- Desktop layout that uses the available width instead of a stranded column.
- Surface "My Room" (assignment + open issues in that room) directly on the
  home page, replacing its Profile-only location.
- Keep the three existing quick actions (Order Supplies, Make a Request,
  Request a Key) as the primary calls to action — richer layout, same
  destinations and badges.
- No content that needs manual authoring/curation (no "announcements board").
  Everything on the page is either an action or derived from live data.
- Mobile experience must not regress — same content, reflowed to one column.

## Non-goals

- Anything involving `room_shutdowns` — doesn't apply to this audience (see
  Problem, item 2). Revisit under the Court Officer dashboard spec.
- Changing what data is fetched for existing features (supply requests,
  issues, task requests) — only how it's displayed.
- Touching the Admin dashboard or Court Officer dashboard (separate specs).

## Design

### Layout — two-column portal

```
┌─────────────────────────────────────────┬───────────────────┐
│ Quick Actions (3-card row)               │ Profile summary   │
│                                           ├───────────────────┤
│ My Activity                              │ My Room           │
│  (wide list: status / type / date /      │  - assignment     │
│   location)                              │  - open issues    │
└─────────────────────────────────────────┴───────────────────┘
        ~70% main column                        ~30% rail
```

Below `lg` breakpoint: single column, rail content moves *after* the main
column (profile summary and My Room appear below Activity) — mirrors the
existing mobile order roughly, so the phone experience doesn't regress.

### Components

New:
- `DashboardMyRoomCard` (`features/dashboard/components/dashboard/`) —
  replaces the room-picker portion of `MyRoomSection` for the dashboard
  context. Reuses `useUserRoomAssignments` and `RoomSelector` (both already
  exist, no changes needed). Adds one new read query scoped to the resolved
  room:
  - Open issues: `issues` where `room_id = <assigned room id>` and
    `status in (open, in_progress)`. `occupant_room_assignments.room_id` and
    `issues.room_id` both reference `unified_spaces`/`rooms` with matching
    ids (verified: 0 mismatches across 142 rooms) — no join/mapping needed.
  - Empty state (no room set): same self-serve `RoomSelector` prompt
    `MyRoomSection` shows today.
- `DashboardQuickActions` — the three `ActionRow` buttons restyled as a
  horizontal card row (desktop) / stacked (mobile). Same click targets,
  prefetch behavior, and badge logic as today's `ActionRow`.
- `DashboardActivityList` — wider presentation of the existing
  `CompactActivitySection` data (status, type, date, location columns
  visible at once on desktop instead of truncated mobile rows). Reuses the
  same data (`supplyRequests`, `userIssues`, `myTaskRequests`) already
  fetched in `UserDashboard`.
- `DashboardProfileSummaryCard` — no new data; presents the same
  name/title/department/room/avatar fields `CompactHeader` already renders
  today, just as its own rail card instead of squeezed next to the
  notification bell.

Changed:
- `UserDashboard.tsx` — restructure JSX into the two-column grid described
  above; remove the `max-w-lg` cap. Data fetching (hooks, queries) is
  unchanged — this is a presentation restructure, not a data restructure.
- `MyRoomSection.tsx` (Profile) stays as-is for now (still useful as the
  full room-management view) but the dashboard no longer depends on
  discovering it there.

### Error / empty states

- No room set: self-serve picker prompt (existing pattern).
- Room set, no open issues: no "issues" row rendered (not "0 issues").
- Quick actions and Activity: unchanged from current empty-state handling.

### Testing / verification

- Live preview at desktop width (1440–1600px) and mobile width (375px),
  logged in as `standard` role via dev-mode role preview.
- Verify My Room card against a live test case: temporarily assign a room to
  the preview session, confirm an existing open issue on that room appears,
  confirm it disappears when the room has none.
- `tsc --noEmit` clean.
