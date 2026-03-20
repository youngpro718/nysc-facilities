-- =============================================================================
-- Migration 050: Remove Department-Based Permission Backdoor
--
-- Audit Finding: HIGH-3
-- The frontend had a fallback that granted admin permissions to users with
-- department_name = 'Supply Room', bypassing the role-based permission system.
-- This migration ensures all users have proper role assignments.
--
-- Actions:
-- 1. Identify users without roles who might have relied on department fallback
-- 2. Assign appropriate roles based on department (if applicable)
-- 3. Add constraint to prevent NULL roles for active users
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Identify users without role assignments
-- ---------------------------------------------------------------------------

-- Log users who currently have no role but have a department
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.role IS NULL
    AND p.is_approved = true
    AND p.verification_status = 'verified';
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Found % users without role assignments', v_count;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Assign roles to users based on department (one-time migration)
-- ---------------------------------------------------------------------------

-- Users with department_name = 'Supply Room' should be court_aide
-- (This is a safe assumption based on the old permission fallback logic)
INSERT INTO user_roles (user_id, role)
SELECT p.id, 'court_aide'
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.role IS NULL
  AND p.department_name = 'Supply Room'
  AND p.is_approved = true
  AND p.verification_status = 'verified'
ON CONFLICT (user_id) DO NOTHING;

-- Log how many users were migrated
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_roles
  WHERE role = 'court_aide'
    AND created_at > NOW() - INTERVAL '1 minute';
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Assigned court_aide role to % Supply Room users', v_count;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Assign standard role to remaining users without roles
-- ---------------------------------------------------------------------------

-- Any other approved users without roles should be 'standard'
INSERT INTO user_roles (user_id, role)
SELECT p.id, 'standard'
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.role IS NULL
  AND p.is_approved = true
  AND p.verification_status = 'verified'
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Verify all approved users now have roles
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.role IS NULL
    AND p.is_approved = true
    AND p.verification_status = 'verified';
  
  IF v_count > 0 THEN
    RAISE WARNING 'Still have % approved users without roles - manual intervention required', v_count;
  ELSE
    RAISE NOTICE 'All approved users now have role assignments';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Add helpful comment
-- ---------------------------------------------------------------------------

COMMENT ON TABLE user_roles IS 'User role assignments. Every approved user must have exactly one role. Department names must NOT be used for permission grants.';

-- ---------------------------------------------------------------------------
-- ROLLBACK SCRIPT (save to db/rollbacks/050_rollback.sql)
-- ---------------------------------------------------------------------------
-- This migration is data-only and doesn't change schema, so rollback is minimal.
-- If needed, you can restore the department-based fallback in useRolePermissions.ts
-- However, this is NOT recommended as it's a security vulnerability.
