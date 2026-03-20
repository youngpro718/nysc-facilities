-- =============================================================================
-- Migration 052: Audit and Fix RLS Policies for All 8 Roles
--
-- Audit Finding: HIGH-4
-- This migration audits all RLS policies to ensure they handle all 8 frontend roles:
-- 1. admin
-- 2. system_admin
-- 3. facilities_manager
-- 4. cmc
-- 5. court_officer
-- 6. court_aide
-- 7. purchasing
-- 8. standard
--
-- Strategy:
-- - Use new role helper functions from migration 051
-- - Ensure every table has appropriate read/write policies for all applicable roles
-- - Document which roles can access which tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ISSUES TABLE
-- All authenticated users can report issues
-- Issue managers can update/assign issues
-- ---------------------------------------------------------------------------

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS issues_read ON issues;
CREATE POLICY issues_read ON issues
  FOR SELECT TO authenticated
  USING (true); -- All authenticated users can view issues

DROP POLICY IF EXISTS issues_insert ON issues;
CREATE POLICY issues_insert ON issues
  FOR INSERT TO authenticated
  WITH CHECK (true); -- All authenticated users can report issues

DROP POLICY IF EXISTS issues_update ON issues;
CREATE POLICY issues_update ON issues
  FOR UPDATE TO authenticated
  USING (
    is_issue_manager() OR -- Managers can update any issue
    reported_by = auth.uid() -- Users can update their own issues
  )
  WITH CHECK (
    is_issue_manager() OR
    reported_by = auth.uid()
  );

DROP POLICY IF EXISTS issues_delete ON issues;
CREATE POLICY issues_delete ON issues
  FOR DELETE TO authenticated
  USING (is_admin()); -- Only admins can delete issues

-- ---------------------------------------------------------------------------
-- SUPPLY REQUESTS TABLE
-- Requesters can view/edit their own
-- Supply staff (court_aide) can view/manage all
-- Admins can view/manage all
-- ---------------------------------------------------------------------------

ALTER TABLE supply_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supply_requests_read ON supply_requests;
CREATE POLICY supply_requests_read ON supply_requests
  FOR SELECT TO authenticated
  USING (
    is_supply_staff() OR -- Supply staff see all
    requested_by = auth.uid() -- Users see their own
  );

DROP POLICY IF EXISTS supply_requests_insert ON supply_requests;
CREATE POLICY supply_requests_insert ON supply_requests
  FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid()); -- Users can only create requests for themselves

DROP POLICY IF EXISTS supply_requests_update ON supply_requests;
CREATE POLICY supply_requests_update ON supply_requests
  FOR UPDATE TO authenticated
  USING (
    is_supply_staff() OR -- Supply staff can update any
    (requested_by = auth.uid() AND status IN ('submitted', 'pending_approval')) -- Users can update own pending requests
  )
  WITH CHECK (
    is_supply_staff() OR
    (requested_by = auth.uid() AND status IN ('submitted', 'pending_approval'))
  );

DROP POLICY IF EXISTS supply_requests_delete ON supply_requests;
CREATE POLICY supply_requests_delete ON supply_requests
  FOR DELETE TO authenticated
  USING (is_admin()); -- Only admins can delete

-- ---------------------------------------------------------------------------
-- INVENTORY ITEMS TABLE
-- All authenticated users can view inventory
-- Supply staff can manage inventory
-- ---------------------------------------------------------------------------

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_items_read ON inventory_items;
CREATE POLICY inventory_items_read ON inventory_items
  FOR SELECT TO authenticated
  USING (true); -- All users can view inventory

DROP POLICY IF EXISTS inventory_items_write ON inventory_items;
CREATE POLICY inventory_items_write ON inventory_items
  FOR ALL TO authenticated
  USING (is_supply_staff())
  WITH CHECK (is_supply_staff());

-- ---------------------------------------------------------------------------
-- KEYS TABLE
-- All authenticated users can view keys
-- Key managers can manage keys
-- ---------------------------------------------------------------------------

ALTER TABLE keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS keys_read ON keys;
CREATE POLICY keys_read ON keys
  FOR SELECT TO authenticated
  USING (true); -- All users can view keys

DROP POLICY IF EXISTS keys_write ON keys;
CREATE POLICY keys_write ON keys
  FOR ALL TO authenticated
  USING (is_key_manager())
  WITH CHECK (is_key_manager());

-- ---------------------------------------------------------------------------
-- KEY ASSIGNMENTS TABLE
-- Users can view their own assignments
-- Key managers can view/manage all assignments
-- ---------------------------------------------------------------------------

ALTER TABLE key_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS key_assignments_read ON key_assignments;
CREATE POLICY key_assignments_read ON key_assignments
  FOR SELECT TO authenticated
  USING (
    is_key_manager() OR
    assigned_to = auth.uid()
  );

DROP POLICY IF EXISTS key_assignments_write ON key_assignments;
CREATE POLICY key_assignments_write ON key_assignments
  FOR ALL TO authenticated
  USING (is_key_manager())
  WITH CHECK (is_key_manager());

-- ---------------------------------------------------------------------------
-- ROOMS TABLE
-- All authenticated users can view rooms
-- Privileged users (admin, facilities_manager) can manage rooms
-- Court officers can update rooms (for lighting/maintenance)
-- ---------------------------------------------------------------------------

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rooms_read ON rooms;
CREATE POLICY rooms_read ON rooms
  FOR SELECT TO authenticated
  USING (true); -- All users can view rooms

DROP POLICY IF EXISTS rooms_write ON rooms;
CREATE POLICY rooms_write ON rooms
  FOR ALL TO authenticated
  USING (is_building_staff()) -- Admin, facilities_manager, court_officer
  WITH CHECK (is_building_staff());

-- ---------------------------------------------------------------------------
-- HALLWAYS TABLE
-- Same as rooms
-- ---------------------------------------------------------------------------

ALTER TABLE hallways ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hallways_read ON hallways;
CREATE POLICY hallways_read ON hallways
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS hallways_write ON hallways;
CREATE POLICY hallways_write ON hallways
  FOR ALL TO authenticated
  USING (is_building_staff())
  WITH CHECK (is_building_staff());

-- ---------------------------------------------------------------------------
-- BUILDINGS TABLE
-- All authenticated users can view buildings
-- Only privileged users can manage buildings
-- ---------------------------------------------------------------------------

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS buildings_read ON buildings;
CREATE POLICY buildings_read ON buildings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS buildings_write ON buildings;
CREATE POLICY buildings_write ON buildings
  FOR ALL TO authenticated
  USING (is_privileged()) -- Admin, facilities_manager only
  WITH CHECK (is_privileged());

-- ---------------------------------------------------------------------------
-- FLOORS TABLE
-- Same as buildings
-- ---------------------------------------------------------------------------

ALTER TABLE floors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS floors_read ON floors;
CREATE POLICY floors_read ON floors
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS floors_write ON floors;
CREATE POLICY floors_write ON floors
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

-- ---------------------------------------------------------------------------
-- OCCUPANTS TABLE
-- All authenticated users can view occupants
-- Privileged users can manage occupants
-- ---------------------------------------------------------------------------

ALTER TABLE occupants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS occupants_read ON occupants;
CREATE POLICY occupants_read ON occupants
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS occupants_write ON occupants;
CREATE POLICY occupants_write ON occupants
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

-- ---------------------------------------------------------------------------
-- COURT SESSIONS TABLE
-- All authenticated users can view court sessions
-- Court operations managers (admin, cmc) can manage sessions
-- ---------------------------------------------------------------------------

ALTER TABLE court_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS court_sessions_read ON court_sessions;
CREATE POLICY court_sessions_read ON court_sessions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS court_sessions_write ON court_sessions;
CREATE POLICY court_sessions_write ON court_sessions
  FOR ALL TO authenticated
  USING (is_court_operations_manager()) -- Admin, cmc
  WITH CHECK (is_court_operations_manager());

-- ---------------------------------------------------------------------------
-- COURT ROOMS TABLE
-- All authenticated users can view court rooms
-- Court operations managers can manage court rooms
-- ---------------------------------------------------------------------------

ALTER TABLE court_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS court_rooms_read ON court_rooms;
CREATE POLICY court_rooms_read ON court_rooms
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS court_rooms_write ON court_rooms;
CREATE POLICY court_rooms_write ON court_rooms
  FOR ALL TO authenticated
  USING (is_court_operations_manager())
  WITH CHECK (is_court_operations_manager());

-- ---------------------------------------------------------------------------
-- PROFILES TABLE
-- Users can view all profiles (for directory/contact purposes)
-- Users can update their own profile
-- Admins can update any profile
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_read ON profiles;
CREATE POLICY profiles_read ON profiles
  FOR SELECT TO authenticated
  USING (true); -- All users can view profiles

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_admin_write ON profiles;
CREATE POLICY profiles_admin_write ON profiles
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- USER_ROLES TABLE
-- Users can view their own role
-- Admins can view/manage all roles
-- ---------------------------------------------------------------------------

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_read_own ON user_roles;
CREATE POLICY user_roles_read_own ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()); -- Users can see their own role

DROP POLICY IF EXISTS user_roles_admin_read ON user_roles;
CREATE POLICY user_roles_admin_read ON user_roles
  FOR SELECT TO authenticated
  USING (is_admin()); -- Admins can see all roles

DROP POLICY IF EXISTS user_roles_admin_write ON user_roles;
CREATE POLICY user_roles_admin_write ON user_roles
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Summary and Verification
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'RLS Policy Audit Complete';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables audited and policies updated:';
  RAISE NOTICE '  ✓ issues - All roles can report, managers can assign/update';
  RAISE NOTICE '  ✓ supply_requests - Requesters + supply staff access';
  RAISE NOTICE '  ✓ inventory_items - All read, supply staff write';
  RAISE NOTICE '  ✓ keys - All read, key managers write';
  RAISE NOTICE '  ✓ key_assignments - Own + managers read, managers write';
  RAISE NOTICE '  ✓ rooms - All read, building staff write';
  RAISE NOTICE '  ✓ hallways - All read, building staff write';
  RAISE NOTICE '  ✓ buildings - All read, privileged write';
  RAISE NOTICE '  ✓ floors - All read, privileged write';
  RAISE NOTICE '  ✓ occupants - All read, privileged write';
  RAISE NOTICE '  ✓ court_sessions - All read, court ops managers write';
  RAISE NOTICE '  ✓ court_rooms - All read, court ops managers write';
  RAISE NOTICE '  ✓ profiles - All read, own update, admin full access';
  RAISE NOTICE '  ✓ user_roles - Own read, admin full access';
  RAISE NOTICE '';
  RAISE NOTICE 'Role Coverage:';
  RAISE NOTICE '  ✓ admin - Full access to all tables';
  RAISE NOTICE '  ✓ system_admin - Full access to all tables';
  RAISE NOTICE '  ✓ facilities_manager - Spatial catalog + building operations';
  RAISE NOTICE '  ✓ cmc - Court operations + read access';
  RAISE NOTICE '  ✓ court_officer - Building operations + read access';
  RAISE NOTICE '  ✓ court_aide - Supply operations + issue management';
  RAISE NOTICE '  ✓ purchasing - Read access (write access TBD in Phase 9)';
  RAISE NOTICE '  ✓ standard - Read access + own data management';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Apply this migration and test with each role';
END $$;
