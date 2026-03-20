-- =============================================================================
-- Migration 053: Add RLS Policies to Lighting Tables
--
-- Audit Finding: HIGH-11
-- Lighting tables (lighting_fixtures, walkthrough_sessions, fixture_scans, 
-- lighting_zones, lighting_issues, lighting_maintenance_schedules) currently
-- lack RLS policies, exposing data to unauthorized access.
--
-- Access Model:
-- - All authenticated users can VIEW lighting data
-- - Building staff (admin, facilities_manager, court_officer) can MANAGE lighting
-- - Admins have full access including DELETE
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. LIGHTING_FIXTURES TABLE
-- ---------------------------------------------------------------------------

ALTER TABLE lighting_fixtures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lighting_fixtures_read ON lighting_fixtures;
CREATE POLICY lighting_fixtures_read ON lighting_fixtures
  FOR SELECT TO authenticated
  USING (true); -- All authenticated users can view fixtures

DROP POLICY IF EXISTS lighting_fixtures_write ON lighting_fixtures;
CREATE POLICY lighting_fixtures_write ON lighting_fixtures
  FOR INSERT TO authenticated
  WITH CHECK (is_building_staff()); -- Building staff can create fixtures

DROP POLICY IF EXISTS lighting_fixtures_update ON lighting_fixtures;
CREATE POLICY lighting_fixtures_update ON lighting_fixtures
  FOR UPDATE TO authenticated
  USING (is_building_staff())
  WITH CHECK (is_building_staff());

DROP POLICY IF EXISTS lighting_fixtures_delete ON lighting_fixtures;
CREATE POLICY lighting_fixtures_delete ON lighting_fixtures
  FOR DELETE TO authenticated
  USING (is_admin()); -- Only admins can delete fixtures

-- ---------------------------------------------------------------------------
-- 2. LIGHTING_ZONES TABLE
-- ---------------------------------------------------------------------------

ALTER TABLE lighting_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lighting_zones_read ON lighting_zones;
CREATE POLICY lighting_zones_read ON lighting_zones
  FOR SELECT TO authenticated
  USING (true); -- All authenticated users can view zones

DROP POLICY IF EXISTS lighting_zones_write ON lighting_zones;
CREATE POLICY lighting_zones_write ON lighting_zones
  FOR ALL TO authenticated
  USING (is_privileged()) -- Only privileged users can manage zones
  WITH CHECK (is_privileged());

-- ---------------------------------------------------------------------------
-- 3. WALKTHROUGH_SESSIONS TABLE
-- ---------------------------------------------------------------------------

ALTER TABLE walkthrough_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS walkthrough_sessions_read ON walkthrough_sessions;
CREATE POLICY walkthrough_sessions_read ON walkthrough_sessions
  FOR SELECT TO authenticated
  USING (true); -- All authenticated users can view walkthrough sessions

DROP POLICY IF EXISTS walkthrough_sessions_write ON walkthrough_sessions;
CREATE POLICY walkthrough_sessions_write ON walkthrough_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    is_building_staff() AND
    started_by = auth.uid() -- Can only create sessions for themselves
  );

DROP POLICY IF EXISTS walkthrough_sessions_update ON walkthrough_sessions;
CREATE POLICY walkthrough_sessions_update ON walkthrough_sessions
  FOR UPDATE TO authenticated
  USING (
    is_building_staff() AND
    (started_by = auth.uid() OR is_admin()) -- Can update own sessions or admin can update any
  )
  WITH CHECK (
    is_building_staff() AND
    (started_by = auth.uid() OR is_admin())
  );

DROP POLICY IF EXISTS walkthrough_sessions_delete ON walkthrough_sessions;
CREATE POLICY walkthrough_sessions_delete ON walkthrough_sessions
  FOR DELETE TO authenticated
  USING (is_admin()); -- Only admins can delete sessions

-- ---------------------------------------------------------------------------
-- 4. FIXTURE_SCANS TABLE
-- ---------------------------------------------------------------------------

ALTER TABLE fixture_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fixture_scans_read ON fixture_scans;
CREATE POLICY fixture_scans_read ON fixture_scans
  FOR SELECT TO authenticated
  USING (true); -- All authenticated users can view scans

DROP POLICY IF EXISTS fixture_scans_write ON fixture_scans;
CREATE POLICY fixture_scans_write ON fixture_scans
  FOR INSERT TO authenticated
  WITH CHECK (
    is_building_staff() AND
    scanned_by = auth.uid() -- Can only create scans for themselves
  );

DROP POLICY IF EXISTS fixture_scans_update ON fixture_scans;
CREATE POLICY fixture_scans_update ON fixture_scans
  FOR UPDATE TO authenticated
  USING (is_admin()) -- Only admins can update scans (audit trail protection)
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS fixture_scans_delete ON fixture_scans;
CREATE POLICY fixture_scans_delete ON fixture_scans
  FOR DELETE TO authenticated
  USING (is_admin()); -- Only admins can delete scans

-- ---------------------------------------------------------------------------
-- 5. LIGHTING_ISSUES TABLE
-- ---------------------------------------------------------------------------

ALTER TABLE lighting_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lighting_issues_read ON lighting_issues;
CREATE POLICY lighting_issues_read ON lighting_issues
  FOR SELECT TO authenticated
  USING (true); -- All authenticated users can view lighting issues

DROP POLICY IF EXISTS lighting_issues_write ON lighting_issues;
CREATE POLICY lighting_issues_write ON lighting_issues
  FOR INSERT TO authenticated
  WITH CHECK (
    is_building_staff() AND
    reported_by = auth.uid() -- Can only create issues for themselves
  );

DROP POLICY IF EXISTS lighting_issues_update ON lighting_issues;
CREATE POLICY lighting_issues_update ON lighting_issues
  FOR UPDATE TO authenticated
  USING (
    is_building_staff() AND
    (reported_by = auth.uid() OR is_admin()) -- Can update own issues or admin can update any
  )
  WITH CHECK (
    is_building_staff() AND
    (reported_by = auth.uid() OR is_admin())
  );

DROP POLICY IF EXISTS lighting_issues_delete ON lighting_issues;
CREATE POLICY lighting_issues_delete ON lighting_issues
  FOR DELETE TO authenticated
  USING (is_admin()); -- Only admins can delete issues

-- ---------------------------------------------------------------------------
-- 6. LIGHTING_MAINTENANCE_SCHEDULES TABLE
-- ---------------------------------------------------------------------------

ALTER TABLE lighting_maintenance_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lighting_maintenance_schedules_read ON lighting_maintenance_schedules;
CREATE POLICY lighting_maintenance_schedules_read ON lighting_maintenance_schedules
  FOR SELECT TO authenticated
  USING (true); -- All authenticated users can view maintenance schedules

DROP POLICY IF EXISTS lighting_maintenance_schedules_write ON lighting_maintenance_schedules;
CREATE POLICY lighting_maintenance_schedules_write ON lighting_maintenance_schedules
  FOR ALL TO authenticated
  USING (is_building_staff()) -- Building staff can manage schedules
  WITH CHECK (is_building_staff());

-- ---------------------------------------------------------------------------
-- 7. Add helpful comments
-- ---------------------------------------------------------------------------

COMMENT ON TABLE lighting_fixtures IS 'Lighting fixtures in buildings. RLS: All read, building staff write, admin delete.';
COMMENT ON TABLE lighting_zones IS 'Lighting zones for grouping fixtures. RLS: All read, privileged write.';
COMMENT ON TABLE walkthrough_sessions IS 'Lighting walkthrough sessions. RLS: All read, building staff create/update own, admin delete.';
COMMENT ON TABLE fixture_scans IS 'Individual fixture scans during walkthroughs. RLS: All read, building staff create, admin update/delete.';
COMMENT ON TABLE lighting_issues IS 'Lighting-specific issues. RLS: All read, building staff create/update own, admin delete.';
COMMENT ON TABLE lighting_maintenance_schedules IS 'Maintenance schedules for fixtures. RLS: All read, building staff write.';

-- ---------------------------------------------------------------------------
-- 8. Verification
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_tables text[] := ARRAY[
    'lighting_fixtures',
    'lighting_zones',
    'walkthrough_sessions',
    'fixture_scans',
    'lighting_issues',
    'lighting_maintenance_schedules'
  ];
  v_table text;
  v_rls_enabled boolean;
  v_policy_count int;
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Lighting Tables RLS Policy Verification';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  
  FOREACH v_table IN ARRAY v_tables
  LOOP
    -- Check if RLS is enabled
    SELECT relrowsecurity INTO v_rls_enabled
    FROM pg_class
    WHERE relname = v_table;
    
    -- Count policies
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE tablename = v_table;
    
    IF v_rls_enabled THEN
      RAISE NOTICE '✓ % - RLS enabled, % policies', v_table, v_policy_count;
    ELSE
      RAISE WARNING '✗ % - RLS NOT enabled', v_table;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Access Summary:';
  RAISE NOTICE '  - All authenticated users: READ all lighting data';
  RAISE NOTICE '  - Building staff (admin, facilities_manager, court_officer): WRITE fixtures, issues, walkthroughs';
  RAISE NOTICE '  - Privileged users (admin, facilities_manager): WRITE zones';
  RAISE NOTICE '  - Admins only: DELETE any lighting data';
  RAISE NOTICE '';
  RAISE NOTICE 'Building staff includes:';
  RAISE NOTICE '  - admin';
  RAISE NOTICE '  - system_admin';
  RAISE NOTICE '  - facilities_manager';
  RAISE NOTICE '  - court_officer (for lighting walkthroughs)';
END $$;
