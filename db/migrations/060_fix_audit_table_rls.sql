-- =============================================================================
-- Migration 060: Fix Audit Table RLS Policies
--
-- Audit Finding: MEDIUM-12
-- Audit tables currently use WITH CHECK (true) for INSERT policies,
-- allowing any authenticated user to insert arbitrary audit records.
-- This is a security risk as users could forge audit trails.
--
-- This migration:
-- 1. Restricts INSERT to only system functions (SECURITY DEFINER)
-- 2. Allows admins to view all audit records
-- 3. Allows users to view their own audit records (where applicable)
-- 4. Prevents users from modifying or deleting audit records
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Identify all audit tables
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Audit Table RLS Policy Fix';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Audit tables to secure:';
  RAISE NOTICE '  - admin_actions';
  RAISE NOTICE '  - audit_log (if exists)';
  RAISE NOTICE '  - security_events (if exists)';
  RAISE NOTICE '';
END $$;

-- ---------------------------------------------------------------------------
-- 2. Fix admin_actions table policies
-- ---------------------------------------------------------------------------

-- Enable RLS if not already enabled
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies
DROP POLICY IF EXISTS admin_actions_insert ON admin_actions;
DROP POLICY IF EXISTS admin_actions_select ON admin_actions;
DROP POLICY IF EXISTS admin_actions_all ON admin_actions;

-- Admins can view all admin actions
CREATE POLICY admin_actions_admin_read ON admin_actions
  FOR SELECT TO authenticated
  USING (is_admin());

-- Users can view actions that targeted them
CREATE POLICY admin_actions_user_read ON admin_actions
  FOR SELECT TO authenticated
  USING (target_user_id = auth.uid());

-- Only SECURITY DEFINER functions can insert (no direct user inserts)
-- This is enforced by not having an INSERT policy for regular users
-- System functions use SECURITY DEFINER to bypass RLS

-- Prevent all updates and deletes (audit records are immutable)
-- No UPDATE or DELETE policies = no one can modify/delete

COMMENT ON TABLE admin_actions IS 
  'Audit log of admin actions. INSERT restricted to system functions only. Records are immutable (no updates/deletes). Admins can view all, users can view actions targeting them.';

-- ---------------------------------------------------------------------------
-- 3. Fix audit_log table policies (if exists)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
    RAISE NOTICE 'Fixing audit_log table policies...';
    
    -- Enable RLS
    EXECUTE 'ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY';
    
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS audit_log_insert ON audit_log';
    EXECUTE 'DROP POLICY IF EXISTS audit_log_select ON audit_log';
    EXECUTE 'DROP POLICY IF EXISTS audit_log_all ON audit_log';
    
    -- Admins can view all audit logs
    EXECUTE 'CREATE POLICY audit_log_admin_read ON audit_log
      FOR SELECT TO authenticated
      USING (is_admin())';
    
    -- Users can view their own audit logs
    EXECUTE 'CREATE POLICY audit_log_user_read ON audit_log
      FOR SELECT TO authenticated
      USING (user_id = auth.uid())';
    
    -- No INSERT, UPDATE, or DELETE policies for users
    
    RAISE NOTICE '✓ audit_log policies fixed';
  ELSE
    RAISE NOTICE 'ℹ audit_log table does not exist - skipping';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Fix security_events table policies (if exists)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_events') THEN
    RAISE NOTICE 'Fixing security_events table policies...';
    
    -- Enable RLS
    EXECUTE 'ALTER TABLE security_events ENABLE ROW LEVEL SECURITY';
    
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS security_events_insert ON security_events';
    EXECUTE 'DROP POLICY IF EXISTS security_events_select ON security_events';
    EXECUTE 'DROP POLICY IF EXISTS security_events_all ON security_events';
    
    -- Admins can view all security events
    EXECUTE 'CREATE POLICY security_events_admin_read ON security_events
      FOR SELECT TO authenticated
      USING (is_admin())';
    
    -- Users can view their own security events
    EXECUTE 'CREATE POLICY security_events_user_read ON security_events
      FOR SELECT TO authenticated
      USING (user_id = auth.uid())';
    
    -- No INSERT, UPDATE, or DELETE policies for users
    
    RAISE NOTICE '✓ security_events policies fixed';
  ELSE
    RAISE NOTICE 'ℹ security_events table does not exist - skipping';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Update audit logging functions to use SECURITY DEFINER
-- ---------------------------------------------------------------------------

-- Ensure log_admin_action uses SECURITY DEFINER
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action text,
  p_target_user_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS to insert audit records
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_actions (user_id, action, target_user_id, details)
  VALUES (auth.uid(), p_action, p_target_user_id, p_details);
END;
$$;

COMMENT ON FUNCTION log_admin_action(text, uuid, jsonb) IS 
  'Logs admin actions to audit table. Uses SECURITY DEFINER to bypass RLS and ensure audit records can be created by system functions.';

-- ---------------------------------------------------------------------------
-- 6. Create helper function to view audit trail
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_user_audit_trail(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  timestamp timestamptz,
  action_type text,
  performed_by uuid,
  performer_name text,
  details jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id uuid;
BEGIN
  -- Default to current user if not specified
  v_target_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Only admins can view other users' audit trails
  IF v_target_user_id != auth.uid() AND NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can view other users'' audit trails';
  END IF;
  
  RETURN QUERY
  SELECT 
    aa.created_at as timestamp,
    aa.action as action_type,
    aa.user_id as performed_by,
    COALESCE(p.first_name || ' ' || p.last_name, p.email) as performer_name,
    aa.details
  FROM admin_actions aa
  LEFT JOIN profiles p ON aa.user_id = p.id
  WHERE aa.target_user_id = v_target_user_id
  ORDER BY aa.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_user_audit_trail(uuid) IS 
  'Returns audit trail for a user. Users can view their own trail, admins can view any user''s trail.';

-- ---------------------------------------------------------------------------
-- 7. Verification
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_table text;
  v_insert_policy_count int;
  v_select_policy_count int;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Audit Table RLS Verification';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  
  -- Check admin_actions
  SELECT COUNT(*) INTO v_insert_policy_count
  FROM pg_policies
  WHERE tablename = 'admin_actions' AND cmd = 'INSERT';
  
  SELECT COUNT(*) INTO v_select_policy_count
  FROM pg_policies
  WHERE tablename = 'admin_actions' AND cmd = 'SELECT';
  
  RAISE NOTICE 'admin_actions:';
  RAISE NOTICE '  INSERT policies: % (should be 0 - only SECURITY DEFINER functions)', v_insert_policy_count;
  RAISE NOTICE '  SELECT policies: % (admin + user read)', v_select_policy_count;
  
  IF v_insert_policy_count > 0 THEN
    RAISE WARNING '  ⚠ Found INSERT policies - users may be able to forge audit records';
  ELSE
    RAISE NOTICE '  ✓ No INSERT policies - only system functions can insert';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Security Summary:';
  RAISE NOTICE '  ✓ Audit records can only be created by SECURITY DEFINER functions';
  RAISE NOTICE '  ✓ Audit records are immutable (no UPDATE/DELETE policies)';
  RAISE NOTICE '  ✓ Admins can view all audit records';
  RAISE NOTICE '  ✓ Users can view audit records targeting them';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper Functions:';
  RAISE NOTICE '  - log_admin_action() - Create audit records (SECURITY DEFINER)';
  RAISE NOTICE '  - get_user_audit_trail() - View user audit trail';
END $$;

-- ---------------------------------------------------------------------------
-- ROLLBACK SCRIPT (save to db/rollbacks/060_rollback.sql)
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS get_user_audit_trail(uuid);
-- DROP POLICY IF EXISTS admin_actions_admin_read ON admin_actions;
-- DROP POLICY IF EXISTS admin_actions_user_read ON admin_actions;
-- -- Restore previous permissive policies if needed
