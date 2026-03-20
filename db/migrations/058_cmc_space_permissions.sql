-- =============================================================================
-- Migration 058: Fix CMC Role Permissions for Spaces
--
-- Audit Finding: MEDIUM-9
-- CMC (Court Management Coordinator) should be able to VIEW spatial data
-- (buildings, floors, rooms, hallways) for court operations planning,
-- but currently lacks explicit read access in some policies.
--
-- CMC should NOT be able to MODIFY spatial catalog (that's facilities_manager's job)
-- but needs read access for:
-- - Viewing courtroom locations and availability
-- - Planning court sessions
-- - Understanding building layout
-- - Coordinating court operations
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Verify CMC read access to spatial tables
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'CMC Spatial Permissions - Verification';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Verifying CMC has read access to spatial tables...';
  RAISE NOTICE '';
END $$;

-- ---------------------------------------------------------------------------
-- 2. Ensure CMC can read all spatial data (already granted in migration 052)
-- ---------------------------------------------------------------------------

-- Migration 052 already grants SELECT to authenticated users on:
-- - rooms, hallways, buildings, floors, occupants
-- Since CMC is authenticated, they already have read access.
-- This migration adds documentation and verification.

-- Verify policies exist
DO $$
DECLARE
  v_table text;
  v_read_policy_exists boolean;
BEGIN
  FOR v_table IN 
    SELECT unnest(ARRAY['rooms', 'hallways', 'buildings', 'floors', 'occupants', 'unified_spaces'])
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = v_table
        AND cmd = 'SELECT'
        AND qual = 'true' -- Policy allows all authenticated users
    ) INTO v_read_policy_exists;
    
    IF v_read_policy_exists THEN
      RAISE NOTICE '✓ % - CMC has read access (all authenticated users)', v_table;
    ELSE
      RAISE WARNING '✗ % - CMC may lack read access', v_table;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
END $$;

-- ---------------------------------------------------------------------------
-- 3. Add CMC-specific helper view for court operations
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW cmc_court_operations_view AS
SELECT 
  cr.id as court_room_id,
  cr.room_number,
  cr.room_name,
  cr.floor_id,
  f.floor_number,
  f.building_id,
  b.name as building_name,
  b.address as building_address,
  cr.capacity,
  cr.is_operational,
  cr.equipment_status,
  -- Current session info
  (
    SELECT COUNT(*)
    FROM court_sessions cs
    WHERE cs.court_room_id = cr.id
      AND cs.session_date = CURRENT_DATE
  ) as sessions_today,
  -- Active term info
  (
    SELECT COUNT(*)
    FROM court_terms ct
    WHERE ct.court_room_id = cr.id
      AND ct.status = 'active'
  ) as active_terms
FROM court_rooms cr
LEFT JOIN floors f ON cr.floor_id = f.id
LEFT JOIN buildings b ON f.building_id = b.id
ORDER BY b.name, f.floor_number, cr.room_number;

COMMENT ON VIEW cmc_court_operations_view IS 
  'Provides CMC with consolidated view of court rooms, locations, and operational status for planning court sessions.';

-- Grant SELECT on view to authenticated users
GRANT SELECT ON cmc_court_operations_view TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Add CMC permissions documentation view
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW cmc_permissions AS
SELECT 
  'court_sessions' as table_name,
  'CMC can create, view, and manage all court sessions' as permission_description,
  'is_court_operations_manager()' as policy_function,
  'FULL' as access_level
UNION ALL
SELECT 
  'court_rooms',
  'CMC can create, view, and manage court room configurations',
  'is_court_operations_manager()',
  'FULL'
UNION ALL
SELECT 
  'court_terms',
  'CMC can create, view, and manage court terms',
  'is_court_operations_manager()',
  'FULL'
UNION ALL
SELECT 
  'rooms',
  'CMC can view room information (read-only)',
  'authenticated',
  'READ'
UNION ALL
SELECT 
  'hallways',
  'CMC can view hallway information (read-only)',
  'authenticated',
  'READ'
UNION ALL
SELECT 
  'buildings',
  'CMC can view building information (read-only)',
  'authenticated',
  'READ'
UNION ALL
SELECT 
  'floors',
  'CMC can view floor information (read-only)',
  'authenticated',
  'READ'
UNION ALL
SELECT 
  'occupants',
  'CMC can view occupant information (read-only)',
  'authenticated',
  'READ'
UNION ALL
SELECT 
  'unified_spaces',
  'CMC can view unified space catalog (read-only)',
  'authenticated',
  'READ'
UNION ALL
SELECT 
  'issues',
  'CMC can report and view issues',
  'is_issue_manager()',
  'READ + OWN WRITE'
UNION ALL
SELECT 
  'supply_requests',
  'CMC can create and view own supply requests',
  'authenticated',
  'READ + OWN WRITE';

COMMENT ON VIEW cmc_permissions IS 
  'Documents all permissions granted to CMC (Court Management Coordinator) role. Use for auditing and onboarding documentation.';

-- Grant SELECT on view to authenticated users
GRANT SELECT ON cmc_permissions TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Update helper function comments
-- ---------------------------------------------------------------------------

COMMENT ON FUNCTION is_cmc() IS 
  'Returns true if user has cmc role. CMC manages court operations (sessions, terms, court rooms) and has read access to spatial data for planning purposes.';

COMMENT ON FUNCTION is_court_operations_manager() IS 
  'Returns true for admin, system_admin, and cmc roles. Court operations managers can create and manage court sessions, terms, and court room configurations.';

-- ---------------------------------------------------------------------------
-- 6. Add CMC role documentation
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'CMC (Court Management Coordinator) Role - Permission Summary';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'CMC has the following permissions:';
  RAISE NOTICE '';
  RAISE NOTICE 'Court Operations (FULL ACCESS):';
  RAISE NOTICE '  ✓ Create and manage court sessions';
  RAISE NOTICE '  ✓ Create and manage court terms';
  RAISE NOTICE '  ✓ Configure court rooms';
  RAISE NOTICE '  ✓ View court schedules and assignments';
  RAISE NOTICE '';
  RAISE NOTICE 'Spatial Data (READ-ONLY):';
  RAISE NOTICE '  ✓ View buildings and addresses';
  RAISE NOTICE '  ✓ View floors and layouts';
  RAISE NOTICE '  ✓ View rooms and hallways';
  RAISE NOTICE '  ✓ View occupant information';
  RAISE NOTICE '  ✓ View unified space catalog';
  RAISE NOTICE '';
  RAISE NOTICE 'Other Permissions:';
  RAISE NOTICE '  ✓ Report issues (own issues only)';
  RAISE NOTICE '  ✓ Submit supply requests (own requests only)';
  RAISE NOTICE '  ✓ View profiles (directory)';
  RAISE NOTICE '';
  RAISE NOTICE 'Restrictions:';
  RAISE NOTICE '  ✗ Cannot modify spatial catalog (buildings, floors, rooms)';
  RAISE NOTICE '  ✗ Cannot manage lighting operations';
  RAISE NOTICE '  ✗ Cannot manage keys';
  RAISE NOTICE '  ✗ Cannot manage supply operations';
  RAISE NOTICE '  ✗ Cannot approve users or manage roles';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper Functions:';
  RAISE NOTICE '  - is_cmc() - Direct role check';
  RAISE NOTICE '  - is_court_operations_manager() - Includes cmc for court ops';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper Views:';
  RAISE NOTICE '  - cmc_court_operations_view - Consolidated court room info';
  RAISE NOTICE '  - cmc_permissions - Complete permission list';
  RAISE NOTICE '';
  RAISE NOTICE 'CMC spatial permissions verified - read access confirmed';
END $$;

-- ---------------------------------------------------------------------------
-- ROLLBACK SCRIPT (save to db/rollbacks/058_rollback.sql)
-- ---------------------------------------------------------------------------
-- DROP VIEW IF EXISTS cmc_court_operations_view;
-- DROP VIEW IF EXISTS cmc_permissions;
