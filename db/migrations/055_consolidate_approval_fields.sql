-- =============================================================================
-- Migration 055: Consolidate User Approval Fields
--
-- Audit Finding: MEDIUM-6
-- User approval is tracked via TWO separate fields:
-- 1. profiles.verification_status (enum: 'pending', 'verified', 'rejected')
-- 2. profiles.is_approved (boolean)
--
-- This creates potential for inconsistent states like:
-- - verification_status = 'verified' but is_approved = false
-- - verification_status = 'pending' but is_approved = true
--
-- Solution:
-- - Use verification_status as single source of truth (more expressive)
-- - Keep is_approved for backward compatibility but enforce consistency
-- - Add database constraint to prevent inconsistent states
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Audit current state and identify inconsistencies
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_total int;
  v_inconsistent int;
  v_pending_approved int;
  v_verified_not_approved int;
  v_rejected_approved int;
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'User Approval Fields - Current State Audit';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  
  -- Total users
  SELECT COUNT(*) INTO v_total FROM profiles;
  RAISE NOTICE 'Total users: %', v_total;
  
  -- Inconsistent states
  SELECT COUNT(*) INTO v_inconsistent
  FROM profiles
  WHERE (verification_status = 'verified' AND is_approved = false)
     OR (verification_status IN ('pending', 'rejected') AND is_approved = true);
  
  IF v_inconsistent > 0 THEN
    RAISE WARNING 'Found % users with inconsistent approval state', v_inconsistent;
  ELSE
    RAISE NOTICE 'No inconsistent states found';
  END IF;
  
  -- Specific inconsistencies
  SELECT COUNT(*) INTO v_pending_approved
  FROM profiles
  WHERE verification_status = 'pending' AND is_approved = true;
  
  SELECT COUNT(*) INTO v_verified_not_approved
  FROM profiles
  WHERE verification_status = 'verified' AND is_approved = false;
  
  SELECT COUNT(*) INTO v_rejected_approved
  FROM profiles
  WHERE verification_status = 'rejected' AND is_approved = true;
  
  IF v_pending_approved > 0 THEN
    RAISE WARNING '  - % users: pending but approved', v_pending_approved;
  END IF;
  
  IF v_verified_not_approved > 0 THEN
    RAISE WARNING '  - % users: verified but not approved', v_verified_not_approved;
  END IF;
  
  IF v_rejected_approved > 0 THEN
    RAISE WARNING '  - % users: rejected but approved', v_rejected_approved;
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ---------------------------------------------------------------------------
-- 2. Fix inconsistent states (use verification_status as source of truth)
-- ---------------------------------------------------------------------------

-- Users with verification_status = 'verified' should have is_approved = true
UPDATE profiles
SET is_approved = true
WHERE verification_status = 'verified'
  AND is_approved = false;

-- Users with verification_status = 'pending' should have is_approved = false
UPDATE profiles
SET is_approved = false
WHERE verification_status = 'pending'
  AND is_approved = true;

-- Users with verification_status = 'rejected' should have is_approved = false
UPDATE profiles
SET is_approved = false
WHERE verification_status = 'rejected'
  AND is_approved = true;

-- Users with NULL verification_status should default to 'pending' and is_approved = false
UPDATE profiles
SET 
  verification_status = 'pending',
  is_approved = false
WHERE verification_status IS NULL;

-- Log fixes
DO $$
DECLARE
  v_fixed int;
BEGIN
  SELECT COUNT(*) INTO v_fixed
  FROM profiles
  WHERE (verification_status = 'verified' AND is_approved = true)
     OR (verification_status IN ('pending', 'rejected') AND is_approved = false);
  
  RAISE NOTICE 'Fixed inconsistent states. % users now have consistent approval status.', v_fixed;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Add database constraint to enforce consistency
-- ---------------------------------------------------------------------------

-- Drop constraint if it exists (for re-running migration)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS verification_status_consistency;

-- Add constraint: verification_status and is_approved must be consistent
ALTER TABLE profiles ADD CONSTRAINT verification_status_consistency
CHECK (
  (verification_status = 'verified' AND is_approved = true) OR
  (verification_status = 'pending' AND is_approved = false) OR
  (verification_status = 'rejected' AND is_approved = false)
);

COMMENT ON CONSTRAINT verification_status_consistency ON profiles IS 
  'Ensures verification_status and is_approved are always consistent. verification_status is the source of truth.';

-- ---------------------------------------------------------------------------
-- 4. Create helper function to set approval status atomically
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_user_approval_status(
  p_user_id uuid,
  p_status verification_status_enum
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update both fields atomically to maintain consistency
  UPDATE profiles
  SET
    verification_status = p_status,
    is_approved = CASE
      WHEN p_status = 'verified' THEN true
      ELSE false
    END,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION set_user_approval_status(uuid, verification_status_enum) IS 
  'Atomically sets user approval status, ensuring verification_status and is_approved remain consistent.';

-- ---------------------------------------------------------------------------
-- 5. Update existing RPC functions to use new helper
-- ---------------------------------------------------------------------------

-- Update approve_user_verification to use helper function
CREATE OR REPLACE FUNCTION approve_user_verification(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use helper to ensure consistency
  PERFORM set_user_approval_status(p_user_id, 'verified');
  
  -- Also mark as onboarded
  UPDATE profiles
  SET onboarded = true
  WHERE id = p_user_id;
  
  -- Log admin action
  INSERT INTO admin_actions (user_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'approve_user',
    p_user_id,
    jsonb_build_object('timestamp', NOW())
  );
END;
$$;

-- Update reject_user_verification to use helper function
CREATE OR REPLACE FUNCTION reject_user_verification(
  p_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use helper to ensure consistency
  PERFORM set_user_approval_status(p_user_id, 'rejected');
  
  -- Log admin action with reason
  INSERT INTO admin_actions (user_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'reject_user',
    p_user_id,
    jsonb_build_object(
      'timestamp', NOW(),
      'reason', p_reason
    )
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Add helpful comments
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN profiles.verification_status IS 
  'User verification status - SOURCE OF TRUTH for approval state. Values: pending (awaiting admin approval), verified (approved by admin), rejected (denied by admin).';

COMMENT ON COLUMN profiles.is_approved IS 
  'Legacy boolean approval flag - kept for backward compatibility. MUST match verification_status (verified = true, pending/rejected = false). Use verification_status as source of truth.';

-- ---------------------------------------------------------------------------
-- 7. Verification
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_total int;
  v_verified int;
  v_pending int;
  v_rejected int;
  v_inconsistent int;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'User Approval Fields - Post-Migration State';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  
  SELECT COUNT(*) INTO v_total FROM profiles;
  SELECT COUNT(*) INTO v_verified FROM profiles WHERE verification_status = 'verified';
  SELECT COUNT(*) INTO v_pending FROM profiles WHERE verification_status = 'pending';
  SELECT COUNT(*) INTO v_rejected FROM profiles WHERE verification_status = 'rejected';
  
  RAISE NOTICE 'Total users: %', v_total;
  RAISE NOTICE '  - Verified: %', v_verified;
  RAISE NOTICE '  - Pending: %', v_pending;
  RAISE NOTICE '  - Rejected: %', v_rejected;
  RAISE NOTICE '';
  
  -- Check for any remaining inconsistencies (should be 0)
  SELECT COUNT(*) INTO v_inconsistent
  FROM profiles
  WHERE (verification_status = 'verified' AND is_approved = false)
     OR (verification_status IN ('pending', 'rejected') AND is_approved = true);
  
  IF v_inconsistent > 0 THEN
    RAISE EXCEPTION 'Migration failed: % users still have inconsistent state', v_inconsistent;
  ELSE
    RAISE NOTICE '✓ All users have consistent approval state';
  END IF;
  
  RAISE NOTICE '✓ Database constraint added: verification_status_consistency';
  RAISE NOTICE '✓ Helper function created: set_user_approval_status()';
  RAISE NOTICE '✓ RPC functions updated: approve_user_verification(), reject_user_verification()';
  RAISE NOTICE '';
  RAISE NOTICE 'Going forward:';
  RAISE NOTICE '  - Use verification_status as source of truth';
  RAISE NOTICE '  - is_approved will be kept in sync automatically via constraint';
  RAISE NOTICE '  - Use set_user_approval_status() to change approval status';
  RAISE NOTICE '  - Frontend should check verification_status, not is_approved';
END $$;

-- ---------------------------------------------------------------------------
-- ROLLBACK SCRIPT (save to db/rollbacks/055_rollback.sql)
-- ---------------------------------------------------------------------------
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS verification_status_consistency;
-- DROP FUNCTION IF EXISTS set_user_approval_status(uuid, verification_status_enum);
-- -- Note: RPC functions would need to be restored to previous versions
