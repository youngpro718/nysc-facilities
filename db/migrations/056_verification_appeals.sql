-- =============================================================================
-- Migration 056: User Re-Application Workflow (Verification Appeals)
--
-- Audit Finding: MEDIUM-7
-- Rejected users have no way to appeal or re-apply for access.
-- Once rejected, they're permanently locked out with no recourse.
--
-- Solution:
-- - Create verification_appeals table for rejected users to request review
-- - Add admin UI to review and approve/reject appeals
-- - On approval, reset user to 'pending' status for re-review
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create verification_appeals table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS verification_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  appeal_reason text NOT NULL,
  additional_info text,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending' NOT NULL,
  admin_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 2. Add indexes for performance
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_verification_appeals_user_id 
  ON verification_appeals(user_id);

CREATE INDEX IF NOT EXISTS idx_verification_appeals_status 
  ON verification_appeals(status) 
  WHERE status = 'pending'; -- Partial index for pending appeals

CREATE INDEX IF NOT EXISTS idx_verification_appeals_submitted_at 
  ON verification_appeals(submitted_at DESC);

-- ---------------------------------------------------------------------------
-- 3. Add updated_at trigger
-- ---------------------------------------------------------------------------

CREATE TRIGGER trg_verification_appeals_updated_at
  BEFORE UPDATE ON verification_appeals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4. Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE verification_appeals ENABLE ROW LEVEL SECURITY;

-- Users can view their own appeals
DROP POLICY IF EXISTS verification_appeals_read_own ON verification_appeals;
CREATE POLICY verification_appeals_read_own ON verification_appeals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can create appeals (only if they're rejected)
DROP POLICY IF EXISTS verification_appeals_insert ON verification_appeals;
CREATE POLICY verification_appeals_insert ON verification_appeals
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND verification_status = 'rejected'
    )
  );

-- Admins can view all appeals
DROP POLICY IF EXISTS verification_appeals_admin_read ON verification_appeals;
CREATE POLICY verification_appeals_admin_read ON verification_appeals
  FOR SELECT TO authenticated
  USING (is_admin());

-- Admins can update appeals (review them)
DROP POLICY IF EXISTS verification_appeals_admin_update ON verification_appeals;
CREATE POLICY verification_appeals_admin_update ON verification_appeals
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 5. Create RPC function to submit appeal
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION submit_verification_appeal(
  p_appeal_reason text,
  p_additional_info text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_verification_status text;
  v_appeal_id uuid;
  v_existing_pending int;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user is rejected
  SELECT verification_status INTO v_verification_status
  FROM profiles
  WHERE id = v_user_id;
  
  IF v_verification_status != 'rejected' THEN
    RAISE EXCEPTION 'Only rejected users can submit appeals';
  END IF;
  
  -- Check if user already has a pending appeal
  SELECT COUNT(*) INTO v_existing_pending
  FROM verification_appeals
  WHERE user_id = v_user_id
    AND status = 'pending';
  
  IF v_existing_pending > 0 THEN
    RAISE EXCEPTION 'You already have a pending appeal. Please wait for admin review.';
  END IF;
  
  -- Create appeal
  INSERT INTO verification_appeals (
    user_id,
    appeal_reason,
    additional_info,
    status
  ) VALUES (
    v_user_id,
    p_appeal_reason,
    p_additional_info,
    'pending'
  )
  RETURNING id INTO v_appeal_id;
  
  RETURN v_appeal_id;
END;
$$;

COMMENT ON FUNCTION submit_verification_appeal(text, text) IS 
  'Allows rejected users to submit an appeal for re-review. Returns appeal ID.';

-- ---------------------------------------------------------------------------
-- 6. Create RPC function to approve appeal
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION approve_verification_appeal(
  p_appeal_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_appeal_status text;
BEGIN
  -- Only admins can approve appeals
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can approve appeals';
  END IF;
  
  -- Get appeal details
  SELECT user_id, status INTO v_user_id, v_appeal_status
  FROM verification_appeals
  WHERE id = p_appeal_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appeal not found';
  END IF;
  
  IF v_appeal_status != 'pending' THEN
    RAISE EXCEPTION 'Appeal has already been reviewed';
  END IF;
  
  -- Update appeal status
  UPDATE verification_appeals
  SET
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    admin_notes = p_admin_notes
  WHERE id = p_appeal_id;
  
  -- Reset user to pending status for re-review
  PERFORM set_user_approval_status(v_user_id, 'pending');
  
  -- Log admin action
  INSERT INTO admin_actions (user_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'approve_appeal',
    v_user_id,
    jsonb_build_object(
      'appeal_id', p_appeal_id,
      'admin_notes', p_admin_notes,
      'timestamp', NOW()
    )
  );
END;
$$;

COMMENT ON FUNCTION approve_verification_appeal(uuid, text) IS 
  'Approves a verification appeal and resets user to pending status for re-review.';

-- ---------------------------------------------------------------------------
-- 7. Create RPC function to reject appeal
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION reject_verification_appeal(
  p_appeal_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_appeal_status text;
BEGIN
  -- Only admins can reject appeals
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can reject appeals';
  END IF;
  
  -- Get appeal details
  SELECT user_id, status INTO v_user_id, v_appeal_status
  FROM verification_appeals
  WHERE id = p_appeal_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appeal not found';
  END IF;
  
  IF v_appeal_status != 'pending' THEN
    RAISE EXCEPTION 'Appeal has already been reviewed';
  END IF;
  
  -- Update appeal status
  UPDATE verification_appeals
  SET
    status = 'rejected',
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    admin_notes = p_admin_notes
  WHERE id = p_appeal_id;
  
  -- User remains rejected (no status change)
  
  -- Log admin action
  INSERT INTO admin_actions (user_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'reject_appeal',
    v_user_id,
    jsonb_build_object(
      'appeal_id', p_appeal_id,
      'admin_notes', p_admin_notes,
      'timestamp', NOW()
    )
  );
END;
$$;

COMMENT ON FUNCTION reject_verification_appeal(uuid, text) IS 
  'Rejects a verification appeal. User remains in rejected status.';

-- ---------------------------------------------------------------------------
-- 8. Add helpful comments
-- ---------------------------------------------------------------------------

COMMENT ON TABLE verification_appeals IS 
  'Appeals submitted by rejected users requesting re-review of their account. Admins can approve (reset to pending) or reject (remain rejected).';

COMMENT ON COLUMN verification_appeals.appeal_reason IS 
  'User-provided reason for appeal (required).';

COMMENT ON COLUMN verification_appeals.additional_info IS 
  'Optional additional information or documentation provided by user.';

COMMENT ON COLUMN verification_appeals.status IS 
  'Appeal status: pending (awaiting review), approved (user reset to pending), rejected (appeal denied).';

COMMENT ON COLUMN verification_appeals.admin_notes IS 
  'Admin notes explaining approval or rejection decision.';

-- ---------------------------------------------------------------------------
-- 9. Verification
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Verification Appeals System - Installation Complete';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Table created: verification_appeals';
  RAISE NOTICE '  - Users can submit appeals if rejected';
  RAISE NOTICE '  - Admins can approve (reset to pending) or reject appeals';
  RAISE NOTICE '  - RLS policies enforce access control';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  - submit_verification_appeal(reason, additional_info)';
  RAISE NOTICE '  - approve_verification_appeal(appeal_id, admin_notes)';
  RAISE NOTICE '  - reject_verification_appeal(appeal_id, admin_notes)';
  RAISE NOTICE '';
  RAISE NOTICE 'Workflow:';
  RAISE NOTICE '  1. Rejected user submits appeal with reason';
  RAISE NOTICE '  2. Admin reviews appeal in admin panel';
  RAISE NOTICE '  3. Admin approves → user reset to pending for re-review';
  RAISE NOTICE '  4. Admin rejects → user remains rejected';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Update frontend to add appeal UI';
END $$;

-- ---------------------------------------------------------------------------
-- ROLLBACK SCRIPT (save to db/rollbacks/056_rollback.sql)
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS submit_verification_appeal(text, text);
-- DROP FUNCTION IF EXISTS approve_verification_appeal(uuid, text);
-- DROP FUNCTION IF EXISTS reject_verification_appeal(uuid, text);
-- DROP TABLE IF EXISTS verification_appeals;
