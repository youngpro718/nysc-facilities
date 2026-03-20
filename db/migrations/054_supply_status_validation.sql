-- =============================================================================
-- Migration 054: Database-Level Supply Request Status Transition Validation
--
-- Audit Finding: MEDIUM-5
-- Supply request status transitions are only validated in TypeScript frontend.
-- This allows invalid state changes via direct database access or buggy API calls.
--
-- This migration implements database-level enforcement of valid status transitions
-- using a lookup table and trigger.
--
-- Valid transitions (from src/features/supply/constants.ts):
-- submitted → received, cancelled, rejected
-- pending_approval → approved, rejected
-- approved → received, cancelled
-- received → picking, cancelled, rejected
-- picking → ready, cancelled
-- ready → completed, cancelled
-- completed → (terminal state)
-- cancelled → (terminal state)
-- rejected → (terminal state)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create status transition lookup table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS supply_status_transitions (
  from_status text NOT NULL,
  to_status text NOT NULL,
  description text,
  PRIMARY KEY (from_status, to_status)
);

COMMENT ON TABLE supply_status_transitions IS 'Valid supply request status transitions. Enforced by trigger on supply_requests table.';

-- ---------------------------------------------------------------------------
-- 2. Populate valid transitions
-- ---------------------------------------------------------------------------

INSERT INTO supply_status_transitions (from_status, to_status, description) VALUES
  -- From submitted
  ('submitted', 'received', 'Supply room accepts standard order'),
  ('submitted', 'cancelled', 'User cancels before processing'),
  ('submitted', 'rejected', 'Supply room rejects order'),
  
  -- From pending_approval
  ('pending_approval', 'approved', 'Admin approves restricted items'),
  ('pending_approval', 'rejected', 'Admin rejects request'),
  
  -- From approved
  ('approved', 'received', 'Supply room accepts approved order'),
  ('approved', 'cancelled', 'User cancels after approval'),
  
  -- From received
  ('received', 'picking', 'Worker starts pulling items'),
  ('received', 'cancelled', 'User cancels after acceptance'),
  ('received', 'rejected', 'Supply room rejects after review'),
  
  -- From picking
  ('picking', 'ready', 'Order packed and ready for pickup'),
  ('picking', 'cancelled', 'User cancels during picking'),
  
  -- From ready
  ('ready', 'completed', 'User picks up order'),
  ('ready', 'cancelled', 'User cancels before pickup'),
  
  -- Terminal states (no transitions out)
  -- completed, cancelled, rejected have no valid transitions
  
  -- Allow same-status updates (for updating other fields without changing status)
  ('submitted', 'submitted', 'Update without status change'),
  ('pending_approval', 'pending_approval', 'Update without status change'),
  ('approved', 'approved', 'Update without status change'),
  ('received', 'received', 'Update without status change'),
  ('picking', 'picking', 'Update without status change'),
  ('ready', 'ready', 'Update without status change'),
  ('completed', 'completed', 'Update without status change'),
  ('cancelled', 'cancelled', 'Update without status change'),
  ('rejected', 'rejected', 'Update without status change')
ON CONFLICT (from_status, to_status) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Create validation function
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_supply_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only validate if status is actually changing
  IF OLD.status IS NOT NULL AND NEW.status != OLD.status THEN
    -- Check if transition is valid
    IF NOT EXISTS (
      SELECT 1 
      FROM supply_status_transitions
      WHERE from_status = OLD.status::text 
        AND to_status = NEW.status::text
    ) THEN
      RAISE EXCEPTION 'Invalid supply request status transition: % → %. Valid transitions from % are: %',
        OLD.status,
        NEW.status,
        OLD.status,
        (
          SELECT string_agg(to_status, ', ' ORDER BY to_status)
          FROM supply_status_transitions
          WHERE from_status = OLD.status::text
            AND from_status != to_status -- Exclude same-status transitions from error message
        );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION validate_supply_status_transition() IS 'Validates supply request status transitions against allowed transitions table.';

-- ---------------------------------------------------------------------------
-- 4. Apply trigger to supply_requests table
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_validate_supply_status_transition ON supply_requests;

CREATE TRIGGER trg_validate_supply_status_transition
  BEFORE UPDATE ON supply_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_supply_status_transition();

COMMENT ON TRIGGER trg_validate_supply_status_transition ON supply_requests IS 'Enforces valid status transitions at database level.';

-- ---------------------------------------------------------------------------
-- 5. Create helper function to get valid next statuses
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_valid_next_statuses(current_status text)
RETURNS text[]
LANGUAGE sql
STABLE
AS $$
  SELECT array_agg(to_status ORDER BY to_status)
  FROM supply_status_transitions
  WHERE from_status = current_status
    AND from_status != to_status; -- Exclude same-status transitions
$$;

COMMENT ON FUNCTION get_valid_next_statuses(text) IS 'Returns array of valid next statuses for a given current status.';

-- ---------------------------------------------------------------------------
-- 6. Add index for performance
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_supply_status_transitions_from
  ON supply_status_transitions(from_status);

-- ---------------------------------------------------------------------------
-- 7. Verification and testing
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_test_id uuid;
  v_error_caught boolean := false;
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Supply Status Transition Validation - Verification';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  
  -- Show all valid transitions
  RAISE NOTICE 'Valid status transitions:';
  FOR v_test_id IN 
    SELECT DISTINCT from_status 
    FROM supply_status_transitions 
    WHERE from_status != to_status
    ORDER BY from_status
  LOOP
    RAISE NOTICE '  % → %', 
      v_test_id,
      (SELECT string_agg(to_status, ', ' ORDER BY to_status)
       FROM supply_status_transitions
       WHERE from_status = v_test_id::text
         AND from_status != to_status);
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Trigger installed: trg_validate_supply_status_transition';
  RAISE NOTICE 'Function created: validate_supply_status_transition()';
  RAISE NOTICE 'Helper function: get_valid_next_statuses(text)';
  RAISE NOTICE '';
  RAISE NOTICE 'Status transition validation is now enforced at database level.';
  RAISE NOTICE 'Invalid transitions will raise an exception with helpful error message.';
  RAISE NOTICE '';
  RAISE NOTICE 'Example usage:';
  RAISE NOTICE '  SELECT get_valid_next_statuses(''submitted'');';
  RAISE NOTICE '  -- Returns: {cancelled,received,rejected}';
END $$;

-- ---------------------------------------------------------------------------
-- ROLLBACK SCRIPT (save to db/rollbacks/054_rollback.sql)
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS trg_validate_supply_status_transition ON supply_requests;
-- DROP FUNCTION IF EXISTS validate_supply_status_transition();
-- DROP FUNCTION IF EXISTS get_valid_next_statuses(text);
-- DROP TABLE IF EXISTS supply_status_transitions;
