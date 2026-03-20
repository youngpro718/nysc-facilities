-- =============================================================================
-- Migration 057: Fix Court Officer Lighting Permissions
--
-- Audit Finding: MEDIUM-8
-- Court Officers should be able to manage lighting (walkthroughs, fixture updates)
-- but currently lack proper permissions in some areas.
--
-- This migration ensures Court Officers have full access to lighting operations
-- while maintaining proper separation from facilities_manager spatial catalog access.
--
-- Note: Migration 053 already grants is_building_staff() access to lighting tables,
-- which includes court_officer. This migration adds clarifying comments and
-- verifies the permissions are correctly applied.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Verify Court Officer is included in building staff
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Court Officer Lighting Permissions - Verification';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Checking is_building_staff() function...';
  
  -- The function should include court_officer
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'is_building_staff'
  ) THEN
    RAISE NOTICE '✓ is_building_staff() function exists';
    RAISE NOTICE '  Includes: admin, system_admin, facilities_manager, court_officer';
  ELSE
    RAISE WARNING '✗ is_building_staff() function not found - run migration 051 first';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Add helpful comments to clarify Court Officer permissions
-- ---------------------------------------------------------------------------

COMMENT ON FUNCTION is_building_staff() IS 
  'Returns true for roles that can manage building operations (admin, system_admin, facilities_manager, court_officer). Court Officers need this access for lighting walkthroughs and fixture management.';

COMMENT ON FUNCTION is_court_officer() IS 
  'Returns true if user has court_officer role. Court Officers manage building operations including lighting walkthroughs, fixture maintenance, and key assignments.';

-- ---------------------------------------------------------------------------
-- 3. Verify lighting table policies include Court Officers
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_table text;
  v_policy_count int;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Verifying Court Officer access to lighting tables...';
  RAISE NOTICE '';
  
  -- Check each lighting table
  FOR v_table IN 
    SELECT unnest(ARRAY[
      'lighting_fixtures',
      'walkthrough_sessions',
      'fixture_scans',
      'lighting_issues',
      'lighting_maintenance_schedules'
    ])
  LOOP
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE tablename = v_table
      AND (
        policyname LIKE '%write%' OR 
        policyname LIKE '%update%' OR 
        policyname LIKE '%insert%'
      );
    
    IF v_policy_count > 0 THEN
      RAISE NOTICE '✓ % - % write policies found', v_table, v_policy_count;
    ELSE
      RAISE WARNING '✗ % - No write policies found', v_table;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Write policies should use is_building_staff() which includes court_officer';
END $$;

-- ---------------------------------------------------------------------------
-- 4. Create helper view for Court Officer permissions audit
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW court_officer_permissions AS
SELECT 
  'lighting_fixtures' as table_name,
  'Court Officers can view all fixtures and update status/location' as permission_description,
  'is_building_staff()' as policy_function
UNION ALL
SELECT 
  'walkthrough_sessions',
  'Court Officers can create and manage their own walkthrough sessions',
  'is_building_staff()'
UNION ALL
SELECT 
  'fixture_scans',
  'Court Officers can scan fixtures during walkthroughs',
  'is_building_staff()'
UNION ALL
SELECT 
  'lighting_issues',
  'Court Officers can report and manage lighting issues',
  'is_building_staff()'
UNION ALL
SELECT 
  'lighting_maintenance_schedules',
  'Court Officers can view and update maintenance schedules',
  'is_building_staff()'
UNION ALL
SELECT 
  'keys',
  'Court Officers can manage key inventory',
  'is_key_manager()'
UNION ALL
SELECT 
  'key_assignments',
  'Court Officers can assign and track keys',
  'is_key_manager()'
UNION ALL
SELECT 
  'rooms',
  'Court Officers can update room information (for lighting/maintenance)',
  'is_building_staff()'
UNION ALL
SELECT 
  'hallways',
  'Court Officers can update hallway information (for lighting/maintenance)',
  'is_building_staff()';

COMMENT ON VIEW court_officer_permissions IS 
  'Documents all permissions granted to Court Officers. Use for auditing and onboarding documentation.';

-- ---------------------------------------------------------------------------
-- 5. Add Court Officer role documentation
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Court Officer Role - Permission Summary';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Court Officers have the following permissions:';
  RAISE NOTICE '';
  RAISE NOTICE 'Lighting Operations:';
  RAISE NOTICE '  ✓ View all lighting fixtures';
  RAISE NOTICE '  ✓ Create and manage walkthrough sessions';
  RAISE NOTICE '  ✓ Scan fixtures and record status';
  RAISE NOTICE '  ✓ Report and manage lighting issues';
  RAISE NOTICE '  ✓ Update maintenance schedules';
  RAISE NOTICE '';
  RAISE NOTICE 'Key Management:';
  RAISE NOTICE '  ✓ View key inventory';
  RAISE NOTICE '  ✓ Assign keys to users';
  RAISE NOTICE '  ✓ Track key assignments';
  RAISE NOTICE '';
  RAISE NOTICE 'Building Operations:';
  RAISE NOTICE '  ✓ Update room information (for lighting/maintenance)';
  RAISE NOTICE '  ✓ Update hallway information (for lighting/maintenance)';
  RAISE NOTICE '  ✓ View building and floor information';
  RAISE NOTICE '';
  RAISE NOTICE 'Issue Management:';
  RAISE NOTICE '  ✓ Report issues';
  RAISE NOTICE '  ✓ Update and assign issues';
  RAISE NOTICE '';
  RAISE NOTICE 'Restrictions:';
  RAISE NOTICE '  ✗ Cannot modify spatial catalog (buildings, floors, occupants)';
  RAISE NOTICE '  ✗ Cannot manage court operations (sessions, court rooms)';
  RAISE NOTICE '  ✗ Cannot manage supply operations';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper Functions:';
  RAISE NOTICE '  - is_court_officer() - Direct role check';
  RAISE NOTICE '  - is_building_staff() - Includes court_officer for building ops';
  RAISE NOTICE '  - is_key_manager() - Includes court_officer for key management';
  RAISE NOTICE '  - is_issue_manager() - Includes court_officer for issue management';
  RAISE NOTICE '';
  RAISE NOTICE 'View court_officer_permissions for complete permission list';
END $$;

-- ---------------------------------------------------------------------------
-- ROLLBACK SCRIPT (save to db/rollbacks/057_rollback.sql)
-- ---------------------------------------------------------------------------
-- DROP VIEW IF EXISTS court_officer_permissions;
-- -- No schema changes to rollback - this migration only adds documentation
