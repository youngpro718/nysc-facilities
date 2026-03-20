-- =============================================================================
-- Migration 040: Supply request approval role restriction
--
-- Audit finding addressed:
--   C-8: court_aide can approve their own supply requests via the API because
--        the current RLS update policy only checks role membership, not the
--        status transition being made.
--
-- This migration splits the update policy so court_aide can fulfill requests
-- in the downstream pipeline, but cannot move anything through the approval
-- gate (pending_approval -> approved).
-- =============================================================================

ALTER TABLE supply_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supply_requests_update ON supply_requests;
DROP POLICY IF EXISTS supply_requests_fulfillment ON supply_requests;

CREATE POLICY supply_requests_fulfillment ON supply_requests
  FOR UPDATE TO authenticated
  USING (
    has_any_role(ARRAY['admin', 'system_admin', 'facilities_manager', 'cmc'])
    OR (
      has_any_role(ARRAY['court_aide'])
      AND status <> 'pending_approval'
    )
    OR requester_id = auth.uid()
  )
  WITH CHECK (
    has_any_role(ARRAY['admin', 'system_admin', 'facilities_manager', 'cmc'])
    OR (
      has_any_role(ARRAY['court_aide'])
      AND status <> 'pending_approval'
    )
    OR requester_id = auth.uid()
  );

COMMENT ON POLICY supply_requests_fulfillment ON supply_requests IS
  'Allows fulfillment-stage updates for privileged users and court aides, but blocks court_aide approval of pending_approval requests.';
