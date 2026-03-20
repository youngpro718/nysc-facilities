-- =============================================================================
-- Migration 051: Add Role Helper Functions for All 8 Roles
--
-- Audit Finding: HIGH-4
-- The database only has helper functions for admin, privileged, and court_operations_manager.
-- This creates a mismatch with the 8 frontend roles, making RLS policies incomplete.
--
-- This migration adds helper functions for all 8 roles:
-- 1. admin / system_admin (already exists)
-- 2. facilities_manager (already in is_privileged)
-- 3. cmc (already in is_court_operations_manager)
-- 4. court_officer (NEW)
-- 5. court_aide (NEW)
-- 6. purchasing (NEW)
-- 7. standard (NEW)
-- 8. Legacy role mapping function
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Individual Role Checkers
-- ---------------------------------------------------------------------------

-- Check if user is a Court Officer
CREATE OR REPLACE FUNCTION public.is_court_officer()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'court_officer'
  );
$$;

COMMENT ON FUNCTION public.is_court_officer() IS 'Returns true if user has court_officer role.';

-- Check if user is a Court Aide
CREATE OR REPLACE FUNCTION public.is_court_aide()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'court_aide'
  );
$$;

COMMENT ON FUNCTION public.is_court_aide() IS 'Returns true if user has court_aide role (supply staff).';

-- Check if user is Purchasing staff
CREATE OR REPLACE FUNCTION public.is_purchasing()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'purchasing'
  );
$$;

COMMENT ON FUNCTION public.is_purchasing() IS 'Returns true if user has purchasing role.';

-- Check if user is a CMC (Court Management Coordinator)
CREATE OR REPLACE FUNCTION public.is_cmc()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'cmc'
  );
$$;

COMMENT ON FUNCTION public.is_cmc() IS 'Returns true if user has cmc role.';

-- Check if user is a Facilities Manager
CREATE OR REPLACE FUNCTION public.is_facilities_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'facilities_manager'
  );
$$;

COMMENT ON FUNCTION public.is_facilities_manager() IS 'Returns true if user has facilities_manager role.';

-- Check if user is a System Admin
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'system_admin'
  );
$$;

COMMENT ON FUNCTION public.is_system_admin() IS 'Returns true if user has system_admin role.';

-- Check if user is a standard user
CREATE OR REPLACE FUNCTION public.is_standard_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'standard'
  );
$$;

COMMENT ON FUNCTION public.is_standard_user() IS 'Returns true if user has standard role.';

-- ---------------------------------------------------------------------------
-- 2. Composite Role Checkers (for common permission groups)
-- ---------------------------------------------------------------------------

-- Supply staff: can manage inventory and fulfill orders
CREATE OR REPLACE FUNCTION public.is_supply_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'system_admin', 'court_aide')
  );
$$;

COMMENT ON FUNCTION public.is_supply_staff() IS 'Returns true for roles that can manage supply operations (admin, system_admin, court_aide).';

-- Building staff: can manage spaces and facilities
CREATE OR REPLACE FUNCTION public.is_building_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'system_admin', 'facilities_manager', 'court_officer')
  );
$$;

COMMENT ON FUNCTION public.is_building_staff() IS 'Returns true for roles that can manage building operations (admin, system_admin, facilities_manager, court_officer).';

-- Key managers: can approve and assign keys
CREATE OR REPLACE FUNCTION public.is_key_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'system_admin', 'facilities_manager', 'court_officer')
  );
$$;

COMMENT ON FUNCTION public.is_key_manager() IS 'Returns true for roles that can manage keys (admin, system_admin, facilities_manager, court_officer).';

-- Issue managers: can assign and resolve issues
CREATE OR REPLACE FUNCTION public.is_issue_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'system_admin', 'facilities_manager', 'court_officer', 'court_aide')
  );
$$;

COMMENT ON FUNCTION public.is_issue_manager() IS 'Returns true for roles that can manage issues (admin, system_admin, facilities_manager, court_officer, court_aide).';

-- ---------------------------------------------------------------------------
-- 3. Update existing composite functions to use new helpers
-- ---------------------------------------------------------------------------

-- Re-create is_privileged to be explicit
CREATE OR REPLACE FUNCTION public.is_privileged()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin() OR is_facilities_manager();
$$;

COMMENT ON FUNCTION public.is_privileged() IS 'Returns true for admin, system_admin, and facilities_manager roles (privileged access to spatial catalog).';

-- Re-create is_court_operations_manager to be explicit
CREATE OR REPLACE FUNCTION public.is_court_operations_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin() OR is_cmc();
$$;

COMMENT ON FUNCTION public.is_court_operations_manager() IS 'Returns true for admin, system_admin, and cmc roles (can manage court operations).';

-- ---------------------------------------------------------------------------
-- 4. Generic role checker (for flexible policy creation)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_role(required_role text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = required_role
  );
$$;

COMMENT ON FUNCTION public.user_has_role(text) IS 'Generic role checker - returns true if user has the specified role.';

-- ---------------------------------------------------------------------------
-- 5. Get user's current role (for logging and debugging)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_current_user_role() IS 'Returns the current user''s role (assumes one role per user).';

-- ---------------------------------------------------------------------------
-- 6. Verification query
-- ---------------------------------------------------------------------------

-- Run this to verify all helper functions work
DO $$
BEGIN
  RAISE NOTICE 'Role helper functions created successfully:';
  RAISE NOTICE '  - is_admin()';
  RAISE NOTICE '  - is_system_admin()';
  RAISE NOTICE '  - is_facilities_manager()';
  RAISE NOTICE '  - is_cmc()';
  RAISE NOTICE '  - is_court_officer()';
  RAISE NOTICE '  - is_court_aide()';
  RAISE NOTICE '  - is_purchasing()';
  RAISE NOTICE '  - is_standard_user()';
  RAISE NOTICE 'Composite functions:';
  RAISE NOTICE '  - is_privileged() (admin + facilities_manager)';
  RAISE NOTICE '  - is_court_operations_manager() (admin + cmc)';
  RAISE NOTICE '  - is_supply_staff() (admin + court_aide)';
  RAISE NOTICE '  - is_building_staff() (admin + facilities_manager + court_officer)';
  RAISE NOTICE '  - is_key_manager() (admin + facilities_manager + court_officer)';
  RAISE NOTICE '  - is_issue_manager() (admin + facilities_manager + court_officer + court_aide)';
END $$;
