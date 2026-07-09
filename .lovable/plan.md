## Goal

1. Make the **Staff Activity** view actually show every court aide (including the new test users), whether or not they've picked up a task yet.
2. Remove **supply ordering** from the court_aide role — they only fulfill orders and can still report issues.

## Why the fake test aides don't appear today

`StaffActivityPanel` queries `profiles` filtered only by `is_approved = true` (so it's pulling everyone, not just aides) and then hides any user with zero claimed/assigned tasks. New court_aide test users have no task history yet, so they get filtered out. On top of that, "aide" was being determined from the profile list rather than the actual `user_roles` table, so the label was misleading.

## Changes

### 1. `src/features/tasks/components/StaffActivityPanel.tsx`
- Replace the `profiles.is_approved` query with a `user_roles` lookup: pull every `user_id` where `role = 'court_aide'`, then fetch their profile rows.
- Remove the `if (aideTasks.length === 0) continue;` skip so aides with no task history still appear (0 active / 0 today / 0 total badges).
- Keep the existing sort (active first, then most-completed).

### 2. Remove ordering surfaces for `court_aide`

- `src/App.tsx` — `/supplies` route: if `userRole === 'court_aide'`, redirect to `/supply-room` (their fulfillment dashboard). Keeps standard/admin ordering intact.
- `src/features/inventory/pages/InventoryDashboard.tsx` — hide the header **"Order Supplies"** button when `isCourtAide`.
- `src/features/inventory/components/inventory/InventoryOverviewPanel.tsx` — hide the per-item **"Reorder"** button when `isCourtAide`.
- Sidebar (`src/components/layout/config/navigation.tsx`) — no change needed; court_aide's nav already doesn't include an "Order Supplies" entry. `/supplies` was only reachable via inventory buttons and deep links.

Issue reporting is untouched — it lives on `/issues` + `/my-issues`, which aren't in this change.

### 3. Verification
- Typecheck.
- Confirm court_aide sidebar still shows: Work Center, Tasks, Supply Room, Inventory, Term Sheet, Profile.
- Confirm Inventory pages no longer show "Order Supplies" / "Reorder" buttons for court_aide.
- Confirm Staff Activity now lists the fake aide test users with zero-count badges.

## Out of scope
No DB migration, no RLS changes, no changes to the standard/admin ordering flow, no changes to issue reporting.
