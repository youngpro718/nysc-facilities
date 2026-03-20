-- =============================================================================
-- Migration 039: Fix admin roles + spatial write scope
--
-- Audit findings addressed:
--   C-1: is_admin() only recognizes 'admin', not 'system_admin'
--   C-4: is_privileged() must include facilities_manager
--   C-7: CMC should not have write access to spatial catalog tables
--
-- This migration is intentionally later than the base RLS migrations so it can
-- override the broader helper functions and re-scope the court operation policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'system_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_privileged()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'system_admin', 'facilities_manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_court_operations_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'system_admin', 'cmc')
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Court operations tables
--    CMC may write court scheduling data, but not the spatial catalog.
-- ---------------------------------------------------------------------------

ALTER TABLE court_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS court_sessions_write ON court_sessions;
CREATE POLICY court_sessions_write ON court_sessions
  FOR ALL TO authenticated
  USING (is_court_operations_manager())
  WITH CHECK (is_court_operations_manager());

ALTER TABLE court_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS court_rooms_write ON court_rooms;
CREATE POLICY court_rooms_write ON court_rooms
  FOR ALL TO authenticated
  USING (is_court_operations_manager())
  WITH CHECK (is_court_operations_manager());

-- ---------------------------------------------------------------------------
-- 3. Spatial catalog tables remain privileged-only for writes
-- ---------------------------------------------------------------------------

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS buildings_write ON buildings;
CREATE POLICY buildings_write ON buildings
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS floors_write ON floors;
CREATE POLICY floors_write ON floors
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rooms_write ON rooms;
CREATE POLICY rooms_write ON rooms
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

ALTER TABLE occupants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS occupants_write ON occupants;
CREATE POLICY occupants_write ON occupants
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

ALTER TABLE key_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS key_assignments_write ON key_assignments;
CREATE POLICY key_assignments_write ON key_assignments
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

-- ---------------------------------------------------------------------------
-- 4. Profiles and general admin access
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_admin_write ON public.profiles;
CREATE POLICY profiles_admin_write ON public.profiles
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS profiles_admin_insert ON public.profiles;
CREATE POLICY profiles_admin_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Ensure the canonical helper exists for future migrations as well.
COMMENT ON FUNCTION public.is_admin() IS 'Returns true for admin and system_admin roles.';
COMMENT ON FUNCTION public.is_privileged() IS 'Returns true for admin, system_admin, and facilities_manager roles.';
COMMENT ON FUNCTION public.is_court_operations_manager() IS 'Returns true for admin, system_admin, and cmc roles for court operations data.';
