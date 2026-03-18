-- =============================================================================
-- Migration 030: Row-Level Security for all core tables
--
-- Without RLS, any authenticated user can read/write every table via the
-- Supabase REST API (anon/authenticated key).  This migration enables RLS
-- on every unprotected production table and adds the minimum required policies.
--
-- Helper functions are SECURITY DEFINER so they can bypass RLS when called
-- from inside another table's policy (avoids infinite recursion on user_roles).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper functions
-- ---------------------------------------------------------------------------

-- Returns true if the current user is an admin.
-- SECURITY DEFINER + search_path=public means this runs as the function owner
-- and can read user_roles even while user_roles itself has RLS enabled.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Returns true if the current user has any of the supplied roles.
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles text[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = ANY(required_roles)
  );
$$;

-- Convenience: admin OR cmc (the two privileged management roles).
CREATE OR REPLACE FUNCTION public.is_privileged()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'cmc')
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. user_roles
-- Critical: prevents privilege escalation via direct REST writes.
-- Policies use auth.uid() directly (no helper call) to avoid recursion.
-- ---------------------------------------------------------------------------
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_read_own ON user_roles;
CREATE POLICY user_roles_read_own ON user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin()
  );

DROP POLICY IF EXISTS user_roles_write_admin ON user_roles;
CREATE POLICY user_roles_write_admin ON user_roles
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

-- ---------------------------------------------------------------------------
-- 3. Spatial hierarchy: buildings, floors, rooms
-- All authenticated staff need to read; only privileged users may write.
-- ---------------------------------------------------------------------------
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS buildings_read ON buildings;
CREATE POLICY buildings_read ON buildings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS buildings_write ON buildings;
CREATE POLICY buildings_write ON buildings
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

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

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rooms_read ON rooms;
CREATE POLICY rooms_read ON rooms
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS rooms_write ON rooms;
CREATE POLICY rooms_write ON rooms
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

-- ---------------------------------------------------------------------------
-- 4. Issues
-- Any authenticated user can report; privileged users + assignees can update.
-- ---------------------------------------------------------------------------
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS issues_read ON issues;
CREATE POLICY issues_read ON issues
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS issues_insert ON issues;
CREATE POLICY issues_insert ON issues
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    OR reported_by = auth.uid()
    OR is_privileged()
  );

DROP POLICY IF EXISTS issues_update ON issues;
CREATE POLICY issues_update ON issues
  FOR UPDATE TO authenticated
  USING (
    is_privileged()
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  )
  WITH CHECK (
    is_privileged()
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS issues_delete ON issues;
CREATE POLICY issues_delete ON issues
  FOR DELETE TO authenticated
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 5. Court sessions and court rooms
-- Readable by all authenticated staff; writable only by privileged users.
-- ---------------------------------------------------------------------------
ALTER TABLE court_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS court_sessions_read ON court_sessions;
CREATE POLICY court_sessions_read ON court_sessions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS court_sessions_write ON court_sessions;
CREATE POLICY court_sessions_write ON court_sessions
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

ALTER TABLE court_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS court_rooms_read ON court_rooms;
CREATE POLICY court_rooms_read ON court_rooms
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS court_rooms_write ON court_rooms;
CREATE POLICY court_rooms_write ON court_rooms
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

-- ---------------------------------------------------------------------------
-- 6. Supply requests and items
-- Requesters see/edit own; court_aide/admin/cmc see and fulfill all.
-- ---------------------------------------------------------------------------
ALTER TABLE supply_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supply_requests_read ON supply_requests;
CREATE POLICY supply_requests_read ON supply_requests
  FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid()
    OR has_any_role(ARRAY['admin', 'cmc', 'court_aide'])
  );

DROP POLICY IF EXISTS supply_requests_insert ON supply_requests;
CREATE POLICY supply_requests_insert ON supply_requests
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS supply_requests_update ON supply_requests;
CREATE POLICY supply_requests_update ON supply_requests
  FOR UPDATE TO authenticated
  USING (
    requester_id = auth.uid()
    OR has_any_role(ARRAY['admin', 'cmc', 'court_aide'])
  )
  WITH CHECK (
    requester_id = auth.uid()
    OR has_any_role(ARRAY['admin', 'cmc', 'court_aide'])
  );

DROP POLICY IF EXISTS supply_requests_delete ON supply_requests;
CREATE POLICY supply_requests_delete ON supply_requests
  FOR DELETE TO authenticated
  USING (is_admin());

ALTER TABLE supply_request_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supply_request_items_read ON supply_request_items;
CREATE POLICY supply_request_items_read ON supply_request_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM supply_requests sr
      WHERE sr.id = request_id
        AND (
          sr.requester_id = auth.uid()
          OR has_any_role(ARRAY['admin', 'cmc', 'court_aide'])
        )
    )
  );

DROP POLICY IF EXISTS supply_request_items_insert ON supply_request_items;
CREATE POLICY supply_request_items_insert ON supply_request_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supply_requests sr
      WHERE sr.id = request_id
        AND (
          sr.requester_id = auth.uid()
          OR has_any_role(ARRAY['admin', 'cmc', 'court_aide'])
        )
    )
  );

DROP POLICY IF EXISTS supply_request_items_update ON supply_request_items;
CREATE POLICY supply_request_items_update ON supply_request_items
  FOR UPDATE TO authenticated
  USING (has_any_role(ARRAY['admin', 'cmc', 'court_aide']))
  WITH CHECK (has_any_role(ARRAY['admin', 'cmc', 'court_aide']));

-- ---------------------------------------------------------------------------
-- 7. Inventory
-- Readable by all authenticated; writable by privileged + court_aide.
-- ---------------------------------------------------------------------------
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_items_read ON inventory_items;
CREATE POLICY inventory_items_read ON inventory_items
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS inventory_items_write ON inventory_items;
CREATE POLICY inventory_items_write ON inventory_items
  FOR ALL TO authenticated
  USING (has_any_role(ARRAY['admin', 'cmc', 'court_aide']))
  WITH CHECK (has_any_role(ARRAY['admin', 'cmc', 'court_aide']));

ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_categories_read ON inventory_categories;
CREATE POLICY inventory_categories_read ON inventory_categories
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS inventory_categories_write ON inventory_categories;
CREATE POLICY inventory_categories_write ON inventory_categories
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

-- ---------------------------------------------------------------------------
-- 8. Key requests and assignments
-- Users see own requests; admin/cmc manage all.
-- ---------------------------------------------------------------------------
ALTER TABLE key_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS key_requests_read ON key_requests;
CREATE POLICY key_requests_read ON key_requests
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_privileged()
  );

DROP POLICY IF EXISTS key_requests_insert ON key_requests;
CREATE POLICY key_requests_insert ON key_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS key_requests_update ON key_requests;
CREATE POLICY key_requests_update ON key_requests
  FOR UPDATE TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

DROP POLICY IF EXISTS key_requests_delete ON key_requests;
CREATE POLICY key_requests_delete ON key_requests
  FOR DELETE TO authenticated
  USING (is_admin());

ALTER TABLE key_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS key_assignments_read ON key_assignments;
CREATE POLICY key_assignments_read ON key_assignments
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_privileged()
  );

DROP POLICY IF EXISTS key_assignments_write ON key_assignments;
CREATE POLICY key_assignments_write ON key_assignments
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

-- ---------------------------------------------------------------------------
-- 9. Lighting
-- Readable by all; writable by admin only (facilities management).
-- ---------------------------------------------------------------------------
ALTER TABLE lighting_fixtures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lighting_fixtures_read ON lighting_fixtures;
CREATE POLICY lighting_fixtures_read ON lighting_fixtures
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS lighting_fixtures_write ON lighting_fixtures;
CREATE POLICY lighting_fixtures_write ON lighting_fixtures
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

ALTER TABLE lighting_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lighting_issues_read ON lighting_issues;
CREATE POLICY lighting_issues_read ON lighting_issues
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS lighting_issues_write ON lighting_issues;
CREATE POLICY lighting_issues_write ON lighting_issues
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

ALTER TABLE lighting_maintenance_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lighting_maintenance_read ON lighting_maintenance_schedules;
CREATE POLICY lighting_maintenance_read ON lighting_maintenance_schedules
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS lighting_maintenance_write ON lighting_maintenance_schedules;
CREATE POLICY lighting_maintenance_write ON lighting_maintenance_schedules
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

ALTER TABLE walkthrough_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS walkthrough_sessions_read ON walkthrough_sessions;
CREATE POLICY walkthrough_sessions_read ON walkthrough_sessions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS walkthrough_sessions_write ON walkthrough_sessions;
CREATE POLICY walkthrough_sessions_write ON walkthrough_sessions
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

ALTER TABLE fixture_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fixture_scans_read ON fixture_scans;
CREATE POLICY fixture_scans_read ON fixture_scans
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS fixture_scans_insert ON fixture_scans;
CREATE POLICY fixture_scans_insert ON fixture_scans
  FOR INSERT TO authenticated
  WITH CHECK (scanned_by = auth.uid());

DROP POLICY IF EXISTS fixture_scans_write_admin ON fixture_scans;
CREATE POLICY fixture_scans_write_admin ON fixture_scans
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 10. Occupants and room assignments
-- Privileged users manage; individuals can read own assignment.
-- ---------------------------------------------------------------------------
ALTER TABLE occupants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS occupants_read ON occupants;
CREATE POLICY occupants_read ON occupants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_privileged()
  );

DROP POLICY IF EXISTS occupants_write ON occupants;
CREATE POLICY occupants_write ON occupants
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

ALTER TABLE occupant_room_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS occupant_room_assignments_read ON occupant_room_assignments;
CREATE POLICY occupant_room_assignments_read ON occupant_room_assignments
  FOR SELECT TO authenticated
  USING (
    occupant_id IN (SELECT id FROM occupants WHERE user_id = auth.uid())
    OR is_privileged()
  );

DROP POLICY IF EXISTS occupant_room_assignments_write ON occupant_room_assignments;
CREATE POLICY occupant_room_assignments_write ON occupant_room_assignments
  FOR ALL TO authenticated
  USING (is_privileged())
  WITH CHECK (is_privileged());

-- ---------------------------------------------------------------------------
-- 11. Audit / admin logs — admin read-only, service role writes
-- ---------------------------------------------------------------------------
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_read ON audit_logs;
CREATE POLICY audit_logs_read ON audit_logs
  FOR SELECT TO authenticated
  USING (is_admin());

-- No INSERT policy for authenticated — audit logs are written by SECURITY DEFINER
-- functions and edge functions using service_role only.

ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_actions_log_read ON admin_actions_log;
CREATE POLICY admin_actions_log_read ON admin_actions_log
  FOR SELECT TO authenticated
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 12. Departments — readable by all authenticated (used in profile joins)
-- ---------------------------------------------------------------------------
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS departments_read ON departments;
CREATE POLICY departments_read ON departments
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS departments_write ON departments;
CREATE POLICY departments_write ON departments
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 13. Ensure grants exist on all tables (Supabase requires both RLS + GRANT)
-- ---------------------------------------------------------------------------
GRANT SELECT ON buildings, floors, rooms TO authenticated;
GRANT SELECT ON issues TO authenticated;
GRANT INSERT, UPDATE ON issues TO authenticated;
GRANT SELECT ON court_sessions, court_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE ON supply_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON supply_request_items TO authenticated;
GRANT SELECT ON inventory_items, inventory_categories TO authenticated;
GRANT SELECT, INSERT ON key_requests TO authenticated;
GRANT SELECT ON key_assignments TO authenticated;
GRANT SELECT ON lighting_fixtures, lighting_issues, lighting_maintenance_schedules TO authenticated;
GRANT SELECT ON walkthrough_sessions TO authenticated;
GRANT SELECT, INSERT ON fixture_scans TO authenticated;
GRANT SELECT ON occupants TO authenticated;
GRANT SELECT ON occupant_room_assignments TO authenticated;
GRANT SELECT ON audit_logs, admin_actions_log TO authenticated;
GRANT SELECT ON departments TO authenticated;
GRANT SELECT ON user_roles TO authenticated;
