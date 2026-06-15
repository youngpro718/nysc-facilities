## Diagnosis

The Court Aide Work Center looks empty, but the database actually has 4 active task requests. Here is the full picture from `staff_tasks`:

- 4 rows in `pending_approval` (the 4 requests submitted from a user today: chairs to 1000, move desk, file cabinet, event setup)
- 1 row `completed`
- 1 row `cancelled`
- 0 rows in `approved`, `claimed`, or `in_progress`

`TaskWorkQueue.tsx` only queries three buckets:

- My Tasks → `status in ('claimed','in_progress')` AND (`claimed_by=me` OR `assigned_to=me`)
- Available → `status = 'approved'`
- Completed → `status = 'completed'` AND involves me

Nothing in the work center ever queries `pending_approval`. And the RLS policy on `staff_tasks` only lets `admin` / `facilities_manager` flip a request from `pending_approval` → `approved`. Court Aides can't approve, and nobody has approved these 4 — so they sit invisible to the aide, and "Available" stays empty.

So the bug isn't "queries broken" — it's a workflow gap. Aides see nothing to do because the approval step is silently blocking everything.

## Fix

Make pending requests first-class in the Work Center, and let aides act on them directly.

1. **New "Requests" tab in `TaskWorkQueue`** (becomes the 4-tab layout: Requests · My Tasks · Available · Completed; Requests is the default tab when its count > 0).
   - Fetches `status = 'pending_approval'` via `useStaffTasks({ status: 'pending_approval' })`.
   - Each row uses `TaskCard` with two actions: **Approve & Claim** (one-tap: sets status `claimed`, claimed_by = me, approved_by = me, approved_at = now) and **Reject** (opens reason prompt, uses existing `rejectTask`).
   - Empty state: "No new requests".
   - Badge count on the tab + a small "N new" pill in the card header next to Active / Available.

2. **`useStaffTasks` — add an `approveAndClaim` mutation** that performs the combined update in one round trip. Reuses the existing pattern; invalidates `['staff-tasks']`.

3. **RLS update (migration)** so court_aide can approve+claim a pending request themselves:
   - Replace the `staff_tasks` UPDATE policy to also allow `has_role('court_aide')` when `status = 'pending_approval'` (currently they're only allowed to touch `approved` / claimed-by-me / assigned-to-me rows).
   - No grant changes needed — `authenticated` already has UPDATE.

4. **Realtime** — `useCourtAideRealtime` already subscribes to `staff_tasks` and invalidates `['staff-tasks']`, so the new tab refreshes automatically. No change.

5. **Minor**: bump the "Active / Available" header pills to also include a "N pending" badge so the aide notices new requests even when they're on another tab.

## Out of scope

- No changes to the request-submission flow (`RequestTaskDialog`) or to the admin approval surface elsewhere — those keep working as-is.
- No schema changes beyond the one RLS policy swap.

## Files touched

- `src/features/court/components/court-aide/TaskWorkQueue.tsx` — add Requests tab, default-tab logic, approve+claim handler
- `src/features/tasks/hooks/useStaffTasks.ts` — add `approveAndClaim` mutation
- `src/features/tasks/components/TaskCard.tsx` — accept an `onApproveAndClaim` action prop (button only renders when handler provided)
- New migration: `db/migrations/0XX_court_aide_approve_pending_tasks.sql` — update `staff_tasks` UPDATE policy
