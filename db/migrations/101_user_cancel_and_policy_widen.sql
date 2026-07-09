-- 101_user_cancel_and_policy_widen.sql
-- Part of the approval/self-service rework batch: users must be able to
-- cancel their own still-open requests (staff task requests, supply orders,
-- key requests) from My Requests.
--
-- staff_tasks: the "Staff can update tasks" policy's created_by = auth.uid()
-- branch already permits the requester to update the row at any status, so
-- no RLS change is needed there. The cancellable window (pending_approval or
-- approved, and unclaimed) is enforced client-side in
-- src/features/tasks/hooks/useStaffTasks.ts (cancelStaffTaskRequest), which
-- also re-checks status/claimed_by in the UPDATE's WHERE clause to close the
-- race where someone claims the task between page load and click.
--
-- key_requests: a requester-cancel policy (key_requests_user_cancel) already
-- exists — USING (user_id = auth.uid() AND status = 'pending'), WITH CHECK
-- (user_id = auth.uid() AND status = 'cancelled'). No change needed.
--
-- supply_requests: the requester branch of supply_requests_fulfillment only
-- allowed cancelling from 'pending_approval'. Widen it to also allow
-- 'submitted', matching what the BEFORE UPDATE trigger
-- (enforce_supply_request_status_transition) already permits for requesters
-- (OLD.status IN ('draft','submitted','pending_approval','under_review') ->
-- 'cancelled'). Every other branch below is preserved byte-for-byte from the
-- live policy definition (fetched via pg_policies immediately before writing
-- this migration — the policy was last rewritten by migration 096).

DROP POLICY IF EXISTS "supply_requests_fulfillment" ON public.supply_requests;

CREATE POLICY "supply_requests_fulfillment" ON public.supply_requests
FOR UPDATE
USING (
  has_any_role(ARRAY['admin','system_admin','facilities_manager','cmc','purchasing'])
  OR (
    has_any_role(ARRAY['court_aide'])
    AND status = ANY (ARRAY['submitted','received','picking','ready','approved','in_progress','completed','picked_up','delivered','fulfilled'])
  )
  OR (
    requester_id = auth.uid()
    AND status = ANY (ARRAY['pending_approval','submitted'])
  )
)
WITH CHECK (
  has_any_role(ARRAY['admin','system_admin','facilities_manager','cmc','purchasing'])
  OR (
    has_any_role(ARRAY['court_aide'])
    AND status = ANY (ARRAY['received','picking','ready','in_progress','completed','picked_up','delivered','fulfilled'])
  )
  OR (
    requester_id = auth.uid()
    AND status = ANY (ARRAY['pending_approval','cancelled'])
  )
);
